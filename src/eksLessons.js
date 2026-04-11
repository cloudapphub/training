export const eksLessons = [
  {
    time: "Hour 1",
    title: "EKS Architecture & Control Plane Fundamentals",
    concept: [
      "**What is Amazon EKS?** Amazon Elastic Kubernetes Service (EKS) is a fully managed Kubernetes control plane. AWS runs the three etcd nodes, the API server, the scheduler, and the controller manager across three Availability Zones for you. You never SSH into a control-plane node — AWS patches it, scales it, and ensures its HA. Your responsibility starts at the **data plane**: the EC2 instances (or Fargate profiles) where your pods actually run.",
      "**Control Plane vs. Data Plane.** The control plane is the 'brain' of the cluster. It decides which pods run where, watches for failures, and exposes the Kubernetes API (typically at `https://<cluster-id>.eks.amazonaws.com`). The data plane consists of the **worker nodes** — the EC2 instances that join the cluster and accept pod scheduling. Managed Node Groups are the easiest way to provision these worker nodes.",
      "**What is a Managed Node Group?** A Managed Node Group (MNG) is an AWS-managed Auto Scaling Group (ASG) of EC2 instances that are automatically registered as Kubernetes nodes. AWS handles: provisioning the instances, bootstrapping the `kubelet` and `kube-proxy`, registering nodes with the EKS cluster, and performing rolling updates when you change the AMI or instance type. You define the desired state; AWS handles the lifecycle.",
      "**Why Managed Node Groups over Self-Managed?** With self-managed nodes, you create your own ASG, write your own bootstrap script (`/etc/eks/bootstrap.sh`), manage AMI updates manually, and handle node draining during upgrades. With MNGs, all of this is automated. AWS also automatically tags the instances and applies the correct `aws-auth` ConfigMap entry so the nodes can join the cluster instantly.",
      "**EKS Cluster Endpoint Access.** The API server endpoint can be public (accessible from the internet), private (accessible only from within the VPC), or both. For production, best practice is to set `endpoint_private_access = true` and `endpoint_public_access = false` (or restrict it to your corporate CIDR). This ensures that `kubectl` commands can only be issued from within the VPC or over a VPN.",
    ],
    code: `# Create an EKS cluster with eksctl (quickstart)
eksctl create cluster \\
  --name my-cluster \\
  --version 1.29 \\
  --region us-east-1 \\
  --nodegroup-name workers \\
  --node-type t3.large \\
  --nodes 3 \\
  --nodes-min 2 \\
  --nodes-max 5 \\
  --managed

# Verify the cluster is ready
aws eks describe-cluster --name my-cluster --query "cluster.status"
# "ACTIVE"

# Update kubeconfig to use the new cluster
aws eks update-kubeconfig --name my-cluster --region us-east-1

# Verify nodes are registered
kubectl get nodes -o wide
# NAME                          STATUS   ROLES    AGE   VERSION
# ip-10-0-1-42.ec2.internal    Ready    <none>   3m    v1.29.0-eks-...
# ip-10-0-2-17.ec2.internal    Ready    <none>   3m    v1.29.0-eks-...
# ip-10-0-3-88.ec2.internal    Ready    <none>   3m    v1.29.0-eks-...`,
    practice: "Create an EKS cluster using eksctl with a managed node group. Verify the cluster status, update kubeconfig, and confirm all nodes are in Ready state.",
    solution: `# Full verification flow:
aws eks describe-cluster --name my-cluster \\
  --query "cluster.{Status:status,Endpoint:endpoint,Version:version}"

kubectl get nodes
kubectl get pods -n kube-system
# You should see coredns, kube-proxy, and aws-node (VPC CNI) pods running`,
  },
  {
    time: "Hour 2",
    title: "Managed Node Group Configuration Deep Dive",
    concept: [
      "**AMI Types.** When you create a managed node group, you choose an AMI type. The most common options are: `AL2_x86_64` (Amazon Linux 2, default), `AL2023_x86_64_STANDARD` (Amazon Linux 2023, newer), `AL2_ARM_64` (for Graviton instances), and `BOTTLEROCKET_x86_64` (a minimal, security-hardened OS built specifically for containers). Bottlerocket is the best practice for production because it has a read-only root filesystem, no shell, and automatic atomic updates.",
      "**Instance Types and Capacity Types.** You can specify one or more instance types per node group. For cost optimization, specify multiple types (e.g., `t3.large`, `m5.large`, `m5a.large`) so the ASG can pick whichever has capacity. You can also choose between `ON_DEMAND` (reliable, higher cost) and `SPOT` (up to 90% cheaper, but can be reclaimed). Best practice: run your stateless workloads on Spot, stateful on On-Demand.",
      "**Disk Size and Encryption.** The `disk_size` parameter (default 20 GB) controls the root EBS volume size for each node. For production workloads with large container images or local ephemeral storage needs, set this to 100 GB or more. Always enable EBS encryption using a KMS key by specifying `disk_size` and configuring the launch template with `encrypted = true`. This is a compliance requirement for most enterprises.",
      "**Labels, Taints, and Node Selectors.** Labels are key-value pairs attached to nodes (e.g., `workload=cpu-intensive`). Taints prevent pods from scheduling on a node unless the pod has a matching toleration. Use taints to dedicate node groups to specific workloads. For example, taint GPU nodes with `nvidia.com/gpu=true:NoSchedule` so only ML pods (with the toleration) land there. Labels and taints are configured at the node group level, not per-node.",
      "**Launch Templates.** For advanced configuration (custom AMI, user data scripts, specific EBS settings, metadata options), you attach a **Launch Template** to the managed node group. The launch template overrides parts of the default configuration. Important: if you specify a custom AMI in the launch template, AWS will NOT automatically update the AMI during node group upgrades — you become responsible for AMI lifecycle management.",
      "**Subnet Placement.** Always place your managed node groups in **private subnets**. Nodes should never have public IP addresses. Outbound internet access (for pulling images from ECR, downloading packages) should go through a NAT Gateway. For multi-AZ resilience, spread nodes across at least 2 (ideally 3) private subnets in different Availability Zones.",
    ],
    code: `# === Terraform: Managed Node Group with best practices ===
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.0"
  cluster_name    = "prod-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  # -- Managed Node Groups --
  eks_managed_node_groups = {
    # General-purpose On-Demand nodes
    general = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m5.xlarge", "m5a.xlarge", "m6i.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      disk_size      = 100

      labels = {
        role = "general"
        env  = "production"
      }

      tags = {
        "k8s.io/cluster-autoscaler/enabled"     = "true"
        "k8s.io/cluster-autoscaler/prod-cluster" = "owned"
      }
    }

    # Cost-optimized Spot nodes for batch/stateless workloads
    spot_workers = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m5.large", "m5a.large", "m5d.large", "m6i.large"]
      capacity_type  = "SPOT"
      min_size       = 0
      max_size       = 20
      desired_size   = 3
      disk_size      = 50

      labels = {
        role     = "spot-worker"
        workload = "batch"
      }

      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}`,
    practice: "Create a Terraform configuration with two node groups: a general On-Demand group and a Spot group with taints. Deploy and verify both groups register correctly.",
    solution: `# After terraform apply:
kubectl get nodes --show-labels | grep role
# ip-10-0-1-x   role=general
# ip-10-0-2-x   role=spot-worker

# Verify taints on spot nodes
kubectl describe node ip-10-0-2-x | grep Taints
# Taints: spot=true:NoSchedule`,
  },
  {
    time: "Hour 3",
    title: "Node Group Networking & VPC CNI",
    concept: [
      "**How Pods Get IP Addresses.** EKS uses the **Amazon VPC CNI plugin** (aws-node DaemonSet). Unlike other CNI plugins that create overlay networks, VPC CNI assigns each pod a real VPC IP address from the subnet CIDR. This means pods are first-class VPC citizens — they can communicate with RDS databases, ElastiCache clusters, and other VPC resources directly, without NAT or tunneling.",
      "**ENI and IP Prefixes.** Each EC2 instance has a limited number of Elastic Network Interfaces (ENIs) and each ENI supports a limited number of IPs. For example, a `m5.large` supports 3 ENIs x 10 IPs = 30 pods max. This is the single biggest constraint on node sizing. To increase density, enable **prefix delegation** by setting `ENABLE_PREFIX_DELEGATION=true` on the aws-node DaemonSet. This assigns /28 prefixes (16 IPs) per slot instead of individual IPs, increasing capacity by ~4x.",
      "**Custom Networking.** By default, pods use the same subnet as the node. With **custom networking**, you can place pods in a different CIDR range (a secondary CIDR added to the VPC). This is critical when your primary subnets are running low on IPs. You configure this by setting `AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG=true` and creating `ENIConfig` custom resources that map AZs to subnets.",
      "**Security Groups for Pods (SGP).** With Security Groups for Pods, you can assign specific VPC security groups directly to individual pods. This lets you control network access at the pod level using AWS security group rules — for example, only allowing your API pods to talk to the RDS database. Enable this by setting `ENABLE_POD_ENI=true` on the VPC CNI. The pod gets its own branch ENI with the specified security group.",
      "**DNS and CoreDNS.** Every EKS cluster runs CoreDNS pods in the `kube-system` namespace. They handle internal service discovery (e.g., `my-service.default.svc.cluster.local`). For large clusters (200+ nodes), scale CoreDNS horizontally using the **cluster-proportional-autoscaler**. Also enable **NodeLocal DNSCache** to reduce CoreDNS load and DNS latency — it runs a DNS cache on every node.",
      "**Best Practice: Plan Your CIDR Carefully.** The most common operational pain point on EKS is IP exhaustion. Use a /16 VPC CIDR for production. Enable prefix delegation. If you're inheriting a small CIDR, add a secondary CIDR and use custom networking. Monitor IP usage with `kubectl get node -o json | jq '.items[].status.allocatable[\"pods\"]'` and CloudWatch metrics.",
    ],
    code: `# === Enable Prefix Delegation for higher pod density ===
kubectl set env daemonset aws-node \\
  -n kube-system \\
  ENABLE_PREFIX_DELEGATION=true \\
  WARM_PREFIX_TARGET=1

# Verify prefix delegation is active
kubectl get ds aws-node -n kube-system -o json | \\
  jq '.spec.template.spec.containers[0].env[] | select(.name=="ENABLE_PREFIX_DELEGATION")'

# Check max pods per node (before vs after)
kubectl get node ip-10-0-1-42.ec2.internal -o json | \\
  jq '.status.allocatable.pods'
# Before: "29"   After: "110"

# === Security Groups for Pods ===
# First, enable POD ENI on the VPC CNI
kubectl set env daemonset aws-node \\
  -n kube-system \\
  ENABLE_POD_ENI=true

# Create a SecurityGroupPolicy
cat <<EOF | kubectl apply -f -
apiVersion: vpcresources.k8s.aws/v1beta1
kind: SecurityGroupPolicy
metadata:
  name: db-access-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: orders-api
  securityGroups:
    groupIds:
      - sg-0123456789abcdef0   # SG allowing port 5432 to Aurora
EOF`,
    practice: "Enable prefix delegation on a running cluster and verify the pod limit increased. Then create a SecurityGroupPolicy that assigns a database SG to your API pods.",
    solution: `# Verify prefix mode is working:
kubectl describe node <node-name> | grep -A5 "Allocatable"
#  pods: 110   (was 29 before prefix delegation)

# Verify SecurityGroupPolicy:
kubectl get sgp -A
kubectl describe sgp db-access-policy`,
  },
  {
    time: "Hour 4",
    title: "Node Group Scaling: Cluster Autoscaler & Karpenter",
    concept: [
      "**Why Scaling Matters.** Your managed node groups have a min and max size, but they don't automatically scale based on pod demand by default. You need a scaling component. There are two main options: the **Kubernetes Cluster Autoscaler** (the traditional choice) and **Karpenter** (the modern, AWS-native choice).",
      "**Cluster Autoscaler (CA).** The Cluster Autoscaler watches for pods that are in `Pending` state because no node has enough resources. It then calls the AWS ASG API to increase the desired count of the managed node group. It also scales down by cordoning and draining underutilized nodes. CA needs IAM permissions to modify ASGs — you grant this via IRSA.",
      "**CA Limitations.** The Cluster Autoscaler is reactive and slow. It checks every 10 seconds (default), and after deciding to scale up, you wait for the ASG to launch an instance, the instance to boot, the kubelet to register, and pods to be scheduled. Total time: 2-5 minutes. It also lacks intelligence about instance type selection — it simply scales the ASG you point it at.",
      "**Karpenter: The Modern Alternative.** Karpenter is an open-source node provisioner built by AWS. Instead of scaling ASGs, Karpenter directly calls the EC2 Fleet API to launch the right-sized instance for your pending pods. It can select from any instance type, mix Spot and On-Demand, and provision nodes in under 60 seconds. It also consolidates underused nodes automatically.",
      "**NodePool and EC2NodeClass.** In Karpenter, you define a `NodePool` (what kinds of instances to use, limits, disruption policies) and an `EC2NodeClass` (which AMI family, subnets, security groups, and instance profile to use). Karpenter then matches pending pod requirements (CPU, memory, GPU, topology) against available instance types and picks the cheapest one that fits.",
      "**Best Practice: Karpenter for New Clusters.** For greenfield EKS deployments, use Karpenter instead of Cluster Autoscaler. It's faster, smarter, and cheaper. However, if you already have well-tuned MNGs with Cluster Autoscaler and they work well, there's no urgent need to migrate. Both approaches are production-grade.",
      "**Scaling Best Practices.** Set `min_size >= 2` for production node groups (HA across AZs). Set `max_size` to a reasonable upper bound to prevent runaway costs. Use PodDisruptionBudgets (PDBs) to protect critical workloads during scale-down. Configure the `--scale-down-delay-after-add` flag on CA to prevent flapping (default 10 minutes is fine).",
    ],
    code: `# === Install Cluster Autoscaler via Helm ===
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm install cluster-autoscaler autoscaler/cluster-autoscaler \\
  --namespace kube-system \\
  --set autoDiscovery.clusterName=prod-cluster \\
  --set awsRegion=us-east-1 \\
  --set rbac.serviceAccount.create=true \\
  --set rbac.serviceAccount.name=cluster-autoscaler \\
  --set rbac.serviceAccount.annotations."eks\\.amazonaws\\.com/role-arn"=arn:aws:iam::123456789012:role/ClusterAutoscalerRole

# Verify it's running
kubectl get pods -n kube-system -l app.kubernetes.io/name=cluster-autoscaler

# === OR: Install Karpenter ===
helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \\
  --version 0.37.0 \\
  --namespace kube-system \\
  --set "settings.clusterName=prod-cluster" \\
  --set "settings.interruptionQueue=prod-cluster" \\
  --wait

# Create a Karpenter NodePool
cat <<EOF | kubectl apply -f -
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["m", "c", "r"]
        - key: karpenter.k8s.aws/instance-generation
          operator: Gt
          values: ["4"]
      nodeClassRef:
        apiVersion: karpenter.k8s.aws/v1beta1
        kind: EC2NodeClass
        name: default
  limits:
    cpu: "100"
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h   # 30 days max node age
---
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2023
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod-cluster
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod-cluster
  role: "KarpenterNodeRole-prod-cluster"
EOF`,
    practice: "Install either Cluster Autoscaler or Karpenter. Create a deployment with 50 replicas and watch nodes scale up automatically. Then scale down and watch nodes consolidate.",
    solution: `# Create a test workload that triggers scale-up
kubectl create deployment inflate --image=public.ecr.aws/eks-distro/kubernetes/pause:3.7 --replicas=50
kubectl set resources deployment inflate --requests=cpu=1

# Watch nodes appear
kubectl get nodes -w

# Clean up
kubectl delete deployment inflate
# Watch Karpenter consolidate empty nodes (or CA scale down after 10 min)`,
  },
  {
    time: "Hour 5",
    title: "Node Group Upgrades & AMI Lifecycle",
    concept: [
      "**Why Upgrades Matter.** AWS releases new EKS-optimized AMIs regularly — for security patches, kernel updates, and Kubernetes version bumps. If you never update your nodes, you accumulate CVEs and eventually hit version skew issues (kubelet must be within one minor version of the API server). Managed Node Groups make upgrades semi-automatic, but you must understand the process.",
      "**How MNG Rolling Updates Work.** When you trigger an update (new AMI, new instance type, new launch template version), AWS performs a rolling update: (1) it launches a new node with the new config, (2) waits for it to become `Ready`, (3) cordons the old node (marks it unschedulable), (4) drains the old node (evicts pods respecting PDBs), (5) terminates the old node. It repeats this one node at a time (or in parallel if you configure `updateConfig`).",
      "**Update Strategies.** The `updateConfig` block lets you control parallelism. `maxUnavailable = 1` means only one node is replaced at a time (safest, slowest). `maxUnavailable = 33%` means up to 33% of nodes are replaced simultaneously (faster, riskier). For production, start with `maxUnavailable = 1`. For dev/staging, use `33%` to save time.",
      "**Force Updating vs. Rolling Update.** If a rolling update gets stuck (a pod won't drain because of a strict PDB), you can issue a **force update**. This skips the drain step and terminates nodes immediately. Only use this as a last resort and only if you are confident your workloads can handle abrupt termination. The command: `aws eks update-nodegroup-version --cluster-name X --nodegroup-name Y --force`.",
      "**AMI Version Pinning.** By default, MNGs use the latest EKS-optimized AMI. For stability, you can pin to a specific AMI release version using the `release_version` field. This lets you test a specific AMI in staging before rolling it to production. You can find available versions with `aws ssm get-parameter --name /aws/service/eks/optimized-ami/1.29/amazon-linux-2023/x86_64/standard/recommended/release_version`.",
      "**Kubernetes Version Upgrade Process.** Upgrading Kubernetes (e.g., 1.28 → 1.29) is a two-step process: (1) upgrade the **control plane** first (`aws eks update-cluster-version`), then (2) upgrade each **node group** to match. Never upgrade the node group before the control plane. Also, always upgrade one minor version at a time — never skip versions (e.g., 1.27 → 1.29 is not supported).",
      "**Best Practices.** Always test upgrades in a non-production cluster first. Review the EKS version release notes for deprecated APIs. Use `kubectl convert` or `pluto` to scan your manifests for deprecated resources. Set PodDisruptionBudgets on critical deployments so the rolling update process respects your availability requirements.",
    ],
    code: `# === Check current node group AMI version ===
aws eks describe-nodegroup \\
  --cluster-name prod-cluster \\
  --nodegroup-name general \\
  --query "nodegroup.{Version:version,ReleaseVersion:releaseVersion,Status:status}"

# === Get the latest recommended AMI version ===
aws ssm get-parameter \\
  --name /aws/service/eks/optimized-ami/1.29/amazon-linux-2023/x86_64/standard/recommended/release_version \\
  --query "Parameter.Value" --output text

# === Trigger a rolling update to the latest AMI ===
aws eks update-nodegroup-version \\
  --cluster-name prod-cluster \\
  --nodegroup-name general

# === Monitor the rolling update progress ===
watch -n5 "kubectl get nodes -o wide"

# === Terraform: Pin AMI version and control update parallelism ===
eks_managed_node_groups = {
  general = {
    ami_type       = "AL2023_x86_64_STANDARD"
    instance_types = ["m5.xlarge"]

    # Pin to a specific AMI release for stability
    # release_version = "1.29.0-20240315"

    update_config = {
      max_unavailable_percentage = 33  # 33% at a time
    }

    min_size     = 3
    max_size     = 10
    desired_size = 3
  }
}

# === PodDisruptionBudget to protect workloads during drain ===
# kubectl apply -f -
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: orders-api-pdb
spec:
  minAvailable: 2            # always keep at least 2 pods running
  selector:
    matchLabels:
      app: orders-api`,
    practice: "Check the current AMI version of your node group, find the latest available version, and trigger a rolling update. Create a PDB and observe how the update respects it.",
    solution: `# Verify the update is progressing:
aws eks describe-update \\
  --cluster-name prod-cluster \\
  --nodegroup-name general \\
  --update-id <update-id-from-previous-command>

# Watch nodes cycling:
kubectl get nodes -w
# You'll see new nodes appear (Ready) and old nodes go (SchedulingDisabled -> removed)`,
  },
  {
    time: "Hour 6",
    title: "IAM, IRSA & Pod Identity for Nodes",
    concept: [
      "**Node IAM Role.** Every managed node group has an associated IAM role. This role is assumed by every EC2 instance in the group. It needs at minimum three managed policies: `AmazonEKSWorkerNodePolicy` (allows nodes to connect to the EKS API), `AmazonEKS_CNI_Policy` (allows the VPC CNI plugin to manage ENIs), and `AmazonEC2ContainerRegistryReadOnly` (allows pulling images from ECR). Without these, nodes cannot join the cluster or run pods.",
      "**The Problem with Node Roles.** If you attach additional policies to the **node** role (e.g., S3 access, Secrets Manager access), then **every single pod** on that node can assume those permissions. This violates the principle of least privilege. A compromised pod could access S3 buckets or secrets it was never meant to touch.",
      "**IRSA: IAM Roles for Service Accounts.** IRSA solves this by letting you assign IAM roles to individual Kubernetes service accounts. Under the hood, EKS runs an OIDC identity provider. When a pod with a specific service account makes an AWS API call, the AWS SDK exchanges the Kubernetes token for temporary AWS credentials scoped to that service account's IAM role. No other pod gets those permissions.",
      "**How to Set Up IRSA.** Step 1: Enable the OIDC provider on the cluster (`eksctl utils associate-iam-oidc-provider --cluster=X`). Step 2: Create an IAM role with a trust policy that trusts the EKS OIDC provider and specifies the service account name. Step 3: Create the Kubernetes service account with the annotation `eks.amazonaws.com/role-arn`. Step 4: Set `serviceAccountName` on your pod spec.",
      "**EKS Pod Identity (Newer Alternative).** AWS recently introduced **EKS Pod Identity** as a simpler replacement for IRSA. Instead of managing OIDC trust policies, you install the EKS Pod Identity Agent add-on and create associations via `aws eks create-pod-identity-association`. The agent injects credentials at the pod level. Pod Identity is easier to manage but requires the add-on to be installed.",
      "**Best Practice: Never Add Application Permissions to the Node Role.** The node role should only have the three baseline policies. All application-specific permissions (S3, DynamoDB, Secrets Manager, SQS, etc.) must go through IRSA or Pod Identity. This is a non-negotiable security best practice for any production EKS cluster.",
    ],
    code: `# === Terraform: Node Role (minimal permissions) ===
resource "aws_iam_role" "node_role" {
  name = "eks-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}
resource "aws_iam_role_policy_attachment" "node_cni" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}
resource "aws_iam_role_policy_attachment" "node_ecr" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# === IRSA: Create a role for the orders-api service account ===
module "orders_api_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "orders-api-role"

  oidc_providers = {
    main = {
      provider_arn = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:orders-api-sa"]
    }
  }

  role_policy_arns = {
    secrets = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
  }
}

# === Kubernetes: Service Account with IRSA annotation ===
# kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: orders-api-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/orders-api-role`,
    practice: "Create a minimal node IAM role. Set up IRSA for a service account that can read from Secrets Manager. Deploy a pod with the service account and verify it can access the secret but a pod without the SA cannot.",
    solution: `# Verify IRSA is working inside a pod:
kubectl exec -it <pod-name> -- bash
# Inside the pod:
aws sts get-caller-identity
# Should show the IRSA role ARN, not the node role

# Try from a pod WITHOUT the service account:
kubectl run test --image=amazon/aws-cli -- sts get-caller-identity
kubectl logs test
# Should show the node role (which has no secrets access)`,
  },
  {
    time: "Hour 7",
    title: "Monitoring, Logging & Observability for Nodes",
    concept: [
      "**Container Insights.** Amazon CloudWatch Container Insights provides CPU, memory, disk, and network metrics for your EKS nodes, pods, and containers. It requires the **CloudWatch Agent** or the **ADOT (AWS Distro for OpenTelemetry) Collector** running as a DaemonSet on each node. Once enabled, you get pre-built dashboards in CloudWatch showing cluster-level and node-level health.",
      "**Node-Level Metrics to Monitor.** The critical node metrics are: (1) **CPU utilization** — if consistently above 80%, your nodes are overloaded; (2) **Memory utilization** — OOMKilled pods indicate insufficient memory; (3) **Disk pressure** — the kubelet will evict pods if the root volume fills up; (4) **Pod count vs. allocatable** — approaching the max pod limit means you need bigger instances or prefix delegation.",
      "**Control Plane Logging.** EKS can send API server, authenticator, controller manager, scheduler, and audit logs to CloudWatch Logs. Enable these in the cluster settings. The **audit log** is the most important — it records every API call (who did what, when). This is essential for security audits and debugging RBAC issues.",
      "**Fluent Bit for Application Logs.** To ship pod application logs (stdout/stderr) to CloudWatch, S3, or Elasticsearch, deploy **Fluent Bit** as a DaemonSet. AWS provides a managed Fluent Bit image and a recommended configuration. Fluent Bit reads logs from `/var/log/containers/` on each node and routes them based on namespace tags.",
      "**Prometheus and Grafana.** For advanced monitoring, deploy **Amazon Managed Prometheus (AMP)** and **Amazon Managed Grafana (AMG)**. AMP collects Prometheus metrics from your nodes and pods. AMG provides rich dashboards. This is the enterprise-grade monitoring stack. You can also self-host Prometheus via Helm if you prefer.",
      "**Node Problem Detector.** The **Node Problem Detector** is a DaemonSet that watches for kernel panics, OOM kills, hardware errors, and filesystem corruption on each node. It reports these as Kubernetes `NodeCondition` events, which you can alert on. Install it with `kubectl apply -f https://raw.githubusercontent.com/kubernetes/node-problem-detector/master/deployment/npd.yaml`.",
      "**Best Practice: Alerting.** Set up alarms for: node CPU > 80%, node memory > 85%, DiskPressure condition, NotReady nodes, and pod restart count > 5 in 10 minutes. Use SNS to send alerts to Slack or PagerDuty. Don't just collect metrics — act on them.",
    ],
    code: `# === Install CloudWatch Container Insights with ADOT ===
aws eks create-addon \\
  --cluster-name prod-cluster \\
  --addon-name amazon-cloudwatch-observability \\
  --addon-version v2.1.0-eksbuild.1

# === Install Fluent Bit for log forwarding ===
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonSet/container-insights-monitoring/fluent-bit/fluent-bit.yaml

# Verify Fluent Bit is running on every node
kubectl get pods -n amazon-cloudwatch -l k8s-app=fluent-bit
# NAME              READY   STATUS    RESTARTS   AGE
# fluent-bit-abc12  1/1     Running   0          2m
# fluent-bit-def34  1/1     Running   0          2m
# fluent-bit-ghi56  1/1     Running   0          2m

# === Enable EKS Control Plane Logging ===
aws eks update-cluster-config \\
  --name prod-cluster \\
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# === CloudWatch Alarm for High CPU (Terraform) ===
resource "aws_cloudwatch_metric_alarm" "node_cpu_high" {
  alarm_name          = "eks-node-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "node_cpu_utilization"
  namespace           = "ContainerInsights"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "EKS node CPU above 80% for 15 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    ClusterName = "prod-cluster"
  }
}`,
    practice: "Enable Container Insights and control plane logging on your cluster. Deploy Fluent Bit and verify logs appear in CloudWatch. Create a CPU alarm.",
    solution: `# Verify Container Insights data in CloudWatch:
aws cloudwatch list-metrics --namespace ContainerInsights \\
  --dimensions Name=ClusterName,Value=prod-cluster

# View logs in CloudWatch:
aws logs describe-log-groups --log-group-name-prefix /aws/eks/prod-cluster

# Check Fluent Bit is shipping logs:
kubectl logs -n amazon-cloudwatch -l k8s-app=fluent-bit --tail=20`,
  },
  {
    time: "Hour 8",
    title: "Security Hardening for Managed Nodes",
    concept: [
      "**Principle of Least Privilege.** Every layer of your EKS deployment should follow least privilege: the node IAM role should only have the three baseline policies. Application permissions go through IRSA. Security groups should only open the ports your workloads actually need. RBAC should scope users to specific namespaces.",
      "**Node Security Groups.** EKS automatically creates a cluster security group that allows nodes and the control plane to communicate. On top of that, you can add custom security groups to your managed node groups. Best practice: restrict inbound traffic to only the ports your applications expose (e.g., 8080 for your API). Deny all other inbound by default. Allow all outbound to 0.0.0.0/0 (for pulling images) or restrict to S3/ECR VPC endpoints.",
      "**Pod Security Standards (PSS).** Kubernetes Pod Security Standards replace the deprecated PodSecurityPolicies. They define three levels: `privileged` (anything goes), `baseline` (blocks known escalations), and `restricted` (maximum lockdown). Best practice: apply `restricted` to all namespaces except `kube-system`. Use namespace labels: `pod-security.kubernetes.io/enforce: restricted`.",
      "**IMDSv2 Enforcement.** The Instance Metadata Service (IMDS) provides instance credentials. IMDSv1 is vulnerable to SSRF attacks — a compromised pod could curl `169.254.169.254` and steal the node role credentials. Always enforce IMDSv2 (which requires a session token) by setting `http_tokens = required` in the launch template metadata options. EKS MNGs support this natively.",
      "**Secrets Management.** Never store secrets in environment variables or ConfigMaps (they're base64-encoded, not encrypted). Instead, use the **AWS Secrets Manager CSI Driver** to mount secrets directly as files into pods. Or use **External Secrets Operator (ESO)** which syncs AWS Secrets Manager secrets into Kubernetes Secrets, encrypted at rest with the EKS envelope encryption KMS key.",
      "**Runtime Security.** Deploy **Falco** or **Amazon GuardDuty for EKS** to detect suspicious runtime behavior: shells spawned inside containers, unexpected network connections, privilege escalation attempts. GuardDuty EKS Protection monitors the audit log and VPC flow logs and generates findings in Security Hub.",
      "**Image Scanning.** Enable ECR image scanning to detect vulnerabilities in your container images before they reach production. Use `aws ecr describe-image-scan-findings` to check results. Block deployments of images with CRITICAL CVEs using an OPA/Gatekeeper admission controller or Kyverno policies.",
    ],
    code: `# === Enforce IMDSv2 on Managed Node Groups (Terraform) ===
eks_managed_node_groups = {
  general = {
    instance_types = ["m5.xlarge"]
    min_size       = 2
    max_size       = 10

    # Force IMDSv2 (prevents SSRF credential theft)
    metadata_options = {
      http_endpoint               = "enabled"
      http_tokens                 = "required"   # IMDSv2 only
      http_put_response_hop_limit = 1            # Block pod IMDS access
    }
  }
}

# === Pod Security Standards: Enforce restricted mode ===
kubectl label namespace default \\
  pod-security.kubernetes.io/enforce=restricted \\
  pod-security.kubernetes.io/warn=restricted \\
  pod-security.kubernetes.io/audit=restricted

# === Install Secrets Store CSI Driver ===
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \\
  --namespace kube-system \\
  --set syncSecret.enabled=true

# Install the AWS provider for Secrets Store
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml

# === SecretProviderClass to mount Aurora credentials ===
cat <<EOF | kubectl apply -f -
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aurora-creds
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "orders-prod/aurora/credentials"
        objectType: "secretsmanager"
        jmesPath:
          - path: username
            objectAlias: DB_USERNAME
          - path: password
            objectAlias: DB_PASSWORD
EOF`,
    practice: "Enable IMDSv2 on your node group. Apply Pod Security Standards to a namespace. Install the Secrets Store CSI Driver and mount an AWS Secrets Manager secret into a pod.",
    solution: `# Verify IMDSv2 is enforced:
aws ec2 describe-instances \\
  --filters "Name=tag:eks:nodegroup-name,Values=general" \\
  --query "Reservations[].Instances[].MetadataOptions"

# Verify PSS is active (try to create a privileged pod — it should fail):
kubectl run priv-test --image=nginx --overrides='{"spec":{"containers":[{"name":"t","image":"nginx","securityContext":{"privileged":true}}]}}'
# Error: pods "priv-test" is forbidden: violates PodSecurity "restricted"

# Verify secret mount:
kubectl exec <pod> -- cat /mnt/secrets/DB_USERNAME`,
  },
  {
    time: "Hour 9",
    title: "Cost Optimization & Right-Sizing",
    concept: [
      "**EKS Costs Breakdown.** You pay for three things: (1) the **EKS control plane** ($0.10/hour = ~$73/month per cluster), (2) the **EC2 instances** in your managed node groups, and (3) **data transfer** and associated services (NAT Gateway, ALB, EBS). The EC2 instances are by far the largest cost. Optimizing them is the highest-leverage activity.",
      "**Right-Sizing Nodes.** The most common mistake is running instances that are too large or too small. Too large: you waste money on idle CPU/memory. Too small: you waste money on node overhead (kubelet, kube-proxy, CNI each consume ~500Mi of memory). Use `kubectl top nodes` and CloudWatch Container Insights to analyze actual utilization. Aim for 60-70% average utilization.",
      "**Spot Instances for Non-Critical Workloads.** Spot instances are spare EC2 capacity offered at up to 90% discount. They can be reclaimed with 2 minutes notice. Use them for: batch processing, dev/test environments, stateless web tiers (if you have enough replicas for graceful failover). Specify multiple instance types (diversification) to reduce interruption frequency.",
      "**Graviton (ARM) Instances.** AWS Graviton (e.g., m7g, c7g, r7g) instances deliver 20-40% better price-performance than equivalent x86 instances. Most containerized workloads run on ARM without changes (multi-arch Docker images). Use the `AL2_ARM_64` AMI type. This is one of the easiest cost optimizations with the highest ROI.",
      "**Savings Plans and Reserved Instances.** If you have consistent baseline capacity, purchase **Compute Savings Plans** (up to 66% discount, flexible across instance families and regions) or RIs for your On-Demand node groups. Apply Savings Plans to the steady-state `min_size` of your node groups, and use Spot for the variable capacity above that.",
      "**Bin Packing and Resource Requests.** Kubernetes scheduler uses `requests` (not `limits`) for placement. If your pods request 1 CPU but only use 0.2 CPU, you're wasting 80% of capacity. Set accurate requests based on real usage data. Use **Vertical Pod Autoscaler (VPA)** in recommendation mode to see what your pods actually need, then update your manifests.",
      "**Best Practice: Namespace Resource Quotas.** Prevent any one team from hogging cluster resources by setting `ResourceQuota` on each namespace. This caps total CPU and memory requests per namespace, forcing teams to right-size their workloads instead of requesting huge resources 'just in case'.",
    ],
    code: `# === Check actual node utilization ===
kubectl top nodes
# NAME                          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# ip-10-0-1-42.ec2.internal    850m         21%    3200Mi          40%
# ip-10-0-2-17.ec2.internal    1200m        30%    4100Mi          51%

# === Install Vertical Pod Autoscaler (recommendation mode) ===
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vpa-v1-crd-gen.yaml
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vpa-rbac.yaml
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vpa-v1-deploy.yaml

# Create a VPA in recommendation mode for your API
cat <<EOF | kubectl apply -f -
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: orders-api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orders-api
  updatePolicy:
    updateMode: "Off"  # recommendations only, no auto-apply
EOF

# Check VPA recommendations after a few hours:
kubectl get vpa orders-api-vpa -o jsonpath='{.status.recommendation.containerRecommendations[0]}'
# {"containerName":"api","lowerBound":{"cpu":"100m","memory":"256Mi"},
#  "target":{"cpu":"250m","memory":"512Mi"},
#  "upperBound":{"cpu":"500m","memory":"1Gi"}}

# === Namespace Resource Quota ===
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "100"
EOF`,
    practice: "Check node utilization with `kubectl top`. Install VPA in recommendation mode. After collecting data, compare VPA recommendations to your current resource requests. Apply a ResourceQuota to a namespace.",
    solution: `# Quick cost analysis:
# Get total allocatable vs requested across all nodes
kubectl describe nodes | grep -A5 "Allocated resources"

# If CPU requested / allocatable < 50%, you're over-provisioned
# If Memory requested / allocatable > 85%, you need more nodes

# Compare Spot pricing:
# m5.xlarge On-Demand: ~ $0.192/hr
# m5.xlarge Spot:      ~ $0.06/hr  (68% savings)
# m7g.xlarge (Graviton): ~ $0.163/hr (15% savings + better perf)`,
  },
  {
    time: "Hour 10",
    title: "Production Best Practices & Checklist",
    concept: [
      "**Multi-AZ Node Distribution.** Always spread your managed node groups across at least 2 (ideally 3) Availability Zones. Use topology spread constraints in your pod specs to ensure replicas are evenly distributed across AZs. This protects against AZ failures and also ensures the Kubernetes scheduler has options.",
      "**Node Group Segmentation Strategy.** Don't put everything in one node group. Create separate groups for: (1) system add-ons (CoreDNS, Fluent Bit, monitoring), (2) general application workloads, (3) batch/processing jobs (Spot), and (4) specialized workloads (GPU, high-memory). Use labels and taints to control scheduling.",
      "**Graceful Shutdown and Pre-Stop Hooks.** When nodes are drained (during scaling or upgrades), pods receive a `SIGTERM`. Your application must handle this signal and gracefully finish in-flight requests. Spring Boot Actuator has built-in graceful shutdown. For other apps, add a `preStop` lifecycle hook with a small sleep (5-10 seconds) to allow load balancer de-registration before the app stops.",
      "**Pod Topology Spread Constraints.** Beyond node labels, use topology spread constraints to tell Kubernetes how to distribute pods across zones and nodes. This prevents all replicas from landing on one node or one AZ. Set `maxSkew: 1` with `topologyKey: topology.kubernetes.io/zone` for AZ-level spreading.",
      "**Tagging Strategy.** Tag all EKS resources (cluster, node groups, EC2 instances, EBS volumes) with: `Environment`, `Team`, `CostCenter`, `Application`. Use AWS Cost Explorer with these tags to get a per-team, per-application cost breakdown. Tags also feed into AWS Config and Security Hub for compliance tracking.",
      "**Disaster Recovery.** For DR: run a standby EKS cluster in a second region. Use Velero for backup/restore of Kubernetes resources and persistent volumes. Store your Terraform state in a cross-region-replicated S3 bucket. Use GitOps (Flux or ArgoCD) so that restoring the cluster is as simple as pointing the new cluster at the Git repository.",
      "**Production Readiness Checklist.** Before going live, verify: (1) Private endpoint only, (2) MNGs in private subnets across 3 AZs, (3) IMDSv2 enforced, (4) Node role has only baseline policies, (5) All app permissions via IRSA, (6) Pod Security Standards enforced, (7) Container Insights and Fluent Bit deployed, (8) Cluster Autoscaler or Karpenter active, (9) PDBs on all critical workloads, (10) EBS volumes encrypted, (11) ECR image scanning enabled, (12) Control plane audit logs enabled.",
    ],
    code: `# === Pod Topology Spread Constraints ===
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
spec:
  replicas: 6
  selector:
    matchLabels:
      app: orders-api
  template:
    metadata:
      labels:
        app: orders-api
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: orders-api
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: orders-api
      containers:
        - name: api
          image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/orders-api:v1.0
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
          terminationGracePeriodSeconds: 30
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              memory: "1Gi"

# === Verify pod distribution across AZs ===
# kubectl get pods -o wide -l app=orders-api
# NAME               NODE                          AZ
# orders-api-abc12   ip-10-0-1-42.ec2.internal     us-east-1a
# orders-api-def34   ip-10-0-2-17.ec2.internal     us-east-1b
# orders-api-ghi56   ip-10-0-3-88.ec2.internal     us-east-1c
# orders-api-jkl78   ip-10-0-1-99.ec2.internal     us-east-1a
# orders-api-mno01   ip-10-0-2-55.ec2.internal     us-east-1b
# orders-api-pqr23   ip-10-0-3-11.ec2.internal     us-east-1c`,
    practice: "Deploy a workload with topology spread constraints across 3 AZs. Add preStop hooks. Verify even distribution and then simulate a node drain to observe graceful shutdown.",
    solution: `# Check pod distribution:
kubectl get pods -l app=orders-api -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,AZ:.metadata.labels['topology\\.kubernetes\\.io/zone']

# Simulate a node drain (as during upgrades):
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
# Watch pods gracefully migrate to other nodes

# Uncordon the node after testing:
kubectl uncordon <node-name>`,
  },
  {
    time: "Homework Project",
    title: "Build a Production-Grade EKS Cluster from Scratch",
    concept: [
      "**Project Goal:** You will build a complete, production-ready EKS cluster using Terraform. The cluster will have segmented managed node groups (system, general, spot), IRSA for secure pod access to AWS services, monitoring with Container Insights, and a deployed sample application with topology spread, PDBs, and graceful shutdown. This is the architecture you would pitch to an enterprise client.",
      "**Step 1 — Create the VPC Foundation.** Using the `terraform-aws-modules/vpc/aws` module, create a VPC with a `/16` CIDR in 3 Availability Zones. Provision public subnets (for the ALB), private subnets (for nodes), and intra subnets (for RDS if needed later). Enable NAT Gateway (single for dev, one-per-AZ for prod). Tag subnets with `kubernetes.io/role/internal-elb = 1` for private and `kubernetes.io/role/elb = 1` for public — EKS needs these tags to auto-discover subnets for load balancers.",
      "**Step 2 — Provision the EKS Cluster.** Use the `terraform-aws-modules/eks/aws` module. Set the cluster version to `1.29`. Enable the private endpoint; disable public (or restrict to your IP for initial setup). Enable control plane logging (api, audit, authenticator). Create three managed node groups: (1) `system` — 2x `t3.large` On-Demand with taint `CriticalAddonsOnly=true:NoSchedule` for CoreDNS and monitoring, (2) `general` — 3-10x `m5.xlarge` On-Demand for your workloads, (3) `spot` — 0-20x mixed `m5/m5a/m6i.large` Spot for batch jobs.",
      "**Step 3 — Configure IAM and IRSA.** Create the OIDC provider (the EKS module does this automatically). Create an IRSA role for your application service account that grants `SecretsManagerReadWrite`. Create a second IRSA role for the Cluster Autoscaler that grants `autoscaling:SetDesiredCapacity`, `autoscaling:TerminateInstanceInAutoScalingGroup`, and `autoscaling:DescribeAutoScalingGroups`.",
      "**Step 4 — Install Core Add-Ons.** After `terraform apply`, configure `kubectl`. Install Cluster Autoscaler (or Karpenter) with the IRSA role created in Step 3. Install the AWS Load Balancer Controller for Ingress. Install Fluent Bit for log forwarding. Enable the CloudWatch Observability add-on for Container Insights. Verify all DaemonSets and Deployments are healthy.",
      "**Step 5 — Enforce Security Baselines.** Apply IMDSv2 enforcement on all node groups via the `metadata_options` block. Label all application namespaces with `pod-security.kubernetes.io/enforce=restricted`. Optionally install the Secrets Store CSI Driver and create a `SecretProviderClass` for your application secrets.",
      "**Step 6 — Deploy the Application.** Write a Kubernetes Deployment for a sample REST API (use `nginx` or your orders-api from previous courses). Set resource requests/limits, topology spread constraints (zone + hostname), a preStop hook, and a PodDisruptionBudget (`minAvailable: 2`). Create a Service of type `ClusterIP` and an Ingress that provisions an ALB via the AWS LB Controller.",
      "**Step 7 — Validate the Full Stack.** Run `kubectl get nodes -o wide` and verify 3+ nodes across 3 AZs. Run `kubectl top nodes` and verify metrics are flowing. Check CloudWatch for Container Insights dashboards. Trigger a node group upgrade and verify the rolling update respects the PDB. Scale the deployment to 50 replicas and watch the autoscaler add nodes. Scale back down and watch it consolidate. Hit the ALB DNS and verify your app responds.",
      "**Step 8 — Document and Destroy.** Write a brief architecture document listing: VPC CIDR, node group configs, IRSA roles, add-ons installed, and the Ingress endpoint. Then `terraform destroy` to clean up (or keep it if you want to continue experimenting). This project proves you can build an enterprise EKS platform from zero.",
    ],
    code: `# === Complete Terraform Project Structure ===
# eks-platform/
# ├── main.tf              # VPC + EKS + Node Groups
# ├── variables.tf         # All input variables
# ├── outputs.tf           # Cluster endpoint, node group ARNs
# ├── backend.tf           # S3 + DynamoDB state backend
# ├── versions.tf          # Provider pinning
# ├── irsa.tf              # IRSA roles for app + autoscaler
# └── k8s/
#     ├── cluster-autoscaler.yaml
#     ├── fluent-bit.yaml
#     ├── deployment.yaml   # App + PDB + Ingress
#     └── pss-labels.yaml   # Pod Security Standards

# === main.tf (key sections) ===
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "eks-prod-vpc"
  cidr    = "10.0.0.0/16"
  azs     = ["us-east-1a", "us-east-1b", "us-east-1c"]

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false   # one per AZ for HA
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.0"
  cluster_name    = "prod-platform"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = false

  cluster_enabled_log_types = ["api", "audit", "authenticator"]

  eks_managed_node_groups = {
    system = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
      min_size = 2
      max_size = 3
      desired_size = 2
      disk_size = 50

      labels = { role = "system" }
      taints = [{
        key    = "CriticalAddonsOnly"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]

      metadata_options = {
        http_tokens                 = "required"
        http_put_response_hop_limit = 1
      }
    }

    general = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m5.xlarge", "m5a.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size = 3
      max_size = 10
      desired_size = 3
      disk_size = 100

      labels = { role = "general" }

      update_config = { max_unavailable = 1 }

      metadata_options = {
        http_tokens                 = "required"
        http_put_response_hop_limit = 1
      }
    }

    spot = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m5.large", "m5a.large", "m6i.large", "m5d.large"]
      capacity_type  = "SPOT"
      min_size = 0
      max_size = 20
      desired_size = 0
      disk_size = 50

      labels = { role = "spot-worker" }
      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}`,
    practice: "Build the complete EKS platform from scratch using Terraform. Deploy add-ons, enforce security, deploy a sample app, and validate the full stack as described in the steps above.",
    solution: `# Deployment commands:
# 1. terraform init && terraform plan -out=eks.plan
# 2. terraform apply eks.plan
# 3. aws eks update-kubeconfig --name prod-platform
# 4. kubectl get nodes -o wide  (verify 5+ nodes in 3 AZs)
# 5. helm install cluster-autoscaler ... (with IRSA)
# 6. kubectl apply -f k8s/fluent-bit.yaml
# 7. kubectl label ns default pod-security.kubernetes.io/enforce=restricted
# 8. kubectl apply -f k8s/deployment.yaml  (app + PDB + Ingress)
# 9. kubectl get ingress  (get ALB DNS)
# 10. curl http://ALB_DNS  (verify app responds)
# 11. kubectl scale deploy orders-api --replicas=50  (trigger scale-up)
# 12. kubectl get nodes -w  (watch new nodes appear)
# 13. terraform destroy  (clean up when done)`,
  },
];
