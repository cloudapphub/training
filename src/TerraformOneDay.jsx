import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft } from "lucide-react";

const lessons = [
  {
    time: "Hour 1",
    title: "HCL Foundations & Provider Configuration",
    concept: [
      "Terraform uses **HashiCorp Configuration Language (HCL)** — a declarative language where you describe the desired end-state of your infrastructure, and Terraform figures out how to get there. You never write step-by-step instructions; you write a blueprint.",
      "Every Terraform project starts with a **provider block**. Providers are plugins that talk to cloud APIs. The AWS provider translates your HCL into AWS API calls. You pin the provider version to avoid surprise breaking changes, and you configure the region where resources will be created.",
      "The `terraform` block with `required_providers` is your dependency lock. Think of it like `package.json` for infrastructure — it ensures everyone on the team uses the same provider version. Run `terraform init` to download providers.",
      "**Backend configuration** tells Terraform where to store its state file. For team use on AWS, you store state in an **S3 bucket** with a **DynamoDB table** for state locking — this prevents two people from modifying infrastructure simultaneously.",
    ],
    code: `# versions.tf — pin your providers and backend
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"   # allow patch updates only
    }
  }

  backend "s3" {
    bucket         = "my-company-tf-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-state-lock"
    encrypt        = true
  }
}

# provider.tf — configure AWS
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "terraform"
      Environment = var.environment
      Project     = var.project_name
    }
  }
}`,
    practice: "Set up a Terraform project with an S3 backend and the AWS provider pinned to version ~> 5.40. Add default tags for Environment and ManagedBy.",
    solution: `# 1. Create the S3 bucket and DynamoDB table first (manually or via separate TF)
# 2. Then configure your project:

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
  backend "s3" {
    bucket         = "my-tf-state-bucket"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = { ManagedBy = "terraform", Environment = "dev" }
  }
}`,
  },
  {
    time: "Hour 2",
    title: "Variables, Outputs & Locals",
    concept: [
      "**Input variables** (`variable` blocks) are parameters that make your modules reusable. Every variable has a type, an optional default, and a description. Types include `string`, `number`, `bool`, `list(string)`, `map(string)`, and complex types like `object({...})`.",
      "**Validation blocks** inside variables let you enforce constraints at plan time — before any resources are created. This catches bad inputs early, like an invalid CIDR block or a disallowed instance type.",
      "**Local values** (`locals` block) are computed constants — they let you name intermediate expressions so you don't repeat logic. Common pattern: build a `name_prefix` local from project + environment, then reference it everywhere.",
      "**Outputs** expose values from your module to the caller or to the terminal. They're essential for module composition — one module outputs a VPC ID, another module takes it as input. Use `sensitive = true` for secrets.",
    ],
    code: `# variables.tf
variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for all resources"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

# locals.tf
locals {
  name_prefix = "\${var.project_name}-\${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the created VPC"
}

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}`,
    practice: "Create a variables.tf with a validated `environment` variable (only dev/staging/prod allowed) and a `vpc_cidr` variable with a default of 10.0.0.0/16. Add a local that builds a name prefix.",
    solution: `variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "project_name" {
  type    = string
  default = "myapp"
}

locals {
  name_prefix = "\${var.project_name}-\${var.environment}"
}`,
  },
  {
    time: "Hour 3",
    title: "Networking — VPC, Subnets & Gateways",
    concept: [
      "Every AWS deployment starts with a **VPC** (Virtual Private Cloud). Think of it as your private data center in the cloud. You define a CIDR block (e.g., `10.0.0.0/16`) that determines your IP address space — plan for growth but don't waste address space.",
      "**Public subnets** have a route to an Internet Gateway and auto-assign public IPs. **Private subnets** reach the internet through a **NAT Gateway** in a public subnet. Always spread subnets across multiple **Availability Zones** for high availability.",
      "The `cidrsubnet()` function is your best friend for carving a VPC CIDR into subnets without manual math. `cidrsubnet(\"10.0.0.0/16\", 8, 0)` produces `10.0.0.0/24`, index 1 gives `10.0.1.0/24`, etc.",
      "**Route tables** control where traffic goes. Public subnets route `0.0.0.0/0` to the IGW; private subnets route `0.0.0.0/0` to the NAT Gateway. Always explicitly associate subnets with route tables — don't rely on the default.",
    ],
    code: `# vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "\${local.name_prefix}-vpc" }
}

# Public subnets across AZs
resource "aws_subnet" "public" {
  count                   = length(var.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "\${local.name_prefix}-public-\${count.index}" }
}

# Private subnets
resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.azs[count.index]
  tags = { Name = "\${local.name_prefix}-private-\${count.index}" }
}

# Internet Gateway + NAT Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_eip" "nat" { domain = "vpc" }

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
}`,
    practice: "Build a VPC with 2 public subnets and 2 private subnets across us-east-1a and us-east-1b. Use cidrsubnet() for CIDR calculation.",
    solution: `variable "azs" {
  default = ["us-east-1a", "us-east-1b"]
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "practice-vpc" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "public-\${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index + 10)
  availability_zone = var.azs[count.index]
  tags = { Name = "private-\${count.index}" }
}`,
  },
  {
    time: "Hour 4",
    title: "Security Groups & IAM",
    concept: [
      "**Security groups** are stateful firewalls attached to resources. 'Stateful' means if you allow inbound traffic on port 443, the response traffic is automatically allowed out. Define the minimum required ports — never open `0.0.0.0/0` on SSH in production.",
      "Best practice: create **separate security groups** per concern (ALB, app, database) and reference them by ID in ingress rules. This creates a chain: ALB SG allows 443 from internet → App SG allows 8080 from ALB SG → DB SG allows 5432 from App SG.",
      "**IAM roles** are the AWS-native way to grant permissions to services. EC2 instances, ECS tasks, and Lambda functions assume roles — never embed access keys. Use `aws_iam_policy_document` data sources for type-safe policy JSON instead of raw heredoc strings.",
      "The **principle of least privilege**: grant only the permissions a service actually needs. Start with nothing, add permissions as the application requires them, and scope them to specific resource ARNs when possible.",
    ],
    code: `# Security group chain: ALB -> App -> DB
resource "aws_security_group" "alb" {
  name_prefix = "\${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name_prefix = "\${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # only from ALB
  }
}

# IAM role for ECS tasks
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task" {
  name               = "\${local.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}`,
    practice: "Create a security group for an RDS database that only allows port 5432 from an application security group. Create an IAM role for ECS tasks.",
    solution: `resource "aws_security_group" "db" {
  name_prefix = "myapp-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = { Name = "myapp-db-sg" }
}

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task" {
  name               = "myapp-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}`,
  },
  {
    time: "Hour 5",
    title: "Compute — EC2, ECS & Lambda",
    concept: [
      "**EC2** is the baseline compute service. In Terraform, an `aws_instance` needs an AMI, instance type, subnet, and security group. Use `aws_ami` data sources to dynamically look up the latest Amazon Linux or Ubuntu AMI instead of hardcoding IDs that change per region.",
      "**ECS (Elastic Container Service)** is the managed container orchestrator. The Terraform resources form a hierarchy: **Cluster** → **Service** → **Task Definition**. The task definition specifies the Docker image, CPU/memory, port mappings, and the IAM role the container assumes.",
      "**ECS Fargate** removes the need to manage EC2 instances for containers — you just specify CPU and memory, and AWS handles the rest. Use `FARGATE` as the launch type in your service and capacity provider in the cluster.",
      "**Lambda** is event-driven serverless compute. In Terraform you provide the deployment package (zip or container image), handler, runtime, memory, timeout, and an IAM execution role. Use `archive_file` data source to zip your code automatically during `terraform apply`.",
    ],
    code: `# ECS Fargate service — the most common AWS deployment pattern
resource "aws_ecs_cluster" "main" {
  name = "\${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "\${local.name_prefix}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "\${var.ecr_repo_url}:\${var.image_tag}"
    essential = true
    portMappings = [{ containerPort = 8080 }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "app"
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  name            = "\${local.name_prefix}-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }
}`,
    practice: "Create an ECS Fargate task definition for an Nginx container with 256 CPU units, 512MB memory, and CloudWatch logging.",
    solution: `resource "aws_ecs_task_definition" "nginx" {
  family                   = "nginx-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "nginx"
    image     = "nginx:latest"
    essential = true
    portMappings = [{ containerPort = 80 }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/nginx"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "nginx"
      }
    }
  }])
}`,
  },
  {
    time: "Hour 6",
    title: "State, Lifecycle & Data Sources",
    concept: [
      "**Terraform state** is the single source of truth that maps your HCL to real cloud resources. Every `terraform apply` reads state, computes a diff against your config, and applies only the changes. Corrupting or losing state means Terraform 'forgets' your resources — they still exist in AWS but are now unmanaged.",
      "**`terraform import`** brings existing AWS resources under Terraform management. You provide the resource address and the AWS resource ID, and Terraform records it in state. After importing, write the matching HCL config so future plans show no diff.",
      "**Lifecycle meta-arguments** control how Terraform handles changes. `prevent_destroy` blocks accidental deletion of databases. `create_before_destroy` ensures zero-downtime replacements. `ignore_changes` tells Terraform to ignore attributes modified outside of Terraform (like ASG desired count changed by auto-scaling).",
      "**Data sources** read existing infrastructure without managing it. `data \"aws_caller_identity\" \"current\"` gets your account ID, `data \"aws_region\" \"current\"` gets the region, and `data \"aws_vpc\" \"existing\"` can look up a VPC by tag. Use data sources to reference shared resources owned by other teams.",
    ],
    code: `# Data sources — read existing infrastructure
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_ssm_parameter" "db_password" {
  name = "/\${var.environment}/db/password"
}

# Lifecycle rules
resource "aws_db_instance" "main" {
  identifier     = "\${local.name_prefix}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 50
  db_name        = "appdb"
  username       = "admin"
  password       = data.aws_ssm_parameter.db_password.value

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = var.environment != "prod"

  lifecycle {
    prevent_destroy = true           # block accidental deletion
    ignore_changes  = [password]     # password managed externally
  }

  tags = { Name = "\${local.name_prefix}-db" }
}

# Import example:
# terraform import aws_db_instance.main my-existing-db-identifier`,
    practice: "Write a data source to look up the current AWS account ID, and an RDS instance with prevent_destroy and ignore_changes on the password.",
    solution: `data "aws_caller_identity" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

resource "aws_db_instance" "main" {
  identifier     = "myapp-db"
  engine         = "postgres"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  username       = "admin"
  password       = "initial-password"

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [password]
  }
}`,
  },
  {
    time: "Hour 7",
    title: "Modules & Project Structure",
    concept: [
      "**Modules** are Terraform's unit of reuse. A module is just a directory of `.tf` files with variables (inputs), resources (implementation), and outputs. You call a module with a `module` block, pass inputs, and read its outputs — exactly like calling a function.",
      "**Module sources** can be local paths (`./modules/vpc`), Git repos, the Terraform Registry, or S3. For company use, publish versioned modules to a private registry or Git tags. Always pin module versions in production.",
      "A clean **project structure** separates environments from module definitions. Common pattern: `modules/` holds reusable components (vpc, ecs, rds), and `environments/dev/`, `environments/prod/` call those modules with different variable values. Each environment has its own state file.",
      "**Module composition** is where the real power is. Your root module wires modules together: the VPC module outputs subnet IDs → the ECS module takes them as inputs → the ALB module takes the ECS security group as input. This creates a dependency graph Terraform resolves automatically.",
    ],
    code: `# Project structure:
# ├── modules/
# │   ├── vpc/        (main.tf, variables.tf, outputs.tf)
# │   ├── ecs/
# │   └── rds/
# ├── environments/
# │   ├── dev/        (main.tf, terraform.tfvars)
# │   └── prod/       (main.tf, terraform.tfvars)

# environments/dev/main.tf — compose modules
module "vpc" {
  source      = "../../modules/vpc"
  environment = "dev"
  vpc_cidr    = "10.0.0.0/16"
  azs         = ["us-east-1a", "us-east-1b"]
}

module "ecs" {
  source          = "../../modules/ecs"
  environment     = "dev"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  public_subnets  = module.vpc.public_subnet_ids
  image_tag       = var.image_tag
  desired_count   = 1           # dev only needs 1
}

module "rds" {
  source          = "../../modules/rds"
  environment     = "dev"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  app_sg_id       = module.ecs.app_security_group_id
  instance_class  = "db.t3.micro"  # smaller for dev
}

# environments/dev/terraform.tfvars
# environment = "dev"
# image_tag   = "latest"`,
    practice: "Create a module call that provisions a VPC module and passes its outputs to an ECS module. Use different tfvars for dev vs prod.",
    solution: `# environments/prod/main.tf
module "vpc" {
  source      = "../../modules/vpc"
  environment = "prod"
  vpc_cidr    = "10.1.0.0/16"
  azs         = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

module "ecs" {
  source          = "../../modules/ecs"
  environment     = "prod"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  public_subnets  = module.vpc.public_subnet_ids
  image_tag       = var.image_tag
  desired_count   = 3  # HA for prod
}

# environments/prod/terraform.tfvars
# environment = "prod"
# image_tag   = "v2.1.0"  # pinned version for prod`,
  },
  {
    time: "Hour 8",
    title: "CI/CD, Workspaces & Best Practices",
    concept: [
      "**CI/CD for Terraform** follows a standard pipeline: `terraform fmt -check` → `terraform validate` → `terraform plan -out=plan.tfplan` → manual approval → `terraform apply plan.tfplan`. Saving the plan ensures what you reviewed is exactly what gets applied.",
      "**Workspaces** are Terraform's built-in way to manage multiple environments with the same config. `terraform workspace new staging` creates an isolated state. Reference the workspace name with `terraform.workspace` to vary behavior. However, many teams prefer the separate-directory approach from Hour 7 for better isolation.",
      "**`tfsec`** and **`checkov`** scan your Terraform for security misconfigurations — unencrypted S3 buckets, public security groups, missing logging. Run them in CI before apply. **`terraform-docs`** auto-generates module documentation from your variable and output blocks.",
      "**Golden rules:** never apply without a saved plan, always run in CI (not from laptops), tag every resource, encrypt state at rest, use `prevent_destroy` on stateful resources, and review plans like you review code — because infrastructure changes are harder to undo.",
    ],
    code: `# .github/workflows/terraform.yml — GitHub Actions pipeline
name: Terraform
on:
  push:
    branches: [main]
  pull_request:

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Format check
        run: terraform fmt -check -recursive

      - name: Init
        run: terraform init
        working-directory: environments/dev

      - name: Validate
        run: terraform validate
        working-directory: environments/dev

      - name: Security scan
        uses: aquasecurity/tfsec-action@v1.0.0

      - name: Plan
        run: terraform plan -out=plan.tfplan
        working-directory: environments/dev

      - name: Apply (main branch only)
        if: github.ref == 'refs/heads/main'
        run: terraform apply plan.tfplan
        working-directory: environments/dev`,
    practice: "Write a GitHub Actions workflow that runs fmt, validate, tfsec, plan on PRs, and only applies on merge to main.",
    solution: `name: Terraform CI/CD
on:
  push: { branches: [main] }
  pull_request:

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: terraform init
      - run: terraform validate
      - uses: aquasecurity/tfsec-action@v1.0.0
      - run: terraform plan -out=tfplan

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan`,
  },
  {
    time: "Homework Project",
    title: "Deploy a Full-Stack App to AWS with Terraform",
    concept: [
      "**Project Goal**: you will build an end-to-end Terraform project that deploys a highly available web application to AWS. The final architecture will feature a VPC across two Availability Zones, a containerized application running on ECS Fargate, a PostgreSQL database on RDS, and an Application Load Balancer to route internet traffic to your containers.",
      "**Step 1 — Setup the Root Project and Remote State.** Create a new directory `aws-deploy`. Create `versions.tf` to lock the AWS provider version. Create `backend.tf` to configure S3 for state storage and DynamoDB for state locking (you can manually create these via the AWS Console first). This ensures your state file is securely stored in the cloud, not on your laptop.",
      "**Step 2 — Design the VPC Module.** Create `modules/vpc/`. Inside, use the `aws_vpc`, `aws_subnet`, `aws_internet_gateway`, and `aws_route_table` resources. You need two public subnets (for the Load Balancer) and two private subnets (for ECS and RDS). Do not hardcode CIDR blocks or availability zones; pass them in as variables from the root module.",
      "**Step 3 — Design the RDS Module.** Create `modules/rds/`. Use the `aws_db_instance` resource to deploy a PostgreSQL database. Place it in a `aws_db_subnet_group` tied to your private subnets. Create a Security Group (`aws_security_group`) that only allows port 5432 ingress from the ECS task's security group. Set `prevent_destroy = true` in the lifecycle block to protect the database.",
      "**Step 4 — Design the ECS Module.** Create `modules/ecs/`. Use `aws_ecs_cluster`. Define an `aws_ecs_task_definition` using the `FARGATE` launch type, specifying memory, CPU, and your container image URI. Inject the database endpoint from the RDS module as an environment variable (`DB_HOST`). Finally, define the `aws_ecs_service` to run the task.",
      "**Step 5 — Put a Load Balancer in Front.** Still in the `ecs` module, define an `aws_lb` (Application Load Balancer) in the public subnets. Create an `aws_lb_target_group` for port 8080 and an `aws_lb_listener` on port 80 that forwards traffic to the target group. Wire this target group into your `aws_ecs_service` definition.",
      "**Step 6 — Wire It All Together.** In your root `main.tf`, call all three modules. Pass `module.vpc.vpc_id` and the subnet IDs to the RDS and ECS modules. Pass the RDS endpoint output to the ECS module. Pass the ECS task security group ID to the RDS module to whitelist access. This defines the explicit dependency graph — Terraform will know it needs to build the VPC before the database, and the database before ECS.",
      "**Step 7 — Plan, Apply, and Verify.** Run `terraform init`. Run `terraform plan -out=tfplan` and carefully review the ~30 resources it wants to create. Run `terraform apply tfplan`. Once it completes, Terraform will output the ALB DNS name. Paste that DNS name into your browser to verify the container app is running and talking to the database.",
      "**Step 8 — Infrastructure as Code Pipeline.** To make this production-ready, write a GitHub Actions workflow `.github/workflows/terraform.yml`. It should check out the code, set up Terraform, run `fmt -check`, run `validate`, and importantly, run `plan` on Pull Requests, and `apply` only when merged to the `main` branch.",
    ],
    code: `# === Full project root module (environments/dev/main.tf) ===

terraform {
  backend "s3" {
    bucket         = "mycompany-tf-state"
    key            = "dev/app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "tf-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Project     = var.project_name
    }
  }
}

module "vpc" {
  source      = "../../modules/vpc"
  name_prefix = "\${var.project_name}-\${var.environment}"
  cidr        = var.vpc_cidr
  azs         = var.azs
}

module "rds" {
  source         = "../../modules/rds"
  name_prefix    = "\${var.project_name}-\${var.environment}"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  instance_class = var.db_instance_class
  app_sg_id      = module.ecs.task_sg_id
}

module "ecs" {
  source          = "../../modules/ecs"
  name_prefix     = "\${var.project_name}-\${var.environment}"
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnet_ids
  private_subnets = module.vpc.private_subnet_ids
  container_image = var.container_image
  container_port  = 8080
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  desired_count   = var.ecs_desired_count
  db_endpoint     = module.rds.endpoint
  db_secret_arn   = module.rds.secret_arn
}

output "app_url" {
  value = "https://\${module.ecs.alb_dns_name}"
}

output "db_endpoint" {
  value = module.rds.endpoint
}

# === environments/dev/terraform.tfvars ===
# project_name    = "myapp"
# environment     = "dev"
# aws_region      = "us-east-1"
# vpc_cidr        = "10.0.0.0/16"
# azs             = ["us-east-1a", "us-east-1b"]
# db_instance_class = "db.t3.micro"
# ecs_cpu         = 256
# ecs_memory      = 512
# ecs_desired_count = 1
# container_image = "nginx:latest"`,
    practice: "Build the complete Terraform project: create all 3 modules (vpc, ecs, rds), wire them together in a root module, deploy to dev, write a GitHub Actions CI/CD pipeline, and verify the app is accessible via the ALB URL.",
    solution: `# Full deployment checklist:
# 1. Create S3 bucket + DynamoDB table for state
# 2. mkdir -p modules/{vpc,ecs,rds} environments/{dev,prod}
# 3. Write modules: vpc (subnets, NAT, IGW), ecs (cluster, task, service, ALB), rds (instance, SG, secret)
# 4. Write root module in environments/dev/main.tf
# 5. terraform init && terraform plan -out=tfplan
# 6. terraform apply tfplan
# 7. curl https://ALB_DNS:8080/health
# 8. Copy to environments/prod/ with prod.tfvars (larger instances, more replicas)
# 9. Write .github/workflows/terraform.yml with fmt/validate/plan/apply
# 10. Push PR, review plan output, merge to main
# 11. Verify CI applies successfully
# 12. terraform state list  (verify all resources managed)`,
  },
];

// Render concept paragraphs with **bold** and `code` support
function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-slate-300 leading-relaxed text-sm sm:text-base mb-3 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-yellow-300 font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={j} className="px-1.5 py-0.5 rounded bg-slate-800 text-green-300 font-mono text-[0.85em]">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function TerraformOneDay() {
  const [idx, setIdx] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState({});

  const lesson = lessons[idx];
  const progress = ((idx + 1) / lessons.length) * 100;

  const go = (delta) => {
    setShowSolution(false);
    setIdx((i) => Math.max(0, Math.min(lessons.length - 1, i + delta)));
  };

  const toggleComplete = () => {
    setCompleted((c) => ({ ...c, [idx]: !c[idx] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="w-full px-6 sm:px-10 lg:px-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-yellow-400 transition-colors mb-6">
          <ArrowLeft size={16} />
          Back to Trainings
        </Link>
        <header className="mb-6">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <BookOpen size={22} />
            <h1 className="text-2xl sm:text-3xl font-bold">Terraform for AWS — Mid-Level</h1>
          </div>
          <p className="text-slate-400 text-sm">
            8 focused hours. Master HCL, modules, networking, compute, and CI/CD for AWS deployments.
          </p>
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Lesson {idx + 1} of {lessons.length}</span>
            <span>{Object.values(completed).filter(Boolean).length} completed</span>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-wider mb-2">
            <Clock size={14} /> {lesson.time}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4">{lesson.title}</h2>

          <section className="mb-5">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-2">
              <Lightbulb size={16} /> Concept
            </div>
            <div>{renderConcept(lesson.concept)}</div>
          </section>

          <section className="mb-5">
            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
              <Code2 size={16} /> Sample Code
            </div>
            <pre className="bg-black/60 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre">
              {lesson.code}
            </pre>
          </section>

          <section className="mb-5">
            <div className="text-purple-400 text-sm font-semibold mb-2">Practice Along</div>
            <p className="text-slate-300 text-sm sm:text-base mb-3">{lesson.practice}</p>
            <button
              onClick={() => setShowSolution((s) => !s)}
              className="text-xs px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
            >
              {showSolution ? "Hide solution" : "Show solution"}
            </button>
            {showSolution && (
              <pre className="mt-3 bg-black/60 border border-purple-900/50 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre">
                {lesson.solution}
              </pre>
            )}
          </section>

          <button
            onClick={toggleComplete}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              completed[idx]
                ? "bg-green-500/20 text-green-300 border border-green-500/40"
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 size={16} />
            {completed[idx] ? "Completed" : "Mark as complete"}
          </button>
        </div>

        <nav className="flex justify-between mt-5">
          <button
            onClick={() => go(-1)}
            disabled={idx === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <div className="flex gap-1.5 items-center">
            {lessons.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setShowSolution(false); }}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === idx ? "bg-yellow-400 w-6" : completed[i] ? "bg-green-500" : "bg-slate-700"
                }`}
                aria-label={`Go to lesson ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            disabled={idx === lessons.length - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-yellow-500 text-slate-900 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400"
          >
            Next <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}
