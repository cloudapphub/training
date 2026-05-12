export const eksCfnLessons = [
  {
    time: "Lesson 1",
    title: "Architecture Overview — 3-Tier App on EKS with CloudFormation",
    concept: [
      "**The three tiers.** Frontend: a React/Nginx container served behind an AWS Application Load Balancer (ALB). Backend: a Node.js or Spring Boot API container running in private subnets. Database: Amazon Aurora PostgreSQL in isolated DB subnets with no internet access. CloudFormation provisions the entire AWS infrastructure. Kubernetes manifests (applied via kubectl or Helm post-deploy) run the containers.",
      "**Why CloudFormation for EKS infrastructure?** CloudFormation manages the stateful, slow-changing AWS layer: VPC, subnets, security groups, EKS cluster, managed node groups, IAM roles, RDS, ECR, and ALB. Kubernetes YAML manages the fast-changing app layer: Deployments, Services, Ingress, HPA, PDBs. Separating them means you redeploy CloudFormation rarely (infra changes) but Kubernetes manifests frequently (every app release).",
      "**Security design.** Public subnets contain ONLY the ALB. Nodes live in private subnets — no public IPs. RDS lives in isolated DB subnets — no route to internet. IMDSv2 enforced on all nodes. IRSA gives each pod the minimum required AWS permissions. Secrets from Secrets Manager via Secrets Store CSI Driver — no secrets in environment variables or ConfigMaps. Network Policies restrict pod-to-pod traffic.",
      "**Resilience design.** EKS nodes span 3 Availability Zones. Topology spread constraints force pods across AZs. PodDisruptionBudgets prevent all replicas being evicted simultaneously. HorizontalPodAutoscaler scales pods on CPU/memory. Cluster Autoscaler scales nodes. Aurora Multi-AZ provides database HA with automatic failover. ALB health checks remove unhealthy pods from rotation before traffic hits them.",
      "**Deployment flow.** Step 1: `aws cloudformation deploy` — provisions VPC, EKS, RDS, IAM, ECR. Step 2: `aws eks update-kubeconfig` — connect kubectl to the new cluster. Step 3: Install cluster add-ons (ALB Controller, Cluster Autoscaler, Secrets Store CSI Driver) via Helm. Step 4: `docker build / docker push` — push app images to ECR. Step 5: `kubectl apply` — deploy frontend, backend, Ingress. Step 6: Validate via ALB DNS.",
    ],
    code: `# Full deployment flow — end to end

# 1. Deploy all AWS infrastructure
aws cloudformation deploy \\
  --template-file infrastructure/root.yaml \\
  --stack-name three-tier-prod \\
  --parameter-overrides \\
      Environment=prod \\
      DBPassword=\$(aws secretsmanager get-random-password --query RandomPassword --output text) \\
  --capabilities CAPABILITY_NAMED_IAM \\
  --region us-east-1

# 2. Connect kubectl
aws eks update-kubeconfig \\
  --name \$(aws cloudformation describe-stacks \\
    --stack-name three-tier-prod \\
    --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \\
    --output text) \\
  --region us-east-1

kubectl get nodes -o wide
# NAME              STATUS  ROLES   AZ
# ip-10-0-1-x      Ready   <none>  us-east-1a
# ip-10-0-2-x      Ready   <none>  us-east-1b
# ip-10-0-3-x      Ready   <none>  us-east-1c

# 3. Install cluster add-ons
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \\
  -n kube-system \\
  --set clusterName=three-tier-prod \\
  --set serviceAccount.create=false \\
  --set serviceAccount.name=aws-load-balancer-controller

# 4. Build and push to ECR
ECR=\$(aws cloudformation describe-stacks --stack-name three-tier-prod \\
  --query "Stacks[0].Outputs[?OutputKey=='ECRBackend'].OutputValue" --output text)
aws ecr get-login-password | docker login --username AWS --password-stdin \$ECR
docker build -t backend ./backend && docker tag backend:latest \$ECR:latest
docker push \$ECR:latest

# 5. Deploy app to Kubernetes
kubectl apply -f k8s/
kubectl rollout status deployment/backend -n app
kubectl rollout status deployment/frontend -n app`,
    practice: "Draw the network flow from a user's browser to the database. For each hop, identify: what AWS resource handles it, which subnet tier it lives in, and what security control (SG, NACL, Network Policy) protects it.",
    solution: `User Browser
  → Internet Gateway (public)
  → ALB (public subnet, SG: allow 443 inbound from 0.0.0.0/0)
  → Frontend pod (private subnet, SG: allow 80 from ALB SG only)
  → Backend pod (private subnet, SG: allow 8080 from Frontend SG only,
                 Network Policy: allow from frontend namespace only)
  → Aurora RDS (DB subnet, SG: allow 5432 from Node SG only,
                no internet route, encrypted at rest + in transit)`,
  },
  {
    time: "Lesson 2",
    title: "VPC & Networking — CloudFormation Foundation",
    concept: [
      "**Three subnet tiers.** Public subnets (one per AZ): contain only the ALB and NAT Gateways. Private subnets (one per AZ): contain EKS worker nodes. DB subnets (one per AZ): contain RDS/Aurora — no NAT, no internet route. Nodes access the internet (for ECR pulls, SSM) via NAT Gateways in the public subnets.",
      "**Subnet tagging for Kubernetes.** EKS and the ALB Controller use specific tags to discover subnets. Public subnets need `kubernetes.io/role/elb: 1` (for internet-facing ALBs). Private subnets need `kubernetes.io/role/internal-elb: 1` (for internal ALBs). Both need `kubernetes.io/cluster/<cluster-name>: shared`. Without these tags, the ALB Controller cannot provision load balancers.",
      "**VPC Endpoints for private clusters.** Nodes in private subnets need to reach ECR, S3, EC2, EKS APIs, Secrets Manager, and SSM without going through the internet. Use VPC Interface Endpoints for: `ecr.api`, `ecr.dkr`, `ec2`, `eks`, `secretsmanager`, `ssm`, `ssmmessages`. Add a VPC Gateway Endpoint for S3 (free, required for ECR layer downloads). This keeps all traffic on the AWS backbone.",
      "**Security Groups design.** Four distinct SGs: (1) ALB SG — allows 80/443 inbound from 0.0.0.0/0. (2) Node SG — allows all traffic from the ALB SG, allows pod-to-pod within the SG. (3) RDS SG — allows 5432 from Node SG only. (4) VPC Endpoint SG — allows 443 from Node SG (so nodes can reach AWS APIs). Never use 0.0.0.0/0 on any SG other than the ALB.",
    ],
    code: `AWSTemplateFormatVersion: '2010-09-09'
Description: VPC Foundation for 3-Tier EKS Application

Parameters:
  ClusterName:
    Type: String
    Default: three-tier-prod
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${ClusterName}-vpc'

  # ── PUBLIC SUBNETS (ALB + NAT GWs) ──────────────────────
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-1a
        - Key: kubernetes.io/role/elb
          Value: '1'
        - Key: !Sub 'kubernetes.io/cluster/\${ClusterName}'
          Value: shared

  # (PublicSubnet2, PublicSubnet3 follow same pattern for 1b, 1c)

  # ── PRIVATE SUBNETS (EKS Nodes) ─────────────────────────
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: private-1a
        - Key: kubernetes.io/role/internal-elb
          Value: '1'
        - Key: !Sub 'kubernetes.io/cluster/\${ClusterName}'
          Value: shared

  # ── DB SUBNETS (RDS — no internet route) ────────────────
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: db-1a

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB — internet-facing
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  NodeSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: EKS Nodes
      VpcId: !Ref VPC

  NodeFromALBIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref NodeSecurityGroup
      IpProtocol: tcp
      FromPort: 1025
      ToPort: 65535
      SourceSecurityGroupId: !Ref ALBSecurityGroup

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS — nodes only
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref NodeSecurityGroup

Outputs:
  VpcId:
    Value: !Ref VPC
    Export:
      Name: !Sub '\${AWS::StackName}-VpcId'
  PrivateSubnets:
    Value: !Join [',', [!Ref PrivateSubnet1]]
    Export:
      Name: !Sub '\${AWS::StackName}-PrivateSubnets'`,
    practice: "Add a VPC Gateway Endpoint for S3 and an Interface Endpoint for ECR API to the template. Associate the S3 endpoint with the private route tables so node ECR pulls stay on the AWS backbone.",
    solution: `  S3GatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.s3'
      RouteTableIds: [!Ref PrivateRouteTable]
      VpcEndpointType: Gateway

  ECRApiEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.ecr.api'
      VpcEndpointType: Interface
      SubnetIds: [!Ref PrivateSubnet1]
      SecurityGroupIds: [!Ref EndpointSG]
      PrivateDnsEnabled: true`,
  },
  {
    time: "Lesson 3",
    title: "EKS Cluster & Node Groups — CloudFormation",
    concept: [
      "**EKS cluster CloudFormation resource.** `AWS::EKS::Cluster` provisions the managed control plane. Key properties: `Version` (pin to a specific minor version like `1.29`), `ResourcesVpcConfig` (which subnets the control plane ENIs land in — use private subnets), `EndpointPrivateAccess: true` + `EndpointPublicAccess: false` for production, and `Logging` to enable API server, audit, authenticator, controller manager, and scheduler logs to CloudWatch.",
      "**Three node groups for workload segregation.** System node group: 2x `t3.large` On-Demand, tainted `CriticalAddonsOnly=true:NoSchedule` — runs CoreDNS, kube-proxy, ALB Controller, Cluster Autoscaler. App node group: `m5.xlarge` On-Demand — runs your backend and frontend pods. Spot node group: mixed `m5/m5a/m6i.large` Spot — runs batch jobs, background workers. Each group has its own `updateConfig` for controlled rolling updates.",
      "**CAPABILITY_NAMED_IAM requirement.** The EKS node IAM role needs specific AWS-managed policies: `AmazonEKSWorkerNodePolicy`, `AmazonEC2ContainerRegistryReadOnly`, `AmazonEKS_CNI_Policy`. CloudFormation will refuse to deploy IAM resources without `--capabilities CAPABILITY_NAMED_IAM`. Always include it in your deploy command.",
      "**aws-auth ConfigMap — node registration.** When a new node boots, it calls the EKS API with its node IAM role ARN. EKS checks the `aws-auth` ConfigMap in `kube-system` to authorize it. CloudFormation's `AWS::EKS::Cluster` handles this automatically for managed node groups — you don't need to manually edit `aws-auth` for nodes. You DO need to manually add entries for IAM users/roles that need kubectl access.",
      "**IMDSv2 enforcement.** Always set `HttpTokens: required` and `HttpPutResponseHopLimit: 1` in the node group's `LaunchTemplate`. This enforces IMDSv2 — attackers who compromise a container cannot steal the node IAM credentials via the metadata endpoint (SSRF attacks are blocked because they cannot follow the hop limit from within a container).",
    ],
    code: `# eks-cluster.yaml
Parameters:
  ClusterName:
    Type: String
  K8sVersion:
    Type: String
    Default: '1.29'
  PrivateSubnets:
    Type: List<AWS::EC2::Subnet::Id>
  NodeSecurityGroup:
    Type: AWS::EC2::SecurityGroup::Id

Resources:
  # ── Node IAM Role ────────────────────────────────────────
  NodeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '\${ClusterName}-node-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
        - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy

  # ── EKS Cluster ──────────────────────────────────────────
  EKSCluster:
    Type: AWS::EKS::Cluster
    Properties:
      Name: !Ref ClusterName
      Version: !Ref K8sVersion
      RoleArn: !GetAtt ClusterRole.Arn
      ResourcesVpcConfig:
        SubnetIds: !Ref PrivateSubnets
        SecurityGroupIds: [!Ref NodeSecurityGroup]
        EndpointPrivateAccess: true
        EndpointPublicAccess: false   # private cluster!
      Logging:
        ClusterLogging:
          EnabledTypes:
            - Type: api
            - Type: audit
            - Type: authenticator
      Tags:
        - Key: Environment
          Value: prod

  # ── Launch Template (IMDSv2 enforced) ───────────────────
  NodeLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        MetadataOptions:
          HttpTokens: required          # IMDSv2 mandatory
          HttpPutResponseHopLimit: 1    # blocks container SSRF
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 100
              VolumeType: gp3
              Encrypted: true

  # ── System Node Group (CoreDNS, ALB Controller) ─────────
  SystemNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: EKSCluster
    Properties:
      ClusterName: !Ref ClusterName
      NodegroupName: system
      NodeRole: !GetAtt NodeRole.Arn
      Subnets: !Ref PrivateSubnets
      AmiType: AL2023_x86_64_STANDARD
      InstanceTypes: [t3.large]
      CapacityType: ON_DEMAND
      ScalingConfig:
        MinSize: 2
        MaxSize: 3
        DesiredSize: 2
      LaunchTemplate:
        Id: !Ref NodeLaunchTemplate
        Version: !GetAtt NodeLaunchTemplate.LatestVersionNumber
      Labels:
        role: system
      Taints:
        - Key: CriticalAddonsOnly
          Value: 'true'
          Effect: NO_SCHEDULE
      UpdateConfig:
        MaxUnavailable: 1

  # ── App Node Group (Frontend + Backend pods) ─────────────
  AppNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: EKSCluster
    Properties:
      ClusterName: !Ref ClusterName
      NodegroupName: app
      NodeRole: !GetAtt NodeRole.Arn
      Subnets: !Ref PrivateSubnets
      AmiType: AL2023_x86_64_STANDARD
      InstanceTypes: [m5.xlarge, m5a.xlarge]
      CapacityType: ON_DEMAND
      ScalingConfig:
        MinSize: 3
        MaxSize: 10
        DesiredSize: 3
      LaunchTemplate:
        Id: !Ref NodeLaunchTemplate
        Version: !GetAtt NodeLaunchTemplate.LatestVersionNumber
      Labels:
        role: app
      UpdateConfig:
        MaxUnavailable: 1

Outputs:
  ClusterName:
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '\${AWS::StackName}-ClusterName'
  OIDCIssuer:
    Value: !GetAtt EKSCluster.OpenIdConnectIssuerUrl
    Export:
      Name: !Sub '\${AWS::StackName}-OIDCIssuer'`,
    practice: "Add a Spot node group to the template for batch workloads. Configure it with 4 instance types, taint it with `workload=spot:NoSchedule`, and set ScalingConfig min=0 max=20.",
    solution: `  SpotNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: EKSCluster
    Properties:
      ClusterName: !Ref ClusterName
      NodegroupName: spot
      NodeRole: !GetAtt NodeRole.Arn
      Subnets: !Ref PrivateSubnets
      AmiType: AL2023_x86_64_STANDARD
      InstanceTypes: [m5.large, m5a.large, m5d.large, m6i.large]
      CapacityType: SPOT
      ScalingConfig: {MinSize: 0, MaxSize: 20, DesiredSize: 0}
      Labels: {role: spot-worker}
      Taints:
        - Key: workload
          Value: spot
          Effect: NO_SCHEDULE`,
  },
  {
    time: "Lesson 4",
    title: "IAM & IRSA — Secure Pod-Level AWS Access",
    concept: [
      "**Why IRSA over node roles.** Without IRSA, every pod on a node inherits the node's IAM role — if the backend needs Secrets Manager access, ALL pods on that node get it. IRSA (IAM Roles for Service Accounts) binds an IAM role to a specific Kubernetes ServiceAccount. Only pods using that ServiceAccount get those AWS permissions. A compromised frontend pod cannot access backend secrets.",
      "**OIDC Provider — the bridge between Kubernetes and IAM.** EKS creates an OIDC identity provider URL (e.g., `oidc.eks.us-east-1.amazonaws.com/id/XXXXX`). You register this as an IAM Identity Provider in your account. Then IAM roles can trust this provider. When a pod with IRSA starts, EKS injects a projected service account token (JWT) into the pod. The AWS SDK exchanges this JWT at STS for temporary credentials for the role.",
      "**CloudFormation IRSA pattern.** (1) Fetch the OIDC issuer URL from the EKS cluster output. (2) Create an `AWS::IAM::OIDCProvider` resource. (3) Create IAM roles with a trust policy that specifies the OIDC provider ARN and the condition `StringEquals oidc:sub: system:serviceaccount:<namespace>:<sa-name>`. (4) Create the Kubernetes ServiceAccount (via kubectl or a Custom Resource) annotated with `eks.amazonaws.com/role-arn`.",
      "**Three IRSA roles for our app.** Backend role: allows `secretsmanager:GetSecretValue` on the DB secret and `s3:GetObject` on the app bucket. Frontend role: no AWS access needed (served as static files). ALB Controller role: allows `elasticloadbalancing:*`, `ec2:Describe*`, `cognito-idp:*`, `acm:*` (use the official AWS-provided policy). Cluster Autoscaler role: allows `autoscaling:SetDesiredCapacity`, `autoscaling:TerminateInstanceInAutoScalingGroup`.",
    ],
    code: `# irsa.yaml
Parameters:
  OIDCIssuerUrl:
    Type: String   # from EKS cluster output
  ClusterName:
    Type: String
  DBSecretArn:
    Type: String

Resources:
  # ── OIDC Provider ────────────────────────────────────────
  OIDCProvider:
    Type: AWS::IAM::OIDCProvider
    Properties:
      Url: !Ref OIDCIssuerUrl
      ClientIdList: [sts.amazonaws.com]
      # Thumbprint — use the official EKS OIDC thumbprint
      ThumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280']

  # ── Backend IRSA Role ────────────────────────────────────
  BackendIRSARole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '\${ClusterName}-backend-irsa'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Sub 'arn:aws:iam::\${AWS::AccountId}:oidc-provider/\${OIDCIssuerUrl}'
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                # Only the 'backend' SA in 'app' namespace can assume this role
                !Sub '\${OIDCIssuerUrl}:sub': 'system:serviceaccount:app:backend-sa'
                !Sub '\${OIDCIssuerUrl}:aud': 'sts.amazonaws.com'
      Policies:
        - PolicyName: backend-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref DBSecretArn
              - Effect: Allow
                Action: [s3:GetObject, s3:ListBucket]
                Resource:
                  - !Sub 'arn:aws:s3:::app-assets-\${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-assets-\${AWS::AccountId}/*'

Outputs:
  BackendRoleArn:
    Value: !GetAtt BackendIRSARole.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-BackendRoleArn'

---
# Kubernetes: Create the ServiceAccount with role annotation
# k8s/backend-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa
  namespace: app
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/three-tier-prod-backend-irsa

# Verify IRSA is working from inside a pod:
# kubectl exec -it backend-pod -n app -- aws sts get-caller-identity
# {
#   "Arn": "arn:aws:iam::123456789:assumed-role/three-tier-prod-backend-irsa/..."
# }`,
    practice: "Write the IRSA trust policy for the Cluster Autoscaler service account named `cluster-autoscaler` in the `kube-system` namespace. Then write the minimal IAM policy it needs to scale node groups.",
    solution: `# Trust policy (Condition key uses the OIDC issuer):
Condition:
  StringEquals:
    \${OIDCIssuer}:sub: system:serviceaccount:kube-system:cluster-autoscaler
    \${OIDCIssuer}:aud: sts.amazonaws.com

# Permissions policy:
Statement:
  - Effect: Allow
    Action:
      - autoscaling:DescribeAutoScalingGroups
      - autoscaling:DescribeAutoScalingInstances
      - autoscaling:DescribeLaunchConfigurations
      - autoscaling:SetDesiredCapacity
      - autoscaling:TerminateInstanceInAutoScalingGroup
      - ec2:DescribeLaunchTemplateVersions
    Resource: '*'`,
  },
  ,{
    time: "Lesson 5",
    title: "Database Tier — Aurora PostgreSQL via CloudFormation",
    concept: [
      "**Aurora PostgreSQL in DB subnets.** Aurora is deployed into isolated DB subnets with no internet route and no NAT gateway. The RDS security group only allows port 5432 inbound from the node security group. This means only EKS pods (running on those nodes) can reach the database — nothing else.",
      "**Secrets Manager integration.** Never pass database credentials as CloudFormation parameters (they appear in CloudFormation console and CloudTrail). Instead: (1) Create `AWS::SecretsManager::Secret` with a generated password using `GenerateSecretString`. (2) Pass the secret ARN to your backend pod via the Secrets Store CSI Driver — it mounts the secret as a file inside the container. (3) Spring Boot / Node.js reads the credential from the file at startup.",
      "**DeletionPolicy: Snapshot on Aurora.** Always set `DeletionPolicy: Snapshot` and `UpdateReplacePolicy: Snapshot` on your `AWS::RDS::DBCluster`. Aurora Multi-AZ provides automatic failover — if the primary fails, Aurora promotes the reader in a different AZ in under 30 seconds. Enable `StorageEncrypted: true` and specify a KMS key for encryption at rest.",
      "**DB Subnet Group.** Aurora requires a `AWS::RDS::DBSubnetGroup` covering at least 2 AZs. This tells Aurora which subnets it can place instances in. Always use your dedicated DB subnets — never reuse the node or public subnets for databases.",
    ],
    code: `# database.yaml
Resources:
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '\${ClusterName}/db/credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username":"appuser"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Aurora DB Subnets
      SubnetIds: !Ref DBSubnetIds

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: aurora-postgresql
      EngineVersion: '15.4'
      DatabaseName: appdb
      MasterUsername: !Sub '{{resolve:secretsmanager:\${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:\${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds: [!Ref RDSSecurityGroup]
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      DeletionProtection: true

  AuroraPrimary:
    Type: AWS::RDS::DBInstance
    Properties:
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.r6g.large
      Engine: aurora-postgresql

  AuroraReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.r6g.large
      Engine: aurora-postgresql

  # SecretTargetAttachment links secret to RDS so rotation works
  SecretAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      TargetId: !Ref AuroraCluster
      TargetType: AWS::RDS::DBCluster

Outputs:
  DBSecretArn:
    Value: !Ref DBSecret
    Export:
      Name: !Sub '\${AWS::StackName}-DBSecretArn'
  DBEndpoint:
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '\${AWS::StackName}-DBEndpoint'`,
    practice: "Enable automatic secret rotation for the Aurora credentials. What Lambda rotation function ARN should you use for Aurora PostgreSQL?",
    solution: `  SecretRotation:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DBSecret
      RotationLambdaARN: !Sub 'arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:SecretsManagerAuroraPostgreSQLRotationSingleUser'
      RotationRules:
        AutomaticallyAfterDays: 30`,
  },{
    time: "Lesson 6",
    title: "Deploying the Backend — Kubernetes Manifests",
    concept: [
      "**Namespace isolation.** Create a dedicated `app` namespace. Apply a NetworkPolicy that allows inbound traffic to the backend only from the frontend namespace and denies everything else. This is your in-cluster firewall.",
      "**Secrets Store CSI Driver.** Instead of storing DB credentials in a Kubernetes Secret (base64 encoded, etcd-stored), use the Secrets Store CSI Driver with the AWS provider. It mounts your Secrets Manager secret as a read-only tmpfs file inside each pod. When the secret rotates in Secrets Manager, the file updates automatically — no pod restart needed for the credential refresh.",
      "**Readiness and Liveness Probes.** Backend must expose a `/health` endpoint (or `/actuator/health` for Spring Boot). The readiness probe prevents traffic reaching a pod until the DB connection pool is ready. The liveness probe restarts pods stuck in deadlock. Set `initialDelaySeconds` generously for Java apps (Spring Boot needs 20-30s to start).",
      "**Resource requests and limits.** Always set both. For a Spring Boot API: `requests.cpu: 250m, requests.memory: 512Mi`. `limits.memory: 1Gi` (no CPU limit to avoid throttling). Without requests, the scheduler places pods randomly. Without memory limits, a leaking pod can OOM-kill its neighbors.",
    ],
    code: `# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app
---
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: app
          podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
  egress:
    - ports: [{ port: 5432 }]  # DB
    - ports: [{ port: 443 }]   # AWS APIs (Secrets Manager)
---
# k8s/secrets-store.yaml  (CSI Driver SecretProviderClass)
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: db-credentials
  namespace: app
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "three-tier-prod/db/credentials"
        objectType: "secretsmanager"
        jmesPath:
          - path: username
            objectAlias: db_username
          - path: password
            objectAlias: db_password
---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      serviceAccountName: backend-sa   # IRSA — gets AWS credentials
      nodeSelector:
        role: app
      containers:
        - name: backend
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DB_HOST
              value: "aurora-cluster.cluster-xxx.us-east-1.rds.amazonaws.com"
            - name: DB_USERNAME
              valueFrom:
                secretKeyRef:
                  name: db-secret-sync   # synced from CSI
                  key: db_username
          volumeMounts:
            - name: db-creds
              mountPath: /mnt/secrets
              readOnly: true
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 25
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 40
            periodSeconds: 20
      volumes:
        - name: db-creds
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: db-credentials`,
    practice: "Apply the backend manifests. Verify the pod can read the DB credentials from the mounted volume. Then intentionally break the readiness probe path and observe the pod being removed from Service endpoints.",
    solution: `# Apply:
kubectl apply -f k8s/
kubectl get pods -n app

# Verify secret mount:
kubectl exec -n app deploy/backend -- cat /mnt/secrets/db_username

# Break readiness probe (wrong path):
kubectl patch deploy backend -n app --type=json \\
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/wrong"}]'

# Watch pod go NotReady (removed from Service):
kubectl get endpoints backend-svc -n app -w`,
  },{
    time: "Lesson 7",
    title: "Frontend & ALB Ingress — TLS Termination",
    concept: [
      "**Frontend container.** The React app is a static build served by nginx:alpine. The Dockerfile: `npm run build` → copy `dist/` into `/usr/share/nginx/html`. The container is lightweight (~20MB), stateless, and horizontally scalable. Push it to ECR alongside the backend image.",
      "**ALB Ingress Controller.** The AWS Load Balancer Controller watches for `Ingress` resources with `kubernetes.io/ingress.class: alb`. When you create an Ingress, it automatically provisions an ALB in your public subnets, configures target groups for your Services, and sets up TLS using an ACM certificate. The ALB is the only resource that lives in the public subnet — all pods stay private.",
      "**TLS with ACM.** Request a certificate in ACM for your domain (`api.example.com`, `app.example.com`). Add the annotation `alb.ingress.kubernetes.io/certificate-arn` with the ACM ARN. The ALB terminates TLS, and traffic flows unencrypted from the ALB to pods (acceptable within the VPC — add `alb.ingress.kubernetes.io/backend-protocol: HTTPS` if you need end-to-end TLS).",
      "**Path-based routing.** One ALB, one Ingress, two backends: `app.example.com/` → frontend Service, `app.example.com/api/` → backend Service. This is cheaper (one ALB) and simpler to manage than separate Ingresses.",
    ],
    code: `# Build and push frontend image to ECR
ECR_FRONTEND=123456789.dkr.ecr.us-east-1.amazonaws.com/frontend
aws ecr get-login-password --region us-east-1 | \\
  docker login --username AWS --password-stdin \$ECR_FRONTEND

docker build -t frontend ./frontend
docker tag frontend:latest \$ECR_FRONTEND:latest
docker push \$ECR_FRONTEND:latest

---
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      nodeSelector:
        role: app
      containers:
        - name: frontend
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits: { memory: "256Mi" }
---
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: app
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
  namespace: app
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: app
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123:certificate/xxx
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-svc
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80`,
    practice: "After deploying the Ingress, verify the ALB was provisioned. Get the ALB DNS name and test both paths (/ and /api/). Then update the ACM certificate ARN and confirm the ALB updates without downtime.",
    solution: `# Get ALB DNS:
kubectl get ingress app-ingress -n app
# ADDRESS: k8s-app-appingre-xxx.us-east-1.elb.amazonaws.com

# Test paths:
curl https://app.example.com/           # frontend
curl https://app.example.com/api/health # backend health

# Check ALB in console — Listeners should show HTTPS:443 → 2 rules`,
  },{
    time: "Lesson 8",
    title: "Resilience — HPA, PDB & Topology Spread",
    concept: [
      "**HorizontalPodAutoscaler.** HPA scales pod replicas based on CPU or memory. Target CPU utilization of 70% — when average CPU across all backend pods exceeds 70%, HPA adds more pods. HPA requires the Metrics Server add-on. Set `minReplicas: 2` and `maxReplicas: 20`. Always set resource requests — HPA calculates utilization as `actual / requested`.",
      "**PodDisruptionBudget.** A PDB ensures that during voluntary disruptions (node drain, rolling update, Cluster Autoscaler scale-down), Kubernetes never takes down more pods than you allow. `maxUnavailable: 1` means at most 1 backend pod can be down at any time. Without a PDB, all pods on a node being drained go down simultaneously.",
      "**Topology Spread Constraints.** Force pods to spread across AZs and nodes. `maxSkew: 1` with `topologyKey: topology.kubernetes.io/zone` means pods are distributed as evenly as possible across AZs — you never have all 3 backend replicas in the same AZ. Add a second constraint with `topologyKey: kubernetes.io/hostname` to also spread across nodes.",
      "**Graceful shutdown.** Add `terminationGracePeriodSeconds: 60` and configure your app to handle `SIGTERM` by stopping accepting new connections, finishing in-flight requests, then exiting. For Spring Boot, set `server.shutdown=graceful` and `spring.lifecycle.timeout-per-shutdown-phase=50s`. Without graceful shutdown, rolling updates cause 502 errors.",
    ],
    code: `# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
---
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: app
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: backend
---
# k8s/backend-deployment.yaml (add to spec.template.spec)
spec:
  replicas: 3
  template:
    spec:
      terminationGracePeriodSeconds: 60
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: backend
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: backend

# Verify spread:
kubectl get pods -n app -o wide
# backend-xxx   Running   10.0.11.x   ip-10-0-1-x  (us-east-1a)
# backend-yyy   Running   10.0.12.x   ip-10-0-2-x  (us-east-1b)
# backend-zzz   Running   10.0.13.x   ip-10-0-3-x  (us-east-1c)

# Test PDB by draining a node:
kubectl drain ip-10-0-1-x --ignore-daemonsets --delete-emptydir-data
# Kubernetes will evict pods one at a time, respecting maxUnavailable: 1`,
    practice: "Load test the backend with `hey` or `k6`. Watch HPA scale from 2 to 8 replicas. Then stop load and confirm HPA scales back down after the cooldown period.",
    solution: `# Install hey: go install github.com/rakyll/hey@latest
hey -z 5m -c 50 https://app.example.com/api/health

# Watch HPA:
kubectl get hpa backend-hpa -n app -w
# NAME          TARGETS   MINPODS  MAXPODS  REPLICAS
# backend-hpa   8%/70%    2        20       2
# backend-hpa   74%/70%   2        20       4
# backend-hpa   71%/70%   2        20       8

# After load stops (cooldown ~5min):
# backend-hpa   12%/70%   2        20       2`,
  },
];

export const eksCfnInterviewQA = [
  {
    category: "Architecture & Design",
    questions: [
      {
        q: "How would you architect a secure 3-tier application on EKS? Where does each tier live?",
        a: "Frontend (React/nginx) runs in private EKS node subnets behind an ALB in public subnets — the ALB is the only public-facing resource. Backend (API) runs in the same private node subnets, reachable only from the frontend via ClusterIP Service and Network Policy. Database (Aurora) lives in dedicated DB subnets with no internet route and a security group that only allows 5432 from the node security group. No tier has a public IP. IMDSv2 is enforced on all nodes.",
        tip: "Draw the subnet tiers: public (ALB), private (nodes), DB-only (RDS). This shows you understand defense-in-depth.",
      },
      {
        q: "Why use CloudFormation for EKS infrastructure but Kubernetes YAML for app deployment?",
        a: "CloudFormation manages slow-changing, stateful AWS resources: VPC, EKS cluster, node groups, RDS, IAM roles, ECR. These change rarely and need strong drift detection and rollback. Kubernetes YAML manages fast-changing, stateless app resources: Deployments, Services, Ingress, HPA. These change on every release. Mixing them creates operational complexity — a failed app deploy shouldn't roll back your VPC. Separation of concerns: infrastructure team owns CloudFormation, app teams own Kubernetes manifests.",
        tip: "Mention that CloudFormation outputs (cluster name, role ARNs, DB endpoint) feed into Kubernetes manifests as config.",
      },
      {
        q: "What is IRSA and why is it better than using the node IAM role?",
        a: "IRSA (IAM Roles for Service Accounts) binds an IAM role to a specific Kubernetes ServiceAccount using OIDC federation. Only pods using that ServiceAccount get those AWS permissions. With node IAM roles, ALL pods on a node share the role — a compromised frontend pod could access the backend's Secrets Manager secrets. With IRSA: frontend SA has no AWS access, backend SA has only GetSecretValue on the DB secret, ALB controller SA has only ELB permissions. Blast radius is minimized per pod identity.",
        tip: "Emphasize the OIDC trust condition: `StringEquals oidc:sub: system:serviceaccount:<ns>:<sa>` — this is what makes it pod-specific.",
      },
      {
        q: "How do you pass database credentials to a pod without storing them in Kubernetes Secrets?",
        a: "Use the Secrets Store CSI Driver with the AWS provider. Create a `SecretProviderClass` pointing to the Secrets Manager secret ARN. Mount it as a volume in the pod — the CSI driver fetches the secret at pod start and mounts it as a read-only tmpfs file. The credential is never stored in etcd, never appears in `kubectl get secrets`, and automatically updates when the secret rotates in Secrets Manager. The pod reads credentials from the file path at startup.",
        tip: "Contrast with the anti-pattern: storing DB password in a Kubernetes Secret is base64-encoded (not encrypted) and stored in etcd — not secure without etcd envelope encryption.",
      },
    ],
  },
  {
    category: "EKS & CloudFormation Operations",
    questions: [
      {
        q: "A CloudFormation stack creating an EKS cluster is stuck in CREATE_IN_PROGRESS for 30 minutes. How do you debug?",
        a: "Check Stack Events first: `aws cloudformation describe-stack-events --stack-name <name>`. Common causes for EKS: (1) Subnet or SG misconfiguration preventing the control plane ENIs from being created — check that private subnets have correct route tables. (2) IAM role missing `eks.amazonaws.com` trust — check the cluster role's trust policy. (3) VPC endpoint missing so the cluster cannot communicate with ECR/EC2 APIs in a private cluster. (4) CloudFormation waiting for a `CreationPolicy` signal that never arrived. Look at the most recent failed resource event for the `ResourceStatusReason`.",
        tip: "Always start with Stack Events — the ResourceStatusReason field tells you exactly what failed.",
      },
      {
        q: "How do you perform a zero-downtime rolling update of the backend container image?",
        a: "Update the Deployment's image tag: `kubectl set image deployment/backend backend=<ecr>:<new-tag> -n app`. Kubernetes rolls out new pods using the strategy `maxUnavailable: 0, maxSurge: 1` — it creates a new pod, waits for its readiness probe to pass, then terminates one old pod. The ALB only routes to healthy (Ready) pods. For zero-downtime: (1) readiness probe must check actual app readiness (not just 200 OK). (2) Graceful shutdown must drain in-flight requests before exit. (3) PDB prevents all pods being evicted simultaneously if a node is also draining.",
        tip: "Zero downtime requires three things working together: maxUnavailable:0, proper readiness probes, and graceful shutdown.",
      },
      {
        q: "The ALB is not being provisioned after you apply the Ingress manifest. What do you check?",
        a: "Five things: (1) Check ALB Controller logs: `kubectl logs -n kube-system deploy/aws-load-balancer-controller`. (2) Verify IRSA — the controller's ServiceAccount must be annotated with the correct role ARN and the role must have the AWS Load Balancer Controller IAM policy. (3) Check subnet tags — public subnets need `kubernetes.io/role/elb: 1`. (4) Verify the Ingress class annotation matches: `kubernetes.io/ingress.class: alb`. (5) Check the ACM certificate ARN is in the same region as the cluster and is in ISSUED state.",
        tip: "The ALB Controller logs are the single most useful diagnostic — they show exactly why provisioning failed.",
      },
      {
        q: "How do you upgrade EKS nodes with zero downtime using CloudFormation?",
        a: "Update the `Version` property in `AWS::EKS::Cluster` to the new minor version first (control plane upgrades first). Then update the `ReleaseVersion` or `LaunchTemplate` version on each `AWS::EKS::Nodegroup`. CloudFormation uses the `UpdateConfig.MaxUnavailable: 1` setting to drain and replace nodes one at a time. EKS respects PodDisruptionBudgets during node drain — pods with `maxUnavailable: 1` PDB will not all be evicted at once. Upgrade system node group first, then app node group. Always upgrade control plane before nodes (nodes can be one minor version behind, never ahead).",
        tip: "Control plane MUST be upgraded before nodes. Nodes can be at N or N-1 minor version relative to the control plane.",
      },
      {
        q: "How do you implement automatic container image updates across environments using CloudFormation and ECR?",
        a: "Pattern: (1) CI pipeline builds image, tags with git SHA (`git rev-parse --short HEAD`), pushes to ECR. (2) Update a CloudFormation SSM parameter or use `aws ssm put-parameter` to store the new image tag. (3) Kubernetes Deployment references the image tag via a ConfigMap or the deployment command: `kubectl set image deployment/backend backend=<ecr>:<sha>`. (4) For full GitOps, use ArgoCD — it watches a Git repo for Deployment YAML changes and syncs them to the cluster automatically. Never use `latest` tag in production — it defeats image traceability.",
        tip: "Tag images with the git commit SHA, not `latest`. This makes every deployment traceable and rollback trivial.",
      },
    ],
  },
  {
    category: "Security & Resilience",
    questions: [
      {
        q: "How do you prevent pods from accessing the EC2 metadata service (IMDS) and stealing node credentials?",
        a: "Two layers: (1) Enforce IMDSv2 on nodes via LaunchTemplate `HttpTokens: required` and `HttpPutResponseHopLimit: 1`. The hop limit of 1 means the IMDSv2 token request cannot be forwarded from inside a container — attackers cannot use SSRF to reach IMDS from within a pod. (2) Apply a NetworkPolicy denying egress to `169.254.169.254/32` from all pods except those that specifically need it. With IRSA, pods get AWS credentials via the projected service account token — they don't need IMDS at all.",
        tip: "HttpPutResponseHopLimit: 1 is the key — it physically prevents containers from using IMDS even if they try.",
      },
      {
        q: "What happens to your application during an Aurora failover? How do you make it resilient?",
        a: "During Aurora failover (typically 20-30 seconds), the reader is promoted to primary and the old primary DNS entry updates. Applications using the cluster endpoint (not the reader endpoint) will see a brief connection failure. Resilience strategies: (1) Use the Aurora cluster endpoint (not instance endpoint) — it auto-updates after failover. (2) Configure connection pool retry logic with exponential backoff (HikariCP: `connectionInitSql`, `initializationFailTimeout`). (3) Spring Boot: `spring.datasource.hikari.connection-timeout=30000` and `maximumPoolSize` tuned to not overwhelm the new primary. (4) Kubernetes liveness probe will NOT restart pods during failover — only connection-level retries save you.",
        tip: "Always test failover: `aws rds failover-db-cluster --db-cluster-identifier <id>`. Verify your app reconnects without pod restarts.",
      },
    ],
  },
];
