export const migrationLessons = [
  {
    time: "Hour 1",
    title: "Migration Assessment & Strategy",
    concept: [
      "Before touching any infrastructure, assess what you're migrating. The **AWS Migration 6 R's** framework classifies every workload: **Rehost** (lift-and-shift), **Replatform** (lift-and-reshape), **Refactor** (re-architect for cloud-native), **Repurchase** (replace with SaaS), **Retire** (decommission), and **Retain** (keep on-prem). Most EKS migrations are Replatform or Refactor.",
      "**Discovery** means cataloging every application, its dependencies, network flows, storage needs, and current resource consumption. You need to know: what talks to what, what ports are open, what databases are connected, and what the peak load looks like. AWS Migration Hub and Application Discovery Service automate this.",
      "For EKS migration specifically, ask: is the app already containerized? If yes, you're replatforming. If it's a monolith on VMs, you'll need to **containerize first** — break it into Docker images, then orchestrate with Kubernetes. This is the hardest step and should happen before any cloud infra work.",
      "**Landing Zone first:** before migrating anything, your AWS account structure must be ready — networking (VPC, Transit Gateway to on-prem), IAM (roles, SSO), logging (CloudTrail, GuardDuty), and compliance baselines. This is what Terraform builds first.",
    ],
    code: `# migration_assessment.tf — Document your migration plan as code
# This creates the foundational tagging and tracking structure

locals {
  migration_waves = {
    wave1 = {
      apps = ["api-gateway", "auth-service"]
      strategy = "replatform"  # already containerized
      target   = "eks"
      timeline = "2026-Q2"
    }
    wave2 = {
      apps = ["order-service", "inventory-db"]
      strategy = "refactor"    # monolith -> microservices
      target   = "eks + aurora"
      timeline = "2026-Q3"
    }
  }

  common_tags = {
    Project     = "cloud-migration"
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}

# AWS Migration Hub tracking (optional but useful)
resource "aws_resourcegroups_group" "migration" {
  name = "migration-wave1"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [{
        Key    = "MigrationWave"
        Values = ["wave1"]
      }]
    })
  }
}`,
    practice: "Create a locals block that documents 3 applications with their migration strategy (rehost/replatform/refactor), target service, and timeline.",
    solution: `locals {
  migration_plan = {
    frontend = {
      strategy = "replatform"
      target   = "eks"
      current  = "nginx on VM"
      timeline = "2026-Q2"
    }
    api = {
      strategy = "refactor"
      target   = "eks"
      current  = "Java monolith on bare metal"
      timeline = "2026-Q3"
    }
    database = {
      strategy = "replatform"
      target   = "aurora-postgresql"
      current  = "PostgreSQL 14 on VM"
      timeline = "2026-Q2"
    }
  }
}`,
  },
  {
    time: "Hour 2",
    title: "Networking — Hybrid Connectivity",
    concept: [
      "Migration starts with **network connectivity** between on-prem and AWS. You need a pipe before you can move anything. The two options: **AWS Site-to-Site VPN** (encrypted tunnel over internet, quick to set up, variable latency) or **AWS Direct Connect** (dedicated fiber, consistent latency, higher cost, weeks to provision).",
      "**Transit Gateway** is the hub that connects your VPCs, VPN, and Direct Connect into a single routing domain. Instead of meshing VPC peering connections, everything routes through the TGW. In Terraform, you create the TGW, attach VPCs, and configure route tables.",
      "**DNS resolution** across hybrid environments requires Route 53 Resolver. Inbound endpoints let on-prem servers resolve AWS private DNS; outbound endpoints let AWS resolve on-prem DNS. Without this, your migrated apps can't find on-prem services by hostname during the cutover period.",
      "**CIDR planning** is critical — your on-prem network and AWS VPCs must not overlap. Plan your AWS CIDR blocks to avoid conflicts. Use `10.x.0.0/16` ranges that don't collide with existing `192.168.x.x` or `10.x.x.x` on-prem allocations.",
    ],
    code: `# hybrid_network.tf — VPN + Transit Gateway for hybrid connectivity

resource "aws_vpc" "main" {
  cidr_block           = "10.100.0.0/16"  # non-overlapping with on-prem
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "\${local.name_prefix}-vpc" }
}

# Transit Gateway — central hub
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Hybrid connectivity hub"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support                     = "enable"
  tags = { Name = "\${local.name_prefix}-tgw" }
}

# Attach VPC to Transit Gateway
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.main.id
  subnet_ids         = aws_subnet.private[*].id
  tags = { Name = "\${local.name_prefix}-tgw-attach" }
}

# Site-to-Site VPN
resource "aws_customer_gateway" "onprem" {
  bgp_asn    = 65000
  ip_address = var.onprem_vpn_ip    # your on-prem firewall public IP
  type       = "ipsec.1"
  tags = { Name = "\${local.name_prefix}-cgw" }
}

resource "aws_vpn_connection" "onprem" {
  customer_gateway_id = aws_customer_gateway.onprem.id
  transit_gateway_id  = aws_ec2_transit_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = true
  tags = { Name = "\${local.name_prefix}-vpn" }
}`,
    practice: "Create a Transit Gateway with a VPC attachment and a Site-to-Site VPN connection to an on-prem customer gateway.",
    solution: `resource "aws_ec2_transit_gateway" "hub" {
  description  = "migration-hub"
  dns_support  = "enable"
  tags = { Name = "migration-tgw" }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "app" {
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  vpc_id             = aws_vpc.main.id
  subnet_ids         = aws_subnet.private[*].id
}

resource "aws_customer_gateway" "dc" {
  bgp_asn    = 65000
  ip_address = "203.0.113.10"
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "dc" {
  customer_gateway_id = aws_customer_gateway.dc.id
  transit_gateway_id  = aws_ec2_transit_gateway.hub.id
  type                = "ipsec.1"
}`,
  },
  {
    time: "Hour 3",
    title: "EKS Cluster with Terraform",
    concept: [
      "**Amazon EKS** is managed Kubernetes — AWS runs the control plane (API server, etcd, scheduler) and you manage the worker nodes. In Terraform, the `aws_eks_cluster` resource creates the control plane, and **managed node groups** (`aws_eks_node_group`) create the EC2 workers.",
      "The EKS cluster needs a **VPC with at least 2 subnets in different AZs**. The control plane gets an IAM role with `AmazonEKSClusterPolicy`; node groups get a separate role with `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`.",
      "**Node group sizing** depends on your workloads. Start with `t3.large` for general workloads. Use **labels and taints** to schedule specific workloads on specific node groups — e.g., GPU nodes for ML, high-memory nodes for databases, spot instances for batch jobs.",
      "**Add-ons** are critical: `vpc-cni` (networking), `coredns` (DNS), `kube-proxy` (service routing), and optionally `aws-ebs-csi-driver` (persistent volumes). Terraform manages these via `aws_eks_addon` resources.",
    ],
    code: `# eks.tf — EKS cluster with managed node group

resource "aws_eks_cluster" "main" {
  name     = "\${local.name_prefix}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.29"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true  # restrict in prod
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
}

# Managed node group
resource "aws_eks_node_group" "workers" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "\${local.name_prefix}-workers"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.node_desired
    max_size     = var.node_max
    min_size     = var.node_min
  }

  instance_types = [var.node_instance_type]
  capacity_type  = "ON_DEMAND"

  labels = {
    role = "worker"
    env  = var.environment
  }

  tags = { Name = "\${local.name_prefix}-node" }
}

# Critical add-ons
resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  service_account_role_arn = aws_iam_role.ebs_csi.arn
}`,
    practice: "Create an EKS cluster with a managed node group of 2-5 t3.large instances across 2 private subnets. Enable API and audit logging.",
    solution: `resource "aws_eks_cluster" "practice" {
  name     = "migration-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.29"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
  }

  enabled_cluster_log_types = ["api", "audit"]
}

resource "aws_eks_node_group" "workers" {
  cluster_name    = aws_eks_cluster.practice.name
  node_group_name = "workers"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["t3.large"]

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 5
  }
}`,
  },
  {
    time: "Hour 4",
    title: "IAM Roles for Service Accounts (IRSA)",
    concept: [
      "**IRSA (IAM Roles for Service Accounts)** is EKS's solution for granting AWS permissions to individual pods. Instead of giving all pods on a node the same permissions via the node IAM role, each Kubernetes service account maps to its own IAM role with scoped permissions.",
      "The mechanism uses **OIDC federation**. EKS exposes an OIDC provider; you create an IAM role that trusts that provider with a condition restricting access to a specific Kubernetes namespace and service account. The pod assumes this role via a projected token volume.",
      "This is **critical for migration**: your on-prem apps probably use config files or env vars for credentials. On EKS, you replace that with IRSA — the app code uses the AWS SDK, which automatically picks up the projected credentials. No secrets to manage, no credentials to rotate.",
      "Common IRSA use cases in migration: app pods reading from S3, writing to SQS, accessing Secrets Manager, connecting to RDS via IAM authentication, or pushing metrics to CloudWatch.",
    ],
    code: `# irsa.tf — IAM Roles for Service Accounts

# OIDC provider for the EKS cluster
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# IAM role for a specific app's service account
locals {
  oidc_id = replace(aws_iam_openid_connect_provider.eks.url, "https://", "")
}

data "aws_iam_policy_document" "app_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "\${local.oidc_id}:sub"
      values   = ["system:serviceaccount:app:api-service"]
    }
  }
}

resource "aws_iam_role" "app_pod" {
  name               = "\${local.name_prefix}-app-pod-role"
  assume_role_policy = data.aws_iam_policy_document.app_assume.json
}

# Grant the app access to S3 and Secrets Manager
resource "aws_iam_role_policy_attachment" "app_s3" {
  role       = aws_iam_role.app_pod.name
  policy_arn = aws_iam_policy.app_s3_access.arn
}

# Kubernetes service account annotation (via kubectl or Helm)
# apiVersion: v1
# kind: ServiceAccount
# metadata:
#   name: api-service
#   namespace: app
#   annotations:
#     eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/app-pod-role`,
    practice: "Create an OIDC provider for your EKS cluster and an IRSA role scoped to a service account called 'order-service' in the 'production' namespace.",
    solution: `data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

locals {
  oidc_id = replace(
    aws_iam_openid_connect_provider.eks.url, "https://", ""
  )
}

data "aws_iam_policy_document" "order_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "\${local.oidc_id}:sub"
      values   = ["system:serviceaccount:production:order-service"]
    }
  }
}

resource "aws_iam_role" "order_pod" {
  name               = "order-service-irsa"
  assume_role_policy = data.aws_iam_policy_document.order_assume.json
}`,
  },
  {
    time: "Hour 5",
    title: "Containerizing & Deploying to ECR",
    concept: [
      "**Containerization** is the bridge between on-prem and EKS. Every application must be packaged as a Docker image. Start with a `Dockerfile`: choose a base image (e.g., `node:20-alpine`, `python:3.12-slim`), copy code, install dependencies, expose ports, and define the entrypoint.",
      "**Multi-stage builds** keep images small and secure. The first stage compiles/builds; the second stage copies only the built artifacts into a minimal runtime image. A Java app can go from 800MB to 150MB this way. Smaller images = faster pulls = faster deployments = smaller attack surface.",
      "**Amazon ECR** (Elastic Container Registry) is the AWS-native Docker registry. Terraform creates the repository; your CI pipeline pushes images. Enable **image scanning** to catch vulnerabilities, and set a **lifecycle policy** to auto-expire old tags so you don't pay for storage forever.",
      "**Migration pattern**: build the Docker image locally → test it → push to ECR → deploy a Kubernetes manifest that references the ECR image. The EKS nodes pull from ECR using the node IAM role (which already has `AmazonEC2ContainerRegistryReadOnly`).",
    ],
    code: `# ecr.tf — Container registry with security best practices
resource "aws_ecr_repository" "app" {
  name                 = "\${local.name_prefix}/api-service"
  image_tag_mutability = "IMMUTABLE"  # prevent tag overwrites

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = local.common_tags
}

# Auto-expire untagged images after 14 days
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = { type = "expire" }
    }]
  })
}

# Output the repo URL for CI/CD
output "ecr_repo_url" {
  value = aws_ecr_repository.app.repository_url
}

# --- Example Dockerfile (multi-stage) ---
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --production=false
# COPY . .
# RUN npm run build
#
# FROM node:20-alpine
# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# EXPOSE 8080
# CMD ["node", "dist/server.js"]`,
    practice: "Create an ECR repository with immutable tags, scan-on-push, and a lifecycle policy that keeps only the last 10 tagged images.",
    solution: `resource "aws_ecr_repository" "api" {
  name                 = "myapp/api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 tagged images"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["v"]
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = { type = "expire" }
    }]
  })
}`,
  },
  {
    time: "Hour 6",
    title: "Data Migration — RDS, S3 & Secrets",
    concept: [
      "**Database migration** is the riskiest part. AWS Database Migration Service (DMS) handles ongoing replication from on-prem databases (PostgreSQL, MySQL, Oracle, SQL Server) to **Amazon RDS** or **Aurora**. Terraform provisions the DMS replication instance, source/target endpoints, and tasks.",
      "The migration pattern: provision Aurora with Terraform → set up DMS for continuous replication → let it sync → verify data parity → cutover the application to point at Aurora → decommission the DMS task. During cutover, there's a brief write freeze.",
      "**File/object storage migration**: on-prem NFS or file shares map to **S3** in AWS. Use `aws s3 sync` or **AWS DataSync** for large datasets. Terraform creates the S3 buckets with encryption, versioning, and lifecycle policies. Apps on EKS access S3 via IRSA roles.",
      "**Secrets migration**: on-prem apps use config files or vaults. On AWS, move secrets to **AWS Secrets Manager** or **SSM Parameter Store**. Terraform provisions the secrets; pods access them via IRSA + the AWS SDK, or via the **External Secrets Operator** which syncs AWS secrets into Kubernetes Secrets.",
    ],
    code: `# data_migration.tf — RDS Aurora + Secrets Manager

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "\${local.name_prefix}-aurora"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  database_name          = "appdb"
  master_username        = "admin"
  master_password        = aws_secretsmanager_secret_version.db.secret_string
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  storage_encrypted      = true
  skip_final_snapshot    = var.environment != "prod"

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "main" {
  count              = var.environment == "prod" ? 2 : 1
  identifier         = "\${local.name_prefix}-aurora-\${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.main.engine
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db" {
  name = "\${local.name_prefix}/db-credentials"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db.result
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = "appdb"
  })
}

resource "random_password" "db" {
  length  = 32
  special = false
}

# S3 for migrated file storage
resource "aws_s3_bucket" "data" {
  bucket = "\${local.name_prefix}-app-data"
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}`,
    practice: "Create an Aurora PostgreSQL cluster with 2 instances, a Secrets Manager secret for the DB credentials, and an encrypted S3 bucket for file storage.",
    solution: `resource "aws_rds_cluster" "db" {
  cluster_identifier = "app-aurora"
  engine             = "aurora-postgresql"
  engine_version     = "15.4"
  database_name      = "appdb"
  master_username    = "admin"
  master_password    = random_password.db.result
  storage_encrypted  = true
}

resource "aws_rds_cluster_instance" "db" {
  count              = 2
  identifier         = "app-aurora-\${count.index}"
  cluster_identifier = aws_rds_cluster.db.id
  instance_class     = "db.r6g.large"
  engine             = "aurora-postgresql"
}

resource "random_password" "db" {
  length = 32
  special = false
}

resource "aws_secretsmanager_secret" "db" {
  name = "app/db-credentials"
}

resource "aws_s3_bucket" "files" {
  bucket = "app-migrated-files"
}`,
  },
  {
    time: "Hour 7",
    title: "Kubernetes Manifests & Ingress",
    concept: [
      "With the EKS cluster running and images in ECR, you deploy apps via **Kubernetes manifests**. A `Deployment` runs your pods with a replica count; a `Service` gives them a stable internal DNS name; an `Ingress` exposes them externally via a load balancer.",
      "On EKS, the **AWS Load Balancer Controller** is the standard ingress solution. It provisions ALBs for `Ingress` resources and NLBs for `Service type: LoadBalancer`. Install it via Helm, and it uses IRSA to manage ALBs. Terraform can manage Helm releases via the `helm_release` resource.",
      "**Kubernetes namespaces** map well to migration waves or environments. Namespace `wave1` runs the first migrated services; `wave2` the next batch. Each namespace gets its own IRSA roles, resource quotas, and network policies.",
      "**ConfigMaps and Secrets** replace on-prem config files. Map environment-specific values (DB host, feature flags, API URLs) into ConfigMaps. For sensitive data, use the **External Secrets Operator** to sync from AWS Secrets Manager into Kubernetes Secrets automatically.",
    ],
    code: `# k8s_infra.tf — ALB Controller + Helm deployment

# AWS Load Balancer Controller via Helm
resource "helm_release" "aws_lb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.7.1"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.lb_controller.arn
  }
}

# External Secrets Operator
resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = "external-secrets"
  create_namespace = true
}

# --- Example Kubernetes manifests (kubectl apply) ---
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: api-service
#   namespace: app
# spec:
#   replicas: 3
#   selector:
#     matchLabels: { app: api-service }
#   template:
#     metadata:
#       labels: { app: api-service }
#     spec:
#       serviceAccountName: api-service  # IRSA-annotated
#       containers:
#       - name: api
#         image: 123456789.dkr.ecr.us-east-1.amazonaws.com/app/api:v1.2.0
#         ports: [{ containerPort: 8080 }]
#         envFrom:
#         - configMapRef: { name: api-config }
# ---
# apiVersion: networking.k8s.io/v1
# kind: Ingress
# metadata:
#   name: api-ingress
#   annotations:
#     alb.ingress.kubernetes.io/scheme: internet-facing
#     alb.ingress.kubernetes.io/target-type: ip
# spec:
#   ingressClassName: alb
#   rules:
#   - host: api.example.com
#     http:
#       paths:
#       - path: /
#         pathType: Prefix
#         backend:
#           service: { name: api-service, port: { number: 8080 } }`,
    practice: "Write a Helm release resource for the AWS Load Balancer Controller and sketch a Kubernetes Deployment + Ingress manifest for a migrated API service.",
    solution: `resource "helm_release" "lb" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }
}

# Then apply via kubectl:
# kubectl create namespace app
# kubectl apply -f deployment.yaml
# kubectl apply -f ingress.yaml`,
  },
  {
    time: "Hour 8",
    title: "Cutover, Monitoring & Rollback",
    concept: [
      "**Cutover** is the moment you switch production traffic from on-prem to EKS. The safest pattern is **blue-green via DNS**: keep both environments running, use Route 53 weighted routing to shift traffic gradually (10% → 50% → 100%). If something breaks, flip DNS back in seconds.",
      "**Monitoring on Day 1** is non-negotiable. Deploy the **CloudWatch Container Insights** agent for cluster-level metrics, **Fluent Bit** as a DaemonSet for log forwarding to CloudWatch Logs, and **Prometheus + Grafana** for detailed Kubernetes metrics. Terraform provisions the log groups and IAM roles; Helm installs the monitoring stack.",
      "**Health checks** must be configured on every workload: Kubernetes **liveness probes** (restart unhealthy pods), **readiness probes** (stop routing traffic to unready pods), and ALB **target group health checks**. These are your safety net during and after migration.",
      "**Rollback plan** must be documented and tested before cutover. If EKS workloads fail: revert DNS to on-prem, DMS keeps syncing data back, and you lose nothing. The on-prem environment stays warm for 2-4 weeks post-migration as insurance.",
    ],
    code: `# monitoring.tf — CloudWatch + Fluent Bit for EKS

resource "aws_cloudwatch_log_group" "eks_app" {
  name              = "/eks/\${local.name_prefix}/app"
  retention_in_days = 30
  tags              = local.common_tags
}

# Fluent Bit for log forwarding
resource "helm_release" "fluent_bit" {
  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = "logging"
  create_namespace = true

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.fluent_bit.arn
  }
}

# Route 53 weighted routing for blue-green cutover
resource "aws_route53_record" "api_blue_green" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.eks_alb.dns_name
    zone_id                = aws_lb.eks_alb.zone_id
    evaluate_target_health = true
  }

  weighted_routing_policy {
    weight = var.eks_traffic_weight  # start at 10, ramp to 100
  }

  set_identifier = "eks"
}

# CloudWatch alarms for post-migration monitoring
resource "aws_cloudwatch_metric_alarm" "high_5xx" {
  alarm_name          = "\${local.name_prefix}-high-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.eks_alb.arn_suffix
  }
}`,
    practice: "Create a Route 53 weighted record for blue-green cutover and a CloudWatch alarm that fires when 5xx errors exceed 50 in 5 minutes.",
    solution: `resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = true
  }

  weighted_routing_policy { weight = 10 }
  set_identifier = "eks"
}

resource "aws_cloudwatch_metric_alarm" "errors" {
  alarm_name          = "high-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_actions       = [aws_sns_topic.alerts.arn]
}`,
  },
  {
    time: "Homework Project",
    title: "Migrate a Docker Compose App to EKS End-to-End",
    concept: [
      "**Project Goal**: take a sample 3-tier application (React frontend, Node.js API, PostgreSQL) currently running on a single server with Docker Compose, and migrate it to a high-availability architecture on AWS EKS and Aurora PostgreSQL. You will write the Dockerfiles, the Terraform infrastructure, and the Kubernetes manifests required for a zero-downtime cutover.",
      "**Step 1 — Understand the starting point.** Create a folder `onprem/` with a `docker-compose.yml`. It defines three services: `frontend` (port 3000), `api` (port 8080), and `postgres` (port 5432). The frontend talks to the API via `http://api:8080`, and the API connects to Postgres using credentials stored in environment variables (`DB_HOST`, `DB_USER`). Run `docker-compose up` locally to verify the app works. Your goal is to replicate and scale this topology in AWS without changing the application code.",
      "**Step 2 — Write Multi-Stage Dockerfiles.** To deploy to EKS, we need optimized container images. Create `frontend/Dockerfile`: use `node:18` to run `npm install && npm run build`, then copy the static assets into an `nginx:alpine` image. This reduces a 1GB image to 20MB. Create `api/Dockerfile`: use `node:18-alpine`, copy only `package.json`, install production dependencies, then copy the source code. Tag both images as `v1.0.0`.",
      "**Step 3 — Provision AWS Infrastructure with Terraform.** Create an `infra/` folder. Use the official AWS Terraform modules to build the foundation: a VPC across 3 Availability Zones with public and private subnets. Create an EKS cluster (`cluster_version = '1.29'`) running on managed node groups in the private subnets. Create an Aurora PostgreSQL serverless cluster, also in the private subnets. Create two ECR repositories for your frontend and API images. Run `terraform apply` (this takes about 20 minutes to provision).",
      "**Step 4 — Push Images to Amazon ECR.** Log your Docker CLI into AWS ECR: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com`. Tag your local images to match the ECR repository URLs, and run `docker push` for both the frontend and API. Your code is now in AWS.",
      "**Step 5 — Configure Kubernetes Access and Helm Basics.** Update your local kubeconfig to point to the new cluster: `aws eks update-kubeconfig --region us-east-1 --name <cluster_name>`. Verify access with `kubectl get nodes`. EKS doesn't come with an ingress controller by default. Use Helm to install the **AWS Load Balancer Controller**, which watches for Ingress resources in your cluster and automatically provisions Application Load Balancers (ALBs) in your VPC.",
      "**Step 6 — Write Kubernetes Deployments and Services.** Create `k8s/api.yaml`. Write a Deployment for the API with `replicas: 3`. For the `DB_HOST` environment variable, use the Aurora writer endpoint output by Terraform. For passwords, do not hardcode them! Install the External Secrets Operator and map the AWS Secrets Manager database password into a Kubernetes Secret. Write a Service of type `ClusterIP` on port 8080. Repeat this process for the frontend (replicas: 3, port 80).",
      "**Step 7 — Expose the App via Ingress.** Create `k8s/ingress.yaml`. Define an Ingress resource with annotations for the ALB controller: `alb.ingress.kubernetes.io/scheme: internet-facing` and `alb.ingress.kubernetes.io/target-type: ip`. Route requests for `/api/*` to the API service, and requests for `/*` to the frontend service. Apply the manifests with `kubectl apply -f k8s/`. Wait a couple of minutes, then run `kubectl get ingress` to see the DNS name of the newly provisioned ALB.",
      "**Step 8 — Data Migration.** Your cloud app is running but the database is empty. Stop writes on the on-premise application. Take a logical dump of the local PostgreSQL database using `pg_dump`. Restore it directly to the Aurora cluster using `psql -h <aurora_endpoint>`, connecting from a bastion host or via AWS Systems Manager Session Manager.",
      "**Step 9 — The Cutover Strategy.** Your AWS EKS migration is fully tested via the ALB DNS name. To switch real users over with zero downtime, update your Route 53 DNS record for your domain (e.g., `app.company.com`). Change it from a simple A record pointing to your on-prem server to a **Weighted Routing** policy. Start with 90% routing to on-prem and 10% to the EKS ALB. Monitor application logs and CloudWatch metrics. If healthy, increase EKS to 50%, then 100%. If errors spike, immediately roll back to 100% on-prem.",
    ],
    code: `# === STARTING POINT: docker-compose.yml (on-prem) ===
# services:
#   frontend:
#     build: ./frontend
#     ports: ["3000:3000"]
#     environment:
#       - API_URL=http://api:8080
#   api:
#     build: ./api
#     ports: ["8080:8080"]
#     environment:
#       - DB_HOST=postgres
#       - DB_PORT=5432
#       - DB_NAME=appdb
#       - DB_USER=admin
#       - DB_PASS=localdev
#   postgres:
#     image: postgres:15
#     environment:
#       - POSTGRES_DB=appdb
#       - POSTGRES_USER=admin
#       - POSTGRES_PASSWORD=localdev

# === STEP 2: Terraform (main.tf) ===
module "vpc" {
  source = "./modules/vpc"
  name   = "migration-demo"
  cidr   = "10.0.0.0/16"
  azs    = ["us-east-1a", "us-east-1b"]
}

module "eks" {
  source     = "./modules/eks"
  name       = "migration-demo"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

module "aurora" {
  source     = "./modules/aurora"
  name       = "migration-demo"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  app_sg_id  = module.eks.node_sg_id
}

resource "aws_ecr_repository" "frontend" {
  name                 = "migration-demo/frontend"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository" "api" {
  name                 = "migration-demo/api"
  image_tag_mutability = "IMMUTABLE"
}

# === STEP 3: Push to ECR ===
# aws ecr get-login-password --region us-east-1 | \\
#   docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
#
# docker build -t migration-demo/frontend:v1.0.0 ./frontend
# docker tag migration-demo/frontend:v1.0.0 <ECR_URL>/frontend:v1.0.0
# docker push <ECR_URL>/frontend:v1.0.0

# === STEP 4: Kubernetes manifests ===
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: api
#   namespace: migration
# spec:
#   replicas: 2
#   selector:
#     matchLabels: { app: api }
#   template:
#     spec:
#       serviceAccountName: api-sa
#       containers:
#       - name: api
#         image: <ECR_URL>/api:v1.0.0
#         ports: [{ containerPort: 8080 }]
#         env:
#         - name: DB_HOST
#           value: "<AURORA_WRITER_ENDPOINT>"
#         readinessProbe:
#           httpGet: { path: /health, port: 8080 }
# ---
# apiVersion: networking.k8s.io/v1
# kind: Ingress
# metadata:
#   name: app-ingress
#   annotations:
#     alb.ingress.kubernetes.io/scheme: internet-facing
#     alb.ingress.kubernetes.io/target-type: ip
# spec:
#   ingressClassName: alb
#   rules:
#   - host: app.example.com
#     http:
#       paths:
#       - path: /api
#         pathType: Prefix
#         backend: { service: { name: api, port: { number: 8080 } } }
#       - path: /
#         pathType: Prefix
#         backend: { service: { name: frontend, port: { number: 3000 } } }`,
    practice: "Take any Docker Compose app with at least 2 services and a database. Write the complete Terraform, Dockerfiles, and K8s manifests to migrate it to EKS. Deploy and verify all endpoints work.",
    solution: `# Complete migration checklist:
# 1. Verify docker-compose app works: docker-compose up
# 2. Write multi-stage Dockerfiles for each service
# 3. Create Terraform modules: vpc, eks, aurora, ecr
# 4. terraform init && terraform apply (20-30 min for EKS + Aurora)
# 5. aws eks update-kubeconfig --name migration-demo
# 6. Push all images to ECR
# 7. kubectl create namespace migration
# 8. Install ALB controller: helm install aws-load-balancer-controller ...
# 9. Install External Secrets Operator: helm install external-secrets ...
# 10. Apply K8s manifests: kubectl apply -f k8s/
# 11. Wait for ALB provisioning: kubectl get ingress -n migration -w
# 12. Test: curl https://app.example.com/api/health
# 13. Run data migration: pg_dump | psql aurora-endpoint
# 14. Set up Route 53 weighted: on-prem=90 / EKS=10
# 15. Monitor for 24h, gradually shift to 100% EKS
# 16. Decommission on-prem after 2 weeks of stable operation`,
  },
];
