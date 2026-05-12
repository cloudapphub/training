export const cfnLessons = [
  {
    time: "Lesson 1",
    title: "What is AWS CloudFormation?",
    concept: [
      "**Infrastructure as Code (IaC).** CloudFormation lets you define your entire AWS infrastructure — VPCs, EC2 instances, RDS, IAM roles, Lambda functions — as a text file (JSON or YAML). That file is the single source of truth. You version it in Git, review it in PRs, and deploy it consistently across dev/staging/prod. No more 'works on my account' surprises.",
      "**Templates, Stacks, and Change Sets.** A **Template** is the YAML/JSON file describing what you want. A **Stack** is the deployed instance of that template — the actual AWS resources CloudFormation created and now manages. A **Change Set** is a preview of what will change before you execute an update. Think: template = blueprint, stack = the building, change set = the architect's revision notes before construction.",
      "**How CloudFormation works internally.** When you submit a template, CloudFormation: (1) Parses and validates the template, (2) Determines resource create/update/delete order using a dependency graph, (3) Makes the AWS API calls in parallel where safe, (4) Records all events to a Stack Events log, (5) On failure, automatically rolls back every resource to the prior state. This atomic all-or-nothing behavior is the core value proposition.",
      "**Stack States you must know.** `CREATE_IN_PROGRESS`, `CREATE_COMPLETE`, `CREATE_FAILED` (rollback triggered), `UPDATE_IN_PROGRESS`, `UPDATE_COMPLETE`, `UPDATE_ROLLBACK_IN_PROGRESS`, `UPDATE_ROLLBACK_COMPLETE`, `DELETE_IN_PROGRESS`, `DELETE_FAILED` (stuck — resources have delete protection or dependencies). `ROLLBACK_FAILED` is the worst state — resources are partially deployed and CloudFormation cannot roll back. You must manually fix and use `CONTINUE_UPDATE_ROLLBACK`.",
      "**CloudFormation vs Terraform.** Both are IaC tools. Key differences: CloudFormation is AWS-native (no state file to manage — AWS stores state), works with every new AWS service on day 0, and has StackSets for multi-account/multi-region deployment built in. Terraform is multi-cloud, has a richer module ecosystem, but requires managing a state backend (S3+DynamoDB). For AWS-only shops, CloudFormation is a strong default.",
    ],
    code: `# Deploy a stack from a template file
aws cloudformation deploy \\
  --template-file template.yaml \\
  --stack-name my-app-stack \\
  --parameter-overrides Env=prod \\
  --capabilities CAPABILITY_IAM \\
  --region us-east-1

# List all stacks and their status
aws cloudformation list-stacks \\
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Tail stack events (great for debugging deployments)
aws cloudformation describe-stack-events \\
  --stack-name my-app-stack \\
  --query "StackEvents[*].{Time:Timestamp,Status:ResourceStatus,Resource:LogicalResourceId,Reason:ResourceStatusReason}" \\
  --output table

# Delete a stack (destroys all resources it owns)
aws cloudformation delete-stack --stack-name my-app-stack`,
    practice: "Create a minimal CloudFormation template that provisions an S3 bucket. Deploy it as a stack, verify the bucket was created, then delete the stack and confirm the bucket is also deleted.",
    solution: `# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: My first CloudFormation stack
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-cfn-bucket-\${AWS::AccountId}'

# Deploy:
aws cloudformation deploy \\
  --template-file template.yaml \\
  --stack-name s3-demo

# Verify:
aws s3 ls | grep my-cfn-bucket

# Teardown:
aws cloudformation delete-stack --stack-name s3-demo`,
  },
  {
    time: "Lesson 2",
    title: "Template Anatomy — All Sections Explained",
    concept: [
      "**AWSTemplateFormatVersion.** Always `'2010-09-09'` — the only valid value. Optional but recommended as a best practice. Including it makes the template's intent unambiguous to parsers and humans.",
      "**Parameters — dynamic inputs.** Parameters make templates reusable. You define typed inputs (String, Number, List, AWS-specific types like `AWS::EC2::KeyPair::KeyName`) with optional constraints (`AllowedValues`, `MinLength`, `MaxValue`, `AllowedPattern`). At deploy time, you pass values via CLI (`--parameter-overrides`) or the console. Use `AWS::SSM::Parameter::Value<String>` type to pull values directly from SSM Parameter Store — perfect for AMI IDs, shared config.",
      "**Mappings — static lookup tables.** Mappings are hardcoded key-value tables used with `Fn::FindInMap`. Classic use: map a region name to an AMI ID, or an environment name to an instance type. Unlike Parameters, Mappings cannot be overridden at deploy time — they are baked into the template.",
      "**Conditions — deploy resources conditionally.** Conditions let you create resources only in certain contexts. Example: `IsProd: !Equals [!Ref Env, prod]`. Then on a resource: `Condition: IsProd` — that resource only gets created when deploying to prod. Conditions can also be used inside `Fn::If` in property values.",
      "**Resources — the only mandatory section.** Every template must have at least one Resource. Resources have a `Type` (e.g., `AWS::EC2::Instance`), `Properties`, and optional `DependsOn`, `DeletionPolicy`, `UpdateReplacePolicy`, `Metadata`, and `Condition`. CloudFormation supports 1,200+ resource types across all AWS services.",
      "**Outputs — share values between stacks.** Outputs export values for human inspection or cross-stack reference. Use `Export: Name:` to make a value importable by other stacks using `Fn::ImportValue`. Critical rule: you cannot delete a stack that has an active Export being imported by another stack — it will error with a dependency message.",
    ],
    code: `AWSTemplateFormatVersion: '2010-09-09'
Description: Full template anatomy demo

# ── PARAMETERS ──────────────────────────────────────────────
Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev
    Description: Deployment environment

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium]

  LatestAmiId:   # Pull from SSM — always gets the latest AL2023 AMI
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64

# ── MAPPINGS ────────────────────────────────────────────────
Mappings:
  EnvConfig:
    dev:     { DeletionPolicy: Delete,  MultiAZ: false }
    staging: { DeletionPolicy: Retain,  MultiAZ: false }
    prod:    { DeletionPolicy: Retain,  MultiAZ: true  }

# ── CONDITIONS ──────────────────────────────────────────────
Conditions:
  IsProd:    !Equals [!Ref Environment, prod]
  IsNotDev:  !Not [!Equals [!Ref Environment, dev]]

# ── RESOURCES ────────────────────────────────────────────────
Resources:
  AppBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: !FindInMap [EnvConfig, !Ref Environment, DeletionPolicy]
    Properties:
      VersioningConfiguration:
        Status: !If [IsProd, Enabled, Suspended]

  ProdOnlyAlarm:        # Only created in prod
    Type: AWS::CloudWatch::Alarm
    Condition: IsProd
    Properties:
      AlarmName: prod-cpu-alarm
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 2
      Period: 300
      Statistic: Average

# ── OUTPUTS ─────────────────────────────────────────────────
Outputs:
  BucketName:
    Value: !Ref AppBucket
    Description: S3 Bucket name
    Export:
      Name: !Sub '\${AWS::StackName}-BucketName'`,
    practice: "Write a template with a Parameter for Environment (dev/prod), a Condition that enables S3 versioning only in prod, and an Output that exports the bucket ARN.",
    solution: `Parameters:
  Env:
    Type: String
    AllowedValues: [dev, prod]

Conditions:
  IsProd: !Equals [!Ref Env, prod]

Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: !If [IsProd, Enabled, Suspended]

Outputs:
  BucketArn:
    Value: !GetAtt Bucket.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-BucketArn'`,
  },
  {
    time: "Lesson 3",
    title: "Intrinsic Functions — The CloudFormation Expression Language",
    concept: [
      "**Ref — the Swiss Army knife.** `!Ref LogicalId` returns the 'default value' of a resource or parameter. For a Parameter, it returns the parameter value. For most resources, it returns the primary identifier (e.g., for `AWS::S3::Bucket` it returns the bucket name, for `AWS::EC2::Instance` it returns the instance ID). Know what `!Ref` returns for each resource type — it varies.",
      "**Fn::GetAtt — get specific attributes.** `!GetAtt Resource.AttributeName` retrieves a specific attribute of a resource that `!Ref` doesn't return. Examples: `!GetAtt MyBucket.Arn`, `!GetAtt MyLoadBalancer.DNSName`, `!GetAtt MyLambda.Arn`. Check the CloudFormation docs for each resource type's 'Return Values' section to see what attributes are available.",
      "**Fn::Sub — string substitution.** `!Sub 'prefix-\${ParameterOrResource}'` is the most readable way to build strings. It replaces `\${Variable}` with the `!Ref` value of that variable. You can also use the two-argument form `!Sub ['string \${Var}', {Var: value}]` for custom variable mappings. Prefer `!Sub` over `!Join` for readability.",
      "**Fn::If — conditional values.** `!If [ConditionName, ValueIfTrue, ValueIfFalse]` lets you set property values conditionally. Use `AWS::NoValue` as the false branch to omit a property entirely: `!If [IsProd, !Ref ProdSG, !Ref AWS::NoValue]`.",
      "**Fn::ImportValue — cross-stack references.** Imports an exported Output value from another stack. The imported stack must exist and must not be deleted while the import is active. Pattern: `!ImportValue \${StackName}-ExportName`. Cross-stack references create explicit dependencies between stacks — update the exporting stack first.",
      "**Other key functions.** `!Join ['delimiter', [list]]` — joins a list into a string. `!Select [index, list]` — picks one item from a list. `!Split ['delimiter', string]` — splits a string. `!Base64 string` — base64-encodes a string (used for EC2 UserData). `!FindInMap [MapName, Key1, Key2]` — Mappings lookup. `!Cidr [ipBlock, count, mask]` — generates CIDR blocks from a base CIDR.",
    ],
    code: `Resources:
  # --- Ref examples ---
  MyBucket:
    Type: AWS::S3::Bucket

  MyQueue:
    Type: AWS::SQS::Queue
    Properties:
      # !Ref on a bucket = bucket name
      QueueName: !Sub 'queue-for-\${MyBucket}'

  # --- GetAtt examples ---
  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref MyBucket     # bucket name via Ref
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: s3:GetObject
            Resource: !Sub '\${MyBucket.Arn}/*'  # ARN via GetAtt in Sub

  # --- Fn::If with AWS::NoValue ---
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      # Only attach monitoring in prod
      Monitoring: !If [IsProd, true, false]
      # Only set KMS key in prod; omit property in dev
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            KmsKeyId: !If [IsProd, !Ref KmsKey, !Ref AWS::NoValue]
            VolumeSize: 30

  # --- EC2 UserData with Fn::Base64 + Fn::Sub ---
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0abcdef1234567890
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          echo "Stack: \${AWS::StackName}" > /etc/motd
          echo "Region: \${AWS::Region}" >> /etc/motd

# --- Cross-stack import ---
  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !ImportValue 'networking-stack-VpcId'
      GroupDescription: App SG`,
    practice: "Write a template that uses !Sub to name an SQS queue after the stack name and environment parameter, uses !GetAtt to output the queue ARN, and uses !If to set the queue's MessageRetentionPeriod to 1209600 (14 days) in prod and 86400 (1 day) in dev.",
    solution: `Parameters:
  Env:
    Type: String
    AllowedValues: [dev, prod]
Conditions:
  IsProd: !Equals [!Ref Env, prod]
Resources:
  MyQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '\${AWS::StackName}-\${Env}-queue'
      MessageRetentionPeriod: !If [IsProd, 1209600, 86400]
Outputs:
  QueueArn:
    Value: !GetAtt MyQueue.Arn`,
  },
  {
    time: "Lesson 4",
    title: "Resources Deep Dive — DependsOn, DeletionPolicy & UpdateReplacePolicy",
    concept: [
      "**DependsOn — explicit ordering.** CloudFormation builds a dependency graph from `!Ref` and `!GetAtt` references and automatically determines the creation order. `DependsOn` adds an explicit edge for cases where a resource must wait for another but has no direct reference relationship. Example: an EC2 instance that needs an Internet Gateway to be attached to the VPC before it can reach the internet — but the instance doesn't directly reference the IGW attachment.",
      "**DeletionPolicy — what happens when the stack is deleted.** Three options: `Delete` (default — resource is permanently deleted), `Retain` (resource is kept in AWS, removed from stack management), `Snapshot` (for supported resources like RDS, ElastiCache — takes a final snapshot before deleting). Production databases should always have `DeletionPolicy: Retain` or `Snapshot`. This saved many teams from accidental data loss.",
      "**UpdateReplacePolicy — what happens when CloudFormation must replace a resource.** When you change a property that requires CloudFormation to create a new resource and delete the old one (e.g., renaming an RDS instance), `UpdateReplacePolicy` controls what happens to the OLD resource. Same three options as DeletionPolicy. Set `UpdateReplacePolicy: Snapshot` on RDS so even replacement operations take a final snapshot.",
      "**Resource Update Behaviors.** Not all property changes are equal. CloudFormation has three update types: (1) **Update with No Interruption** — property changes in-place, no downtime (e.g., adding a tag). (2) **Update with Some Interruption** — brief disruption (e.g., changing EC2 instance type — causes a stop/start). (3) **Requires Replacement** — old resource deleted, new one created (e.g., changing an RDS DBInstanceIdentifier). Always check the CloudFormation docs 'Update requires' column before deploying.",
      "**CreationPolicy and WaitConditions.** `CreationPolicy` on EC2 instances or Auto Scaling groups tells CloudFormation to wait for a success signal before marking the resource as `CREATE_COMPLETE`. The instance's UserData script sends the signal via `cfn-signal` after the app is fully configured. This prevents CloudFormation from completing before your app is actually ready.",
    ],
    code: `Resources:
  # VPC first
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

  IGW:
    Type: AWS::EC2::InternetGateway

  IGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref IGW

  # Instance has no direct ref to IGWAttachment but needs it ready
  PublicInstance:
    Type: AWS::EC2::Instance
    DependsOn: IGWAttachment   # explicit ordering
    Properties:
      ImageId: ami-0abcdef1234567890
      SubnetId: !Ref PublicSubnet

  # RDS with retention and snapshot policies
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot       # snapshot before delete
    UpdateReplacePolicy: Snapshot  # snapshot before replacement
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: admin
      MasterUserPassword: '{{resolve:secretsmanager:MySecret:SecretString:password}}'
      AllocatedStorage: '20'

  # EC2 with CreationPolicy — waits for cfn-signal
  WebServer:
    Type: AWS::EC2::Instance
    CreationPolicy:
      ResourceSignal:
        Timeout: PT10M  # wait up to 10 minutes for signal
    Properties:
      ImageId: ami-0abcdef1234567890
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum install -y aws-cfn-bootstrap
          # ... configure app ...
          /opt/aws/bin/cfn-signal -e $? \\
            --stack \${AWS::StackName} \\
            --resource WebServer \\
            --region \${AWS::Region}`,
    practice: "Create an RDS instance with DeletionPolicy: Snapshot and UpdateReplacePolicy: Snapshot. Add a DependsOn to ensure a security group is created before the RDS instance.",
    solution: `Resources:
  DBSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS SG
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: 10.0.0.0/16

  Database:
    Type: AWS::RDS::DBInstance
    DependsOn: DBSG
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      VPCSecurityGroups: [!Ref DBSG]
      MasterUsername: admin
      MasterUserPassword: mypassword
      AllocatedStorage: '20'`,
  },
  {
    time: "Lesson 5",
    title: "Change Sets — Safe Deployments & Impact Analysis",
    concept: [
      "**Why Change Sets exist.** When you update a stack, CloudFormation immediately starts making changes. Change Sets add a preview step — you create the change set, review what will be added/modified/removed and with what impact (no interruption / some interruption / replacement), then decide whether to execute. This is mandatory for any production update.",
      "**Change Set Actions.** Each resource change in a Change Set has an Action (`Add`, `Modify`, `Remove`) and a Replacement field (`True`, `False`, `Conditional`). `Replacement: True` means the resource will be deleted and recreated — dangerous for stateful resources. Always look for `Replacement: True` items in a change set and verify the `DeletionPolicy` covers you.",
      "**Executing and abandoning Change Sets.** A stack can have multiple pending change sets. You execute one or abandon (delete) it. Abandoned change sets leave the stack unchanged. Change sets expire after a configurable time. In CI/CD pipelines, best practice is: Create change set → Gate on manual approval (or automated test) → Execute.",
      "**Change Set limitations.** Change sets do NOT detect all side effects. They cannot tell you if a Lambda function's new code will break at runtime, if a new IAM policy is overly permissive, or if a database schema migration will fail. They only show CloudFormation API-level changes. Combine change sets with cfn-lint, CloudFormation Guard, and integration tests.",
    ],
    code: `# Step 1: Create a change set (does not deploy anything)
aws cloudformation create-change-set \\
  --stack-name my-app-stack \\
  --change-set-name update-$(date +%Y%m%d-%H%M%S) \\
  --template-body file://template.yaml \\
  --parameters ParameterKey=Env,ParameterValue=prod \\
  --capabilities CAPABILITY_IAM

# Step 2: Review the changes (look for Replacement=True!)
aws cloudformation describe-change-set \\
  --stack-name my-app-stack \\
  --change-set-name update-20240101-120000 \\
  --query "Changes[*].{Action:ResourceChange.Action,Resource:ResourceChange.LogicalResourceId,Replace:ResourceChange.Replacement,Type:ResourceChange.ResourceType}" \\
  --output table
# Action | Resource     | Replace     | Type
# Modify | Database     | True        | AWS::RDS::DBInstance  <-- DANGER!
# Modify | AppBucket    | False       | AWS::S3::Bucket        <-- safe
# Add    | MonitorAlarm | N/A         | AWS::CloudWatch::Alarm

# Step 3a: Execute if safe
aws cloudformation execute-change-set \\
  --stack-name my-app-stack \\
  --change-set-name update-20240101-120000

# Step 3b: Abandon if not safe
aws cloudformation delete-change-set \\
  --stack-name my-app-stack \\
  --change-set-name update-20240101-120000`,
    practice: "Deploy a stack with an S3 bucket. Modify the template to add a tag to the bucket and rename the queue. Create a change set and inspect which change causes a replacement vs. which is an in-place update.",
    solution: `# Adding a tag = Modify, Replace=False (safe, no interruption)
# Renaming SQS queue = Modify, Replace=True (DANGEROUS - new queue created, old deleted)

# Always check before executing:
aws cloudformation describe-change-set \\
  --stack-name my-stack \\
  --change-set-name my-changeset \\
  --query "Changes[?ResourceChange.Replacement=='True'].ResourceChange.LogicalResourceId"
# ["MyQueue"]  <-- this will be deleted and recreated!`,
  },
  {
    time: "Lesson 6",
    title: "Nested Stacks — Modular Infrastructure Design",
    concept: [
      "**Why Nested Stacks.** A single CloudFormation template has limits: 500 resources, 200 parameters, 200 outputs. More importantly, monolithic templates become unmaintainable. Nested Stacks let you break infrastructure into reusable modules — a networking stack, a security stack, an application stack — and compose them in a parent (root) stack.",
      "**How Nested Stacks work.** The parent stack contains child stacks as `AWS::CloudFormation::Stack` resources. The parent passes Parameters to each child. Child Outputs are accessible in the parent via `!GetAtt ChildStack.Outputs.OutputName`. The parent manages the full lifecycle — when you update the parent, it propagates changes to children in the correct order.",
      "**Template URL requirement.** Child templates must be stored in an S3 bucket. You reference them via `TemplateURL`. In CI/CD, package your templates first with `aws cloudformation package` — it automatically uploads nested templates to S3 and rewrites the references. Use `--s3-bucket` and `--s3-prefix` to organize your templates.",
      "**Nested Stacks vs. Cross-Stack References.** Nested stacks are tightly coupled — the parent owns the children. Cross-stack references (Export/ImportValue) are loosely coupled — independent stacks share values. Use nested stacks for components that always deploy together (VPC + subnets + route tables). Use cross-stack references for components with independent lifecycles (a shared VPC used by many app stacks).",
    ],
    code: `# networking.yaml (child template)
Outputs:
  VpcId:
    Value: !Ref MyVPC
    Export:
      Name: !Sub '\${AWS::StackName}-VpcId'
  PrivateSubnetIds:
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]

---
# root.yaml (parent template)
Parameters:
  TemplateBucket:
    Type: String
    Default: my-cfn-templates

Resources:
  # Child Stack 1: Networking
  NetworkingStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://\${TemplateBucket}.s3.amazonaws.com/networking.yaml'
      Parameters:
        VpcCidr: 10.0.0.0/16
        Environment: !Ref Environment
      TimeoutInMinutes: 15

  # Child Stack 2: Application (depends on networking outputs)
  AppStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://\${TemplateBucket}.s3.amazonaws.com/app.yaml'
      Parameters:
        # Pass child output to another child
        VpcId: !GetAtt NetworkingStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkingStack.Outputs.PrivateSubnetIds

# Package and deploy nested stacks:
# aws cloudformation package \\
#   --template-file root.yaml \\
#   --s3-bucket my-cfn-templates \\
#   --output-template-file packaged.yaml
# aws cloudformation deploy \\
#   --template-file packaged.yaml \\
#   --stack-name root-stack`,
    practice: "Build a two-level nested stack: a parent that deploys a networking child (VPC + subnet) and an application child (S3 bucket) that receives the VPC ID as a parameter.",
    solution: `# networking.yaml
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties: { CidrBlock: 10.0.0.0/16 }
Outputs:
  VpcId:
    Value: !Ref VPC

# app.yaml
Parameters:
  VpcId: { Type: String }
Resources:
  Bucket:
    Type: AWS::S3::Bucket

# root.yaml
Resources:
  Net:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://bucket.s3.amazonaws.com/networking.yaml
  App:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://bucket.s3.amazonaws.com/app.yaml
      Parameters:
        VpcId: !GetAtt Net.Outputs.VpcId`,
  },
  {
    time: "Lesson 7",
    title: "StackSets — Multi-Account & Multi-Region Deployment",
    concept: [
      "**What is a StackSet?** A StackSet is a single CloudFormation template deployed as individual stacks across multiple AWS accounts and/or multiple regions simultaneously. One template, one operation — CloudFormation handles the fan-out. This is the standard pattern for deploying baseline infrastructure (IAM roles, GuardDuty, CloudTrail, SCPs) across an entire AWS Organization.",
      "**Stacks vs StackSets — the key difference.** A Stack lives in ONE account and ONE region. A StackSet is a container in an administrator account that deploys Stack Instances into target accounts and regions. Each Stack Instance is an independent stack — if one fails, others continue. You can update, delete, or override parameters per-account or per-region.",
      "**Permission models — SERVICE_MANAGED vs SELF_MANAGED.** `SERVICE_MANAGED` uses AWS Organizations integration — CloudFormation assumes a service-linked role and can automatically deploy to new accounts as they join an OU. No cross-account role setup needed. `SELF_MANAGED` requires you to create `AWSCloudFormationStackSetAdministrationRole` in the admin account and `AWSCloudFormationStackSetExecutionRole` in each target account manually. Use SERVICE_MANAGED for Organizations, SELF_MANAGED for non-Organizations setups.",
      "**Deployment options.** You control: `MaxConcurrentCount/Percentage` (how many accounts/regions deploy in parallel), `FailureToleranceCount/Percentage` (how many failures are acceptable before the operation is marked failed), and `RegionOrder` (deploy us-east-1 before eu-west-1, etc.). For rollouts, start with a low concurrency and tolerance, validate, then increase parallelism.",
      "**Automatic deployment for new accounts.** With SERVICE_MANAGED StackSets and `AutoDeployment: Enabled: true`, when a new account joins a target OU, CloudFormation automatically deploys the StackSet to it. When an account leaves the OU, the stack instance is automatically deleted. This is the foundation of account vending machines.",
    ],
    code: `# Create a StackSet (SERVICE_MANAGED — requires AWS Organizations)
aws cloudformation create-stack-set \\
  --stack-set-name baseline-security \\
  --template-body file://security-baseline.yaml \\
  --permission-model SERVICE_MANAGED \\
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false \\
  --capabilities CAPABILITY_NAMED_IAM

# Deploy to all accounts in an OU across 2 regions
aws cloudformation create-stack-instances \\
  --stack-set-name baseline-security \\
  --deployment-targets OrganizationalUnitIds='["ou-abc-12345678"]' \\
  --regions us-east-1 eu-west-1 \\
  --operation-preferences \\
    MaxConcurrentPercentage=25,FailureTolerancePercentage=10 \\
    RegionConcurrencyType=PARALLEL

# Check operation status
aws cloudformation describe-stack-set-operation \\
  --stack-set-name baseline-security \\
  --operation-id <operation-id> \\
  --query "StackSetOperation.{Status:Status,Action:Action}"

# Update a StackSet (deploys to all instances)
aws cloudformation update-stack-set \\
  --stack-set-name baseline-security \\
  --template-body file://security-baseline-v2.yaml \\
  --regions us-east-1 eu-west-1

# Override parameters for a specific account
aws cloudformation update-stack-instances \\
  --stack-set-name baseline-security \\
  --accounts '["111122223333"]' \\
  --regions us-east-1 \\
  --parameter-overrides ParameterKey=AlertEmail,ParameterValue=team@company.com`,
    practice: "Design the IAM role structure needed for SELF_MANAGED StackSets. What role goes in the admin account? What role goes in each target account? What trust relationship must exist between them?",
    solution: `# Admin account: AWSCloudFormationStackSetAdministrationRole
# Trusts: cloudformation.amazonaws.com
# Allows: sts:AssumeRole on AWSCloudFormationStackSetExecutionRole

# Target accounts: AWSCloudFormationStackSetExecutionRole
# Trusts: the admin account ID (sts:AssumeRole)
# Allows: AdministratorAccess (or scoped permissions)

# Trust policy for ExecutionRole in target accounts:
{
  "Principal": {
    "AWS": "arn:aws:iam::ADMIN_ACCOUNT_ID:role/AWSCloudFormationStackSetAdministrationRole"
  },
  "Action": "sts:AssumeRole"
}`,
  },
  {
    time: "Lesson 8",
    title: "Drift Detection, Stack Policies & Rollback",
    concept: [
      "**Drift Detection — catching out-of-band changes.** Drift occurs when someone manually changes a resource (via console or CLI) that CloudFormation manages. CloudFormation's expected state and the actual AWS state diverge. Drift detection compares the template's expected configuration against the live resource. Results: `IN_SYNC`, `MODIFIED` (properties changed), `DELETED` (resource removed), `NOT_CHECKED`. Run drift detection regularly in prod — it reveals undocumented manual changes.",
      "**Remediate drift.** After detecting drift, you have two options: (1) Update the template to match reality (accept the manual change as intentional). (2) Re-deploy the stack to force AWS back to the template state (reject the manual change). Never leave drift unresolved — it means your template is no longer the source of truth.",
      "**Stack Policies — protect resources during updates.** A Stack Policy is a JSON document that controls which resources can be updated and how during a stack update. Example: deny all updates to your production RDS instance unless explicitly overridden. The policy uses Allow/Deny Effect with Action values like `Update:Modify`, `Update:Replace`, `Update:Delete`. To override a policy for a specific update, pass `--stack-policy-during-update-body` with a temporary policy.",
      "**Rollback triggers — automatic rollback on alarms.** You can configure CloudWatch Alarms as rollback triggers on a stack. If any alarm goes into ALARM state during or shortly after a stack update, CloudFormation automatically rolls back the entire update. This is a powerful safety net for production deployments.",
      "**Termination Protection.** Enable termination protection on production stacks to prevent accidental deletion. With protection enabled, `delete-stack` calls are rejected. You must explicitly disable protection before deletion. Enable it with `aws cloudformation update-termination-protection --enable-termination-protection --stack-name prod-stack`.",
    ],
    code: `# Detect drift on an entire stack
aws cloudformation detect-stack-drift --stack-name my-app-stack
# Returns a drift detection ID

# Check drift detection status and results
aws cloudformation describe-stack-drift-detection-status \\
  --stack-drift-detection-id <id>

# Get per-resource drift details
aws cloudformation describe-stack-resource-drifts \\
  --stack-name my-app-stack \\
  --stack-resource-drift-status-filters MODIFIED DELETED \\
  --query "StackResourceDrifts[*].{Resource:LogicalResourceId,Status:StackResourceDriftStatus}"

# Stack Policy — deny replacement/deletion of RDS in prod
aws cloudformation set-stack-policy \\
  --stack-name prod-stack \\
  --stack-policy-body '{
    "Statement": [
      {
        "Effect": "Deny",
        "Action": ["Update:Replace", "Update:Delete"],
        "Principal": "*",
        "Resource": "LogicalResourceId/Database"
      },
      {
        "Effect": "Allow",
        "Action": "Update:*",
        "Principal": "*",
        "Resource": "*"
      }
    ]
  }'

# Enable termination protection
aws cloudformation update-termination-protection \\
  --enable-termination-protection \\
  --stack-name prod-stack

# Deploy with CloudWatch rollback triggers
aws cloudformation deploy \\
  --stack-name my-stack \\
  --rollback-configuration RollbackTriggers=['{Arn: arn:aws:cloudwatch:us-east-1:123:alarm/ErrorRateHigh,Type: AWS::CloudWatch::Alarm}'],MonitoringTimeInMinutes=10`,
    practice: "Enable termination protection on a stack. Try to delete it and observe the error. Then disable protection and delete successfully. Also run drift detection after manually adding a tag to a resource in the console.",
    solution: `# Enable protection
aws cloudformation update-termination-protection \\
  --enable-termination-protection --stack-name my-stack

# Attempt delete -- will fail:
aws cloudformation delete-stack --stack-name my-stack
# Error: Stack [my-stack] cannot be deleted while TerminationProtection is enabled

# Disable then delete:
aws cloudformation update-termination-protection \\
  --no-enable-termination-protection --stack-name my-stack
aws cloudformation delete-stack --stack-name my-stack`,
  },
  {
    time: "Lesson 9",
    title: "Custom Resources & Dynamic References",
    concept: [
      "**Custom Resources — extend CloudFormation with Lambda.** Custom Resources let you run arbitrary code during stack create/update/delete by triggering a Lambda function or SNS topic. CloudFormation sends a request with a `RequestType` (Create/Update/Delete), `ResourceProperties`, and a `ResponseURL` (pre-signed S3 URL). Your Lambda does the work and POSTs a SUCCESS or FAILED response to the URL. Use cases: generate passwords, create Route53 records in another account, call third-party APIs.",
      "**Dynamic References — pull secrets at deploy time.** Instead of hardcoding secrets in templates or passing them as parameters (which show in CloudFormation console), use Dynamic References. `{{resolve:secretsmanager:MySecret:SecretString:password}}` pulls the value from Secrets Manager at deploy time. `{{resolve:ssm:/my/param}}` pulls from SSM Parameter Store. `{{resolve:ssm-secure:/my/secure-param}}` pulls an encrypted SecureString. These values are never stored in the stack template or visible in the console.",
      "**CloudFormation Registry and Modules.** The CloudFormation Registry lets you publish private resource types (your own `MyCompany::Network::VPC` resource) and modules (reusable template fragments). Modules are similar to nested stacks but embedded inline — they expand into resources in the parent template's resource section. Great for enforcing company standards (every EC2 must have these tags and this security group).",
    ],
    code: `# Custom Resource backed by Lambda
Resources:
  # The Lambda function
  GeneratePasswordFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt LambdaRole.Arn
      Code:
        ZipFile: |
          import json, boto3, urllib3, secrets, string

          def handler(event, context):
              http = urllib3.PoolManager()
              try:
                  req_type = event['RequestType']
                  if req_type in ['Create', 'Update']:
                      alphabet = string.ascii_letters + string.digits
                      password = ''.join(secrets.choice(alphabet) for _ in range(24))
                      response_data = {'Password': password}
                  else:  # Delete
                      response_data = {}

                  http.request('PUT', event['ResponseURL'],
                    body=json.dumps({
                      'Status': 'SUCCESS',
                      'PhysicalResourceId': 'GeneratedPassword',
                      'StackId': event['StackId'],
                      'RequestId': event['RequestId'],
                      'LogicalResourceId': event['LogicalResourceId'],
                      'Data': response_data
                    }))
              except Exception as e:
                  http.request('PUT', event['ResponseURL'],
                    body=json.dumps({'Status': 'FAILED', 'Reason': str(e),
                      'StackId': event['StackId'], 'RequestId': event['RequestId'],
                      'LogicalResourceId': event['LogicalResourceId'],
                      'PhysicalResourceId': 'error'}))

  # The Custom Resource — triggers the Lambda
  GeneratedPassword:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt GeneratePasswordFunction.Arn
      Length: 24

  # Use the generated password
  MySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      SecretString: !Sub
        - '{"password":"\${Pass}"}'
        - Pass: !GetAtt GeneratedPassword.Password

# Dynamic References — no secrets in template!
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      MasterUsername: '{{resolve:secretsmanager:prod/db:SecretString:username}}'
      MasterUserPassword: '{{resolve:secretsmanager:prod/db:SecretString:password}}'
      DBInstanceClass: '{{resolve:ssm:/prod/rds/instance-class}}'`,
    practice: "Write a Custom Resource Lambda that checks if an S3 bucket name is globally available and returns true/false. Use the result in a Condition to either create the bucket or skip it.",
    solution: `# Lambda checks bucket availability via head_bucket
# Returns {'Available': 'true'} or {'Available': 'false'}
# In template:
Conditions:
  BucketAvailable: !Equals [!GetAtt CheckBucket.Available, 'true']
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Condition: BucketAvailable`,
  },
  {
    time: "Lesson 10",
    title: "cfn-lint, CloudFormation Guard & CI/CD Best Practices",
    concept: [
      "**cfn-lint — catch errors before deployment.** cfn-lint is AWS's open-source CloudFormation linter. It validates templates against the CloudFormation resource specification, catching: invalid resource types, missing required properties, incorrect property types, deprecated properties, and common anti-patterns. Run it in your CI pipeline before every deploy. Zero-cost, catches 80% of template errors without needing an AWS account.",
      "**CloudFormation Guard (cfn-guard) — policy-as-code.** Guard lets you write rules in a declarative language to enforce organizational policies on templates. Examples: 'all S3 buckets must have versioning enabled', 'no security groups may have 0.0.0.0/0 ingress on port 22', 'all RDS instances must have DeletionPolicy: Retain'. Run Guard in CI to block non-compliant templates before they reach AWS. It also integrates with AWS Config for continuous compliance.",
      "**CI/CD pipeline pattern for CloudFormation.** Best practice pipeline: (1) `cfn-lint` — validate syntax and resource specs. (2) `cfn-guard` — enforce policies. (3) `cfn-nag` or Checkov — security scanning. (4) `aws cloudformation validate-template` — AWS-side validation. (5) Create Change Set in staging → run integration tests. (6) Manual approval gate for prod. (7) Execute Change Set in prod with rollback triggers. (8) Monitor CloudWatch alarms post-deploy.",
      "**Tips & Tricks.** Use `!Sub` instead of `!Join` for readability. Use `AWS::AccountId`, `AWS::Region`, `AWS::StackName` pseudo-parameters to make templates self-referential. Use `AWS::NoValue` to conditionally omit properties. Store sensitive defaults in SSM Parameter Store and reference with `AWS::SSM::Parameter::Value` type. Always pin AMI IDs via SSM (`/aws/service/ami-amazon-linux-latest/...`) instead of hardcoding. Use `cfn-flip` to convert between JSON and YAML. Prefer YAML for human-written templates (JSON for generated ones).",
    ],
    code: `# Install and run cfn-lint
pip install cfn-lint
cfn-lint template.yaml
cfn-lint template.yaml --include-checks W  # include warnings
cfn-lint template.yaml --regions us-east-1 eu-west-1

# CloudFormation Guard — write a rule file
cat > rules/s3_security.guard << 'EOF'
# All S3 buckets must have versioning enabled
rule s3_versioning_enabled {
  AWS::S3::Bucket {
    Properties.VersioningConfiguration.Status == "Enabled"
  }
}
# No public bucket ACLs
rule no_public_s3_acl {
  AWS::S3::Bucket {
    Properties.AccessControl not in ["PublicRead","PublicReadWrite"]
  }
}
# No open SSH
rule no_open_ssh {
  AWS::EC2::SecurityGroup {
    Properties.SecurityGroupIngress[*] {
      not (IpProtocol == "tcp" and
           FromPort <= 22 and ToPort >= 22 and
           (CidrIp == "0.0.0.0/0" or CidrIpv6 == "::/0"))
    }
  }
}
EOF

# Run Guard
cfn-guard validate -r rules/s3_security.guard -d template.yaml

# GitHub Actions CI pipeline
# .github/workflows/cfn-deploy.yml
# - run: pip install cfn-lint && cfn-lint template.yaml
# - run: cfn-guard validate -r rules/ -d template.yaml
# - run: aws cloudformation validate-template --template-body file://template.yaml
# - run: aws cloudformation create-change-set ...
# - run: aws cloudformation wait change-set-create-complete ...
# - uses: actions/github-script (manual approval)
# - run: aws cloudformation execute-change-set ...`,
    practice: "Write three cfn-guard rules: (1) All RDS instances must use encryption. (2) All Lambda functions must have a reserved concurrency limit. (3) No EC2 instances can use t2 instance types.",
    solution: `rule rds_encrypted {
  AWS::RDS::DBInstance {
    Properties.StorageEncrypted == true
  }
}
rule lambda_concurrency {
  AWS::Lambda::Function {
    Properties.ReservedConcurrentExecutions exists
    Properties.ReservedConcurrentExecutions > 0
  }
}
rule no_t2_instances {
  AWS::EC2::Instance {
    Properties.InstanceType != /^t2\\.*/
  }
}`,
  },
];

export const cfnInterviewQA = [
  {
    category: "Core Concepts",
    questions: [
      {
        q: "What is the difference between a CloudFormation Stack and a StackSet?",
        a: "A Stack deploys resources in ONE account and ONE region. A StackSet is a container that deploys the same template as individual Stack Instances across MULTIPLE accounts and/or MULTIPLE regions simultaneously. StackSets are used for cross-account/cross-region deployments like security baselines, GuardDuty enablement, or account vending machines.",
        tip: "Always mention the admin/target account role structure for SELF_MANAGED StackSets.",
      },
      {
        q: "What happens when a CloudFormation stack update fails?",
        a: "CloudFormation automatically initiates a rollback. It attempts to revert every resource that was changed back to its previous state. The stack ends in UPDATE_ROLLBACK_COMPLETE. If the rollback itself fails (e.g., a resource was manually deleted during the update), the stack enters UPDATE_ROLLBACK_FAILED. To recover from this state, use `continue-update-rollback` and optionally skip specific resources using `--resources-to-skip`.",
        tip: "Mention ROLLBACK_FAILED is the hardest state to recover from and explain `continue-update-rollback`.",
      },
      {
        q: "What is the difference between DeletionPolicy: Retain and DeletionPolicy: Snapshot?",
        a: "Both keep the resource alive when the stack is deleted. `Retain` keeps the resource exactly as-is with no additional action. `Snapshot` first takes a final snapshot of the resource (supported on RDS, ElastiCache, Redshift, Neptune, DocumentDB) and then deletes it — giving you a recovery point. For production databases, use `Snapshot` so you always have a point-in-time backup even after accidental stack deletion.",
        tip: "Mention that `Snapshot` is only supported on specific resource types — not all resources support it.",
      },
      {
        q: "How do you pass secrets to CloudFormation without them appearing in the template or console?",
        a: "Use Dynamic References: `{{resolve:secretsmanager:MySecret:SecretString:key}}` for Secrets Manager or `{{resolve:ssm-secure:/my/param}}` for SSM SecureString parameters. These are resolved at deployment time by CloudFormation directly — the actual value is never stored in the template, never appears in the CloudFormation console, and never shows in stack parameters. Never pass secrets as Parameter values — they appear in the console and in CloudTrail logs.",
        tip: "Contrast with the wrong approach: passing secrets as Parameters which are logged and visible.",
      },
      {
        q: "What are the three update behaviors for CloudFormation resource properties?",
        a: "(1) Update with No Interruption — property is updated in-place with zero downtime (e.g., adding a tag, updating a Lambda environment variable). (2) Update with Some Interruption — brief disruption during update (e.g., changing EC2 instance type causes a stop/start cycle). (3) Requires Replacement — a new resource is created, traffic/data is migrated, and the old resource is deleted (e.g., changing an RDS DBInstanceIdentifier or an S3 bucket name). Always check the 'Update requires' field in CloudFormation docs before deploying.",
        tip: "This is very frequently asked — memorize the three types and give one example of each.",
      },
      {
        q: "What is CloudFormation Drift and how do you remediate it?",
        a: "Drift occurs when the actual state of a resource differs from what CloudFormation's template expects — usually caused by manual changes in the console or via CLI outside of CloudFormation. Detection shows each resource as IN_SYNC, MODIFIED, DELETED, or NOT_CHECKED. Remediation options: (1) Update the template to match the manual change (accept it), then redeploy to re-sync CloudFormation's knowledge. (2) Redeploy the original template to revert the manual change (reject it). You cannot auto-remediate drift — it requires a deliberate decision.",
        tip: "Mention you should run drift detection on a schedule (e.g., daily) using EventBridge + Lambda.",
      },
    ],
  },
  {
    category: "StackSets & Multi-Account",
    questions: [
      {
        q: "What is the difference between SERVICE_MANAGED and SELF_MANAGED StackSet permission models?",
        a: "SERVICE_MANAGED uses AWS Organizations service-linked roles — no manual IAM role setup required. CloudFormation can automatically deploy to new accounts as they join target OUs (AutoDeployment). SELF_MANAGED requires manually creating `AWSCloudFormationStackSetAdministrationRole` in the admin account (trusted by cloudformation.amazonaws.com) and `AWSCloudFormationStackSetExecutionRole` in every target account (trusted by the admin account). SELF_MANAGED is used when you don't have AWS Organizations or need to target specific non-OU accounts.",
        tip: "Draw the trust relationship: Admin Role → assumes → Execution Role in each target account.",
      },
      {
        q: "What are MaxConcurrentCount and FailureToleranceCount in StackSet operations?",
        a: "MaxConcurrentCount/Percentage controls how many accounts or regions deploy in parallel. Higher values = faster deployment but more blast radius if something goes wrong. FailureToleranceCount/Percentage controls how many stack instance failures are acceptable before the entire StackSet operation is marked as failed. Start conservative (low concurrency, zero tolerance) for critical infrastructure. Increase once you're confident in the template.",
        tip: "Mention the canary pattern: deploy to 1 account first (MaxConcurrent=1), validate, then increase.",
      },
      {
        q: "How do you update only specific Stack Instances in a StackSet?",
        a: "Use `update-stack-instances` (not `update-stack-set`) and specify the exact `--accounts` and `--regions` you want to update. You can also override parameters for specific instances using `--parameter-overrides`. This is useful for testing a change in one account before rolling it out globally, or for applying different configurations per account.",
        tip: "Distinguish update-stack-set (updates all instances) from update-stack-instances (targeted update).",
      },
    ],
  },
  {
    category: "Advanced & Troubleshooting",
    questions: [
      {
        q: "A stack is stuck in DELETE_FAILED. How do you delete it?",
        a: "DELETE_FAILED usually means one or more resources couldn't be deleted (S3 bucket with objects, ECR repo with images, or a resource with termination protection). Steps: (1) Check stack events for the specific resource and error. (2) Manually fix the issue (empty the S3 bucket, delete images, remove dependencies). (3) Retry `delete-stack`. Alternatively, use `--retain-resources` flag to skip specific resources during deletion — CloudFormation removes them from stack management but leaves them in AWS. Then manually clean up the retained resources.",
        tip: "Know the `--retain-resources` flag — it's the escape hatch for stuck DELETE_FAILED stacks.",
      },
      {
        q: "What is the difference between Nested Stacks and Cross-Stack References?",
        a: "Nested Stacks: the parent stack owns and manages child stacks. They are tightly coupled — delete the parent, all children are deleted. Child outputs are accessed via `!GetAtt ChildStack.Outputs.OutputName`. Use for components that always deploy together. Cross-Stack References: independent stacks export values (Export: Name) and other stacks import them (`!ImportValue`). Loosely coupled — stacks have independent lifecycles. Limitation: you cannot delete a stack with active exports being consumed by other stacks. Use for shared infrastructure (VPC, security groups) consumed by many teams.",
        tip: "Key gotcha: cross-stack references block deletion of the exporting stack. Nested stacks don't have this problem.",
      },
      {
        q: "How do you implement a blue/green deployment using CloudFormation?",
        a: "Pattern 1: DNS-based — deploy a Green stack alongside the Blue stack, run tests, then update Route53 to shift traffic (weighted routing or alias swap). Delete the Blue stack after verification. Pattern 2: ASG-based — update the Launch Template AMI in the stack, let CloudFormation do a rolling update with UpdatePolicy. Pattern 3: Code Deploy integration — use `AWS::CodeDeploy::DeploymentGroup` with `BlueGreen` deployment type. The cleanest approach for ECS/Lambda is using `AWS::CodeDeploy::DeploymentGroup` with traffic shifting and rollback alarms.",
        tip: "Mention that CloudFormation's rolling updates respect PodDisruptionBudgets and UpdatePolicy min/max.",
      },
      {
        q: "What is a Custom Resource and when would you use one?",
        a: "A Custom Resource (`AWS::CloudFormation::CustomResource`) executes a Lambda function or SNS topic during stack create/update/delete. CloudFormation sends a JSON request with RequestType (Create/Update/Delete) and waits for a SUCCESS/FAILED response at a pre-signed S3 URL. Use cases: (1) Resources CloudFormation doesn't natively support. (2) Calling third-party APIs during deployment. (3) Generating random values (passwords, tokens). (4) Cross-account operations. (5) Validation logic before creating a resource. The Lambda MUST respond to the ResponseURL — if it times out (default 1 hour), the stack hangs.",
        tip: "Critical gotcha: if your Lambda throws an unhandled exception and never calls the ResponseURL, the stack hangs for 1 hour then times out. Always wrap in try/except and always send a response.",
      },
      {
        q: "How does CloudFormation handle circular dependencies?",
        a: "CloudFormation cannot deploy templates with circular dependencies — Resource A depends on B, B depends on C, C depends on A. It will fail with 'Circular dependency between resources' during template parsing. Solutions: (1) Restructure resources to break the cycle (often by separating into two stacks). (2) Use a Custom Resource to resolve the cycle programmatically. (3) Separate the circular resources into different stacks connected via cross-stack references. Common cause: two security groups referencing each other — resolve by using `AWS::EC2::SecurityGroupIngress` as a separate resource instead of inline rules.",
        tip: "The SG circular dependency is the most common real-world example — know how to solve it with SecurityGroupIngress resources.",
      },
    ],
  },
  {
    category: "Tips & Tricks",
    questions: [
      {
        q: "What are CloudFormation pseudo-parameters and which ones are most useful?",
        a: "`AWS::AccountId` — current account ID (use in resource names/ARNs). `AWS::Region` — current region. `AWS::StackName` — stack name (use to namespace resources). `AWS::StackId` — full stack ARN. `AWS::Partition` — `aws`, `aws-cn`, or `aws-us-gov` (use for GovCloud/China region compatibility). `AWS::URLSuffix` — `amazonaws.com` (use for endpoint URLs). `AWS::NoValue` — omits a property when used in `!If`. Combine them with `!Sub` to create unique, self-referential resource names: `!Sub '\${AWS::StackName}-\${AWS::Region}-bucket'`.",
        tip: "AWS::Partition is often forgotten but essential for multi-partition deployments (GovCloud, China).",
      },
      {
        q: "What are the CloudFormation template limits you should know?",
        a: "Template body: 51,200 bytes via API, 1 MB via S3. Resources per template: 500. Parameters: 200. Outputs: 200. Mappings: 200. Conditions: 200. Stack nesting depth: 5 levels. StackSet max accounts per operation: 2,500. These limits push you toward nested stacks for large infrastructures. Monitor with `aws cloudformation describe-account-limits`.",
        tip: "The 500 resource limit is the most commonly hit — nested stacks are the solution.",
      },
      {
        q: "How do you prevent a production stack from being accidentally deleted?",
        a: "Three layers of protection: (1) Enable Termination Protection: `aws cloudformation update-termination-protection --enable-termination-protection --stack-name prod`. (2) Use Stack Policy to deny Update:Delete on critical resources. (3) Set DeletionPolicy: Retain on stateful resources (RDS, S3) so even if the stack is deleted, the resources survive. Also use SCPs in AWS Organizations to restrict `cloudformation:DeleteStack` in production accounts.",
        tip: "Defense in depth: termination protection + stack policy + DeletionPolicy + SCP — use all four for critical stacks.",
      },
    ],
  },
];
