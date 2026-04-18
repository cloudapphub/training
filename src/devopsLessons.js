export const devopsLessons = [
  {
    time: "60 mins",
    title: "1. The Enterprise DevOps Philosophy & Trunk-Based Operations",
    concept: [
      "Welcome to Enterprise DevOps. In mid-to-large organizations, DevOps is not an individual role; it's a structural bridge between software engineering and operational stability.",
      "Traditional environments suffered from *integration hell* and *merge queues*. Companies shift away from GitFlow (which isolates features for too long) toward **Trunk-Based Development**.",
      "Trunk-Based Development mandates that developers merge code into the main branch multiple times a day. To do this safely, we use **Feature Flags (Toggles)** to decouple *deployment* from *release*.",
      "A deployment is simply moving bits to a server. A release is exposing those bits to end-users. By wrapping new features in remote-controlled flags, we can securely push code to production at any given moment, avoiding massive merge conflicts and orchestrating 'Dark Launches'.",
      "We rely heavily on heavy automated testing (Unit, Integration, E2E) mapped tightly into **Continuous Integration (CI)** pipelines. A broken build on trunk halts all other workflow — fixing the pipeline becomes priority zero by pulling the entire team's focus (**Stop the Line** mentality).",
      "Beyond CI, a true DevOps culture employs **Observability Driven Development (ODD)**, meaning no PR is merged without the logs, metrics, and tracing instrumentation needed to monitor the code in production."
    ],
    code: `// .github/workflows/ci.yml (Trunk-Based Automated Pipeline)
name: Enterprise CI Pipeline
on: 
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

permissions:
  contents: read
  packages: write
  id-token: write # Required for secure AWS OIDC Federation

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Golang Environment
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Unit Tests & Code Coverage
        run: |
          go test -race -v -coverprofile=coverage.out ./...
          # Ensure code quality gates
          go tool cover -func=coverage.out | grep total | awk '{print substr($3, 1, length($3)-1)}' > coverage.txt`,
    practice: "Your CI pipeline is failing randomly due to flaky integration tests that rely on an external database. How do you shift this flaky integration test pattern left?",
    solution: `// Shift the external dependency "left" into the CI machine by using short-lived isolated test environments such as Testcontainers.
// Testcontainers spins up a real Dockerized PostgreSQL database directly inside the CI runner explicitly for the lifespan of the test suite.

package tests

import (
    "context"
    "testing"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/wait"
)

func TestIntegrationWithDB(t *testing.T) {
    ctx := context.Background()
    req := testcontainers.ContainerRequest{
        Image:        "postgres:15-alpine",
        ExposedPorts: []string{"5432/tcp"},
        Env: map[string]string{
            "POSTGRES_USER":     "test",
            "POSTGRES_PASSWORD": "test",
            "POSTGRES_DB":       "testdb",
        },
        WaitingFor: wait.ForLog("database system is ready to accept connections").WithOccurrence(2),
    }
    
    postgresC, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: req,
        Started:          true,
    })
    
    if err != nil {
        t.Fatalf("Failed to start container: %s", err)
    }
    defer postgresC.Terminate(ctx)
    
    // Connect to specific ephemeral port assigned by docker...
}`
  },
  {
    time: "75 mins",
    title: "2. Immutable Infrastructure & AWS Packer Image Pipelines",
    concept: [
      "Mid-to-large enterprises run thousands of ephemeral compute nodes simultaneously. If we SSH into machines to manually install patches or tweak configs sequentially, we suffer from **Configuration Drift**.",
      "**Immutable Infrastructure** is the foundational theorem ensuring repeatability: Once a server (or container) is deployed, it is never modified. If updates are needed, the entire image is rebuilt from scratch and deployed to replace the old ones.",
      "For Virtual Machines on AWS, we achieve this by baking Amazon Machine Images (**AMIs**). This 'Golden Image' contains the OS, security agents (e.g., CrowdStrike/Datadog), language runtimes, and baseline configurations.",
      "Organizations construct **Image Bakery Pipelines** using tools like HashiCorp Packer. When an OS vulnerability is announced, the pipeline automatically boots up an instance, installs patches, bakes a new AMI, distributes it across AWS Regions via AWS Compute Optimizer, and triggers autoscaling groups to rotate nodes.",
      "This pattern eliminates the 'works on my machine' syndrome. In immutable environments, the exact same artifact that is tested in Staging is deployed byte-for-byte in Production."
    ],
    code: `# packer-template.json.pkr.hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  region        = "us-east-1"
  encrypt_boot  = true
  kms_key_id    = "alias/ami-baking-key"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"] # Canonical
  }
  
  instance_type = "t3.micro"
  ssh_username  = "ubuntu"
  ami_name      = "enterprise-golden-ami-{{timestamp}}"
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y chrony amazon-ssm-agent",
      "sudo systemctl enable amazon-ssm-agent"
    ]
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}`,
    practice: "If you have a pipeline creating Golden AMIs, how do you handle zero-downtime rolling updates of an ASG (Auto Scaling Group) once the new AMI is available?",
    solution: `# In the CI/CD deployment phase (using Terraform), we can implement an Instance Refresh on the Auto Scaling Group.
# This forces the ASG to terminate old instances in batches and spin up new instances using the latest Launch Template.

resource "aws_autoscaling_group" "app_asg" {
  name                = "app-asg-\${aws_launch_template.app_lt.latest_version}"
  vpc_zone_identifier = var.private_subnets
  target_group_arns   = [aws_lb_target_group.app_tg.arn]
  
  min_size            = 2
  max_size            = 10
  desired_capacity    = 4

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 300
    }
  }
}
`
  },
  {
    time: "90 mins",
    title: "3. Infrastructure as Code (IaC) - Advanced Terraform Patterns",
    concept: [
      "In modern operations, clicking through the AWS Console is considered a devastating anti-pattern ('ClickOps'). Every AWS resource must be captured via **Infrastructure as Code (IaC)**. Terraform by HashiCorp is the enterprise industry standard.",
      "To prevent catastrophic simultaneous modifications and corruption, state files (\`*.tfstate\`) cannot be kept locally. In AWS, enterprises mandate remote state using an S3 Bucket (for object storage) and DynamoDB (for locking).",
      "**Module Composition:** Terraform code should be heavily modularized. You should never write raw \`aws_vpc\` components. Instead, create versioned internal monolithic modules (e.g., \`git::ssh://repo/modules/network.git?ref=v1.2.0\`).",
      "This architecture enables separating the 'Definition' from the 'Invocation'. Platform teams own the central networking and security Modules. Feature teams invoke those modules to self-serve infrastructure seamlessly, reducing the 'Ops bottleneck'.",
      "A core problem is **Drift** (when reality diverges from state). Large organizations deploy Drift Detection bots (like Terraform Cloud or Atlantis) that continuously run \`terraform plan\` and alert Ops if resources have been manually altered, triggering an automatic remediation."
    ],
    code: `// remote-backend.tf
terraform {
  backend "s3" {
    bucket         = "corp-terraform-state-prod"
    key            = "platform/networking/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locking"
    encrypt        = true
    kms_key_id     = "alias/terraform-state-bucket"
  }
}

// main.tf (Invoking a private module)
module "vpc" {
  source = "git::https://github.com/mycorp/tf-aws-vpc.git?ref=v2.1.4"
  
  environment      = "production"
  vpc_cidr         = "10.0.0.0/16"
  public_subnets   = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets  = ["10.0.10.0/24", "10.0.11.0/24"]
  
  enable_nat_gateway   = true
  single_nat_gateway   = false # HA in prod
  enable_dns_hostnames = true

  tags = {
    Owner       = "platform-team"
    CostCenter  = "9042"
    Compliance  = "pci-dss"
  }
}`,
    practice: "Write the Terraform required to bootstrap the S3 Bucket and DynamoDB Lock table for a new completely isolated AWS Account state backend wrapper.",
    solution: `resource "aws_kms_key" "tf_enc" {
  description             = "KMS key used to encrypt terraform state"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "alias" {
  name          = "alias/tf-state-key"
  target_key_id = aws_kms_key.tf_enc.key_id
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "corp-acct-xyz-terraform-state"
  
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sse" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tf_enc.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locking"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}`
  },
  {
    time: "60 mins",
    title: "4. Deployment Patterns - Blue/Green & Canary Analysis",
    concept: [
      "In massive enterprise systems, overriding existing servers directly via rolling deployments carries a severe risk: If the new code contains an obscure crash-loop defect, 100% of the customer base will encounter downtime before a rollback can realistically complete.",
      "To circumvent this, we use **Blue/Green Deployments**. The entire new infrastructure stack (Green) is provisioned entirely alongside the existing active production one (Blue). Traffic routing logic (such as AWS Route53 or an ALB Target Group) is then flicked instantaneously from Blue to Green. Rollbacks are equally instantaneous.",
      "An even more robust methodology is **Canary Deployments**. You gradually bleed a tiny percent of traffic (e.g., 5%) to the new build. You monitor the Golden Signals (Latency, Traffic, Errors, Saturation). If the error rate for the 5% spikes compared to the mainline stack, the deploy is aborted safely, affecting only a fraction of users.",
      "The best implementations combine this with **Automated Canary Analysis (ACA)** logic. Rather than humans watching a dashboard, a service runs statistical tests (e.g., Mann-Whitney U test) comparing the 5% nodes to the 95% nodes, orchestrating fully autonomous release and rollback."
    ],
    code: `// Example: AWS Application Load Balancer Target Group Weights for Canary
resource "aws_lb_listener_rule" "canary_routing" {
  listener_arn = aws_lb_listener.front_end.arn
  priority     = 100

  action {
    type = "forward"
    forward {
      target_group {
        arn    = aws_lb_target_group.blue_tg.arn
        weight = 90
      }
      target_group {
        arn    = aws_lb_target_group.green_canary_tg.arn
        weight = 10
      }
      stickiness {
        enabled  = true
        duration = 28800
      }
    }
  }

  condition {
    path_pattern {
      values = ["/api/v2/*"]
    }
  }
}`,
    practice: "If shifting percentage traffic isn't natively supported by your very rudimentary ingress infrastructure, how can you accomplish a 'synthetic canary' using request headers?",
    solution: `// You can route traffic based on HTTP Headers rather than relying solely on random percentage spreading.
// This is called an "Opt-In" or "Header-Based" Canary. Developers or QA append a specific header to their requests to securely test the Green stack while public external users remain safely isolated in the Blue stack.

resource "aws_lb_listener_rule" "header_canary" {
  listener_arn = aws_lb_listener.front_end.arn
  priority     = 50 # higher priority rule

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green_canary_tg.arn
  }

  # Only traffic possessing this secret header is routed to the new code
  condition {
    http_header {
      http_header_name = "X-Feature-Opt-In"
      values           = ["green-release-v2"]
    }
  }
}`
  },
  {
    time: "90 mins",
    title: "5. Elastic Kubernetes Service (EKS) - Architecture & Deep Dive",
    concept: [
      "The cloud's compute abstraction of choice is Kubernetes (K8s). AWS offers Kubernetes via **EKS (Elastic Kubernetes Service)**.",
      "Kubernetes operates on a declarative control plane logic. You do not command 'start container X'; you declare 'ensure 3 replicas of state X are running'. The internal reconciliation loops constantly read state and issue actuation commands to make reality match the declaration.",
      "EKS fully abstracts the Kubernetes Control Plane (API Server, etcd, Scheduler, Controller Manager) across three Availability Zones. The tenant only interacts with the API Server endpoint via \`kubectl\`.",
      "The Worker Nodes form the Data Plane, physically running the Docker/containerd workloads inside nested abstraction layers: Node -> Pod -> Container.",
      "**VPC CNI (Container Network Interface):** EKS uniquely uses the AWS VPC CNI, which natively applies real AWS ENIs and IPs straight to the Pods. This allows Pods to route globally out to regular AWS resources without complex overlay networking translations (like Flannel or Calico IP-in-IP tunnels), maximizing networking efficiency."
    ],
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processing-service
  namespace: banking-core
  labels:
    app: payment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment
  template:
    metadata:
      labels:
        app: payment
    spec:
      containers:
      - name: spring-boot-app
        image: 0123456789.dkr.ecr.us-east-1.amazonaws.com/payment:v1.2.4
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        # Enterprise Grade Probes to prevent traffic to dead states
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 45
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 5`,
    practice: "How do you ensure enterprise workloads securely gain access to AWS internal Services (Like S3 or SQS) without embedding raw IAM long-lived Access Keys into the Pod containers?",
    solution: `// Use IAM Roles for Service Accounts (IRSA).
// IRSA binds a Kubernetes Service Account to an AWS IAM Role via an AWS OpenID Connect (OIDC) provider.
// EKS automatically injects a short-lived rotational AWS Web Identity Token into the Pod volume, which the AWS SDK automatically parses.

// 1. Give the K8s Service Account the IAM mapping annotation
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-processor-sa
  namespace: core
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/s3-processor-iam-role

---
// 2. Map your pod to securely inherit that Service Account
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      serviceAccountName: s3-processor-sa
      containers:
      - name: app
        image: my-app-img:1.0`
  },
  {
    time: "75 mins",
    title: "6. Autoscaling AWS EKS Compute with Karpenter",
    concept: [
      "Traditional Cluster Autoscaler relied on tightly coupling EC2 Auto Scaling Groups (ASGs). It forced you to provision dozens of pre-configured Node Groups to match specific instance sizes and traits, resulting in intense overhead, bin-packing inefficiencies, and slow scaling times (minutes).",
      "**Karpenter** is a modern, radical re-architecture built inherently for AWS. Instead of leaning on ASGs, Karpenter talks directly to the AWS EC2 Fleet API.",
      "When a Pod cannot schedule due to lack of resources, Karpenter instantly computes the exact EC2 Instance lifecycle requirement, provisions the appropriately sized node immediately (often in less than 30 seconds), and immediately attaches it to the cluster.",
      "This unlocks extreme cost optimizations via **Spot Instance** utilization. Karpenter can safely harness heavily discounted excess compute, and mathematically calculates the exact instance type necessary to fit unscheduled pods with minimal waste.",
      "Additionally, Karpenter consolidates. If it detects under-utilized nodes late at night, it will actively cordon, drain, and collapse pods to cheaper instances entirely to save on runtime idle costs."
    ],
    code: `# Karpenter NodePool definition
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"] # Polyglot architecture
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"] # Let Karpenter optimize price
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
      nodeClassRef:
        name: default
  # Optimization handling
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h # Automatically recycle nodes every 30 days for compliance

---
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2
  role: "KarpenterNodeRole-cluster-name"
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "cluster-name"
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "cluster-name"`,
    practice: "Karpenter creates an unpredictable layout of ephemeral instance shapes. If your database needs to only land on stable, memory-optimized hardware, how do you handle scheduling constraints?",
    solution: `// Use Taints, Tolerations, and NodeAffinity mapping directly onto the NodePool.
// You create a separate NodePool specifically for Databases enforcing "on-demand" capacity and "r" series memory types.

// NodePool Segment
  requirements:
    - key: karpenter.sh/capacity-type
      operator: In
      values: ["on-demand"] # Force stability
    - key: karpenter.k8s.aws/instance-family
      operator: In
      values: ["r6i", "r7i"] # Memory intensive
  taints:
    - key: workload-tier
      value: database
      effect: NoSchedule

// Pod Segment (Inside Deployment)
  tolerations:
    - key: "workload-tier"
      operator: "Equal"
      value: "database"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: karpenter.sh/capacity-type
            operator: In
            values:
            - on-demand`
  },
  {
    time: "90 mins",
    title: "7. Declarative GitOps Integrations (ArgoCD)",
    concept: [
      "Imperative deployments using \`kubectl apply -f\` inside a Jenkins pipeline represent an anti-pattern. If someone manually manipulates the cluster via the CLI, the CI system is entirely unaware — causing huge architectural **Drift**.",
      "**GitOps** introduces a paradigm shift: The Git repository is the absolute, single source of truth for the system's desired state. Nothing pushes to the cluster. Instead, a local software agent runs *inside* the cluster, constantly polling Git.",
      "Enterprise standard **ArgoCD** operates entirely on a 'Pull' mechanism. It pulls YAML configurations or Helm Charts from Git, compares the declared state against the live state inside Kubernetes, and initiates immediate synchronization to reconcile deviations.",
      "If a rogue admin manually deletes an active Pod, ArgoCD recognizes the live state no longer matches Git and instantaneously spins it back up without human intervention. Drift is mathematically destroyed.",
      "This mechanism empowers massive multi-cluster coordination. Pushing a version bump to a single main repository orchestrates ArgoCD to securely ripple update configurations across DEV, QA, and PROD clusters universally."
    ],
    code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: microservice-checkout
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/enterprise/payment-manifests.git'
    targetRevision: HEAD
    path: k8s/checkout-service
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: checkout-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - validate=false`,
    practice: "How does GitOps scale to support 15 distinct environments using the exact same underlying templates but with uniquely injected environment variables?",
    solution: `// Instead of maintaining 15 unique duplicate YAML files, use Kustomize or Helm merged inside ArgoCD.
// Use 'Kustomize' overlays. The base resources exist centrally, and ArgoCD points to the environment overlays.

// base/deployment.yaml
// - Base image and container structure

// overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: prod-
patchesStrategicMerge:
  - replica_count.yaml

// overlays/qa/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: qa-
patchesStrategicMerge:
  - qa_db_connection.yaml

// Inside ArgoCD, point the source path precisely at: path: overlays/prod`
  },
  {
    time: "60 mins",
    title: "8. SecGov & Secrets Operations - Shifting Left",
    concept: [
      "Managing credentials, API tokens, and TLS certificates securely at scale is an inherent DevOps challenge. Hardcoding secrets in source control or Git is a massive violation of compliance policies (PCI/SOC2/HIPAA).",
      "GitOps presents a challenge: if Git reflects true state, how do we deploy a secret? We absolutely cannot commit base64 encoded \`Secret\` resources to Git because base64 is not encryption.",
      "Instead, we leverage **External Secrets Operators (ESO)**. The Git manifest declares an *ExternalSecret* template defining the metadata of a secret location, but the ciphertext is secured deep inside AWS Secrets Manager or HashiCorp Vault.",
      "The ESO intercepts the instruction, securely queries the AWS Systems Manager parameter store via IRSA credentials, and generates the live underlying \`Secret\` dynamically *inside* the cluster RAM, fully obfuscating the secure data from Git histories entirely.",
      "This philosophy relies on **Shifting Left** — identifying and mitigating security and policy vulnerabilities as early in the pipeline as possible. Static code analyzers, dynamic vulnerability container scanners (Trivy), and automated OPA (Open Policy Agent) gatekeeping run within the CI before code even encounters staging."
    ],
    code: `apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretsmanager
  namespace: app-backend
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: secret-reader-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: app-backend
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: db-credentials-secret-k8s
    creationPolicy: Owner
  data:
    - secretKey: POSTGRES_PASSWORD
      remoteRef:
        key: prod/db/credentials
        property: password`,
    practice: "If you shift security left, how can you strictly prevent developers from inadvertently provisioning AWS S3 buckets via Terraform that allow public read access?",
    solution: `// Use Open Policy Agent (OPA) with tools like Conftest or Checkov directly inside the CI/CD Pipeline.
// OPA uses Rego logic to interrogate the Terraform plan schema before the 'terraform apply' is authorized.

// policy/s3_security.rego
package terraform.policies.s3

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket_public_access_block"
    
    # Check if they set block_public_acls to false
    resource.change.after.block_public_acls == false
    
    msg := sprintf("CRITICAL: S3 Public Access is strictly forbidden. Please rectify bucket: %v", [resource.name])
}

// In CI Pipeline execution:
// $ terraform plan -out=plan.binary
// $ terraform show -json plan.binary > plan.json
// $ conftest test plan.json -p policy/s3_security.rego
// The pipeline throws a non-zero exit code, breaking the build immediately if the Rego evaluation succeeds.`
  },
  {
    time: "2 Hours",
    title: "9. E2E Enterprise Project - Part 1 (Terraform IaC)",
    concept: [
      "To coalesce these concepts, we must execute an end-to-end Enterprise AWS deployment sequence purely via Terraform code, adhering to the principles of decoupled remote state, modules, and explicit infrastructure definitions.",
      "The objective in Part 1 is structural provisioning involving VPCs, networking, high-availability EKS cluster configuration, OIDC bindings, and precise IAM Role constraints required to support an orchestration platform.",
      "This represents the exact codebase constructed by Cloud Architects building foundational foundations for major enterprise application rollouts.",
      "Review the comprehensive Terraform schema spanning core integrations. Notice how we depend heavily on well-maintained structural abstractions rather than writing thousands of primitive lines."
    ],
    code: `// ==== 1. versions.tf ====
terraform {
  required_version = ">= 1.5.0"
  required_plugins {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

// ==== 2. networking.tf ====
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "enterprise-k8s-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false 
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true

  # CNI Tagging Requirements for AWS Load Balancers
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

// ==== 3. cluster.tf ====
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.16.0"

  cluster_name    = "enterprise-core-cluster"
  cluster_version = "1.28"

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    critical_system_services = {
      min_size     = 2
      max_size     = 4
      desired_size = 2
      
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        role = "platform-infrastructure"
      }
    }
    spot_compute_nodes = {
      min_size     = 1
      max_size     = 10
      desired_size = 3
      
      instance_types = ["m5.large", "m5a.large", "c5.large"]
      capacity_type  = "SPOT"
    }
  }

  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = "arn:aws:iam::123456789012:role/DeveloperAccess"
      username = "developer"
      groups   = ["system:masters"]
    }
  ]
}`,
    practice: "Examine the output. Once 'terraform apply' finishes and successfully builds the underlying EC2 node and EKS structural components, what command connects our local terminal entirely seamlessly into the fully authenticated API server?",
    solution: `// You must pull the kubeconfig credentials using the AWS CLI and assume the appropriate SSO IAM bindings logic.

aws eks update-kubeconfig \\
  --region us-east-1 \\
  --name enterprise-core-cluster

// You can now verify nodes are attached properly
kubectl get nodes -L topology.kubernetes.io/zone -L node.kubernetes.io/instance-type`
  },
  {
    time: "2 Hours",
    title: "10. E2E Enterprise Project - Part 2 (GitOps Bootstrapping)",
    concept: [
      "Infrastructure without workloads holds no business value. In Project Part 2, we execute the 'Day 2 Operations' bootstrapping pattern. We will use Terraform to configure the `helm` provider, actively dial into our newly terraformed EKS cluster, and autonomously inject the ArgoCD continuous delivery platform.",
      "Subsequently, we configure ArgoCD to instantly target our internal declarative Git project, creating a mathematically closed feedback loop.",
      "The instant Terraform finishes execution, ArgoCD breathes to life on the cluster, detects the raw application configurations resident in Git, and autonomously unspools dozens of decoupled microservices routing architecture dynamically over the newly provisioned capacity."
    ],
    code: `// ==== 4. gitops-bootstrap.tf ====
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}
data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

// Ensure isolated namespace
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
  }
}

// Deploy ArgoCD via Helm
resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "5.46.7"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  set {
    name  = "server.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "configs.params.server\\.insecure"
    value = "true" # Simplified TLS termination at ALB
  }
}

// Seed the Root ArgoCD Application via raw Kubernetes CRD
// This connects the cluster definitively to GitHub.
resource "kubernetes_manifest" "root_application" {
  depends_on = [helm_release.argocd]
  
  manifest = {
    "apiVersion" = "argoproj.io/v1alpha1"
    "kind"       = "Application"
    "metadata" = {
      "name"      = "enterprise-root-apps"
      "namespace" = "argocd"
    }
    "spec" = {
      "project" = "default"
      "source" = {
        "repoURL"        = "https://github.com/mycorp/gitops-monorepo.git"
        "targetRevision" = "HEAD"
        "path"           = "clusters/us-east-1-prod/apps"
      }
      "destination" = {
        "server"    = "https://kubernetes.default.svc"
        "namespace" = "argocd"
      }
      "syncPolicy" = {
        "automated" = {
          "prune"    = true
          "selfHeal" = true
        }
      }
    }
  }
}`,
    practice: "Now that ArgoCD is deployed as a LoadBalancer, how do we retrieve the initial admin password to log directly into the UI?",
    solution: `// ArgoCD auto-generates a secure randomized administrator password natively into a secret within the cluster at initial boot.

// Extract and decode it directly via kubectl:
kubectl -n argocd get secret argocd-initial-admin-secret \\
  -o jsonpath="{.data.password}" | base64 -d

// Extract LoadBalancer DNS
kubectl -n argocd get svc argocd-server -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"

// From here, log into the dashboard securely using 'admin' and the decoded password, and observe the system synchronizing deployments independently.`
  }
];
