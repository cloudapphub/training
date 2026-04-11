export const terraformHclLessons = [
  {
    time: "Hour 1",
    title: "HCL Syntax, Blocks & Expressions",
    concept: [
      "**HCL (HashiCorp Configuration Language)** is a declarative language purpose-built for infrastructure. Unlike imperative scripts, you declare *what* you want — not *how* to build it. Terraform reads your HCL, computes a dependency graph, and executes the steps in the correct order. Every `.tf` file in a directory is merged into a single configuration.",
      "HCL has three fundamental building blocks: **blocks**, **arguments**, and **expressions**. A block has a type (`resource`, `variable`, `output`), zero or more labels, and a body in braces. Arguments assign values to names (`name = \"value\"`). Expressions compute values — literals, references (`var.name`, `aws_vpc.main.id`), function calls, and operators.",
      "**Terraform file structure**: blocks can live in any `.tf` file — Terraform merges them all. By convention: `main.tf` for resources, `variables.tf` for inputs, `outputs.tf` for outputs, `providers.tf` for provider config, `versions.tf` for version constraints, and `locals.tf` for computed values. This is convention, not requirement.",
      "**Comments** use `#` or `//` for single-line, and `/* */` for multi-line. **Heredoc strings** use `<<-EOT ... EOT` for multi-line content (the `-` strips leading whitespace). **JSON compatibility**: all HCL can also be written as JSON (`.tf.json` files), useful for machine-generated configs.",
    ],
    code: `# Block types and their anatomy
# resource "TYPE" "NAME" { ... }
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server"  # argument with map value
  }
}

# Expressions: references, functions, operators
locals {
  region      = "us-east-1"
  env         = "prod"
  name_prefix = "\${local.region}-\${local.env}"     # string interpolation
  is_prod     = local.env == "prod"                 # comparison
  az_count    = local.is_prod ? 3 : 2               # conditional
  cidr_blocks = [for i in range(local.az_count) :   # for expression
    cidrsubnet("10.0.0.0/16", 8, i)
  ]
}

# Heredoc for multi-line strings
resource "aws_iam_policy" "example" {
  name = "example-policy"
  policy = <<-EOT
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::my-bucket/*"
      }]
    }
  EOT
}

# Multiple .tf files are merged — order doesn't matter
# variables.tf, outputs.tf, main.tf all combine into one config`,
    practice: "Create a locals block with a name_prefix using string interpolation, a conditional expression that sets instance count to 3 in prod and 1 otherwise, and a for expression that generates 3 CIDR blocks.",
    solution: `variable "environment" {
  type    = string
  default = "prod"
}

locals {
  name_prefix    = "myapp-\${var.environment}"
  instance_count = var.environment == "prod" ? 3 : 1
  cidrs          = [for i in range(3) : cidrsubnet("10.0.0.0/16", 8, i)]
}

output "generated_cidrs" {
  value = local.cidrs
}`,
  },
  {
    time: "Hour 2",
    title: "Types, Variables & Validation",
    concept: [
      "Terraform has **primitive types** (`string`, `number`, `bool`) and **complex types**: `list(type)`, `set(type)`, `map(type)`, `tuple([types...])`, and `object({attr = type, ...})`. The `any` type allows Terraform to infer. Understanding types prevents runtime errors — a `list(string)` won't accept numbers.",
      "**Variable definitions** use `variable` blocks with `type`, `default`, `description`, `sensitive`, `nullable`, and `validation`. If no default is provided, Terraform prompts for the value at runtime. Values come from (in priority order): `-var` flag → `.tfvars` file → `TF_VAR_*` env vars → default → interactive prompt.",
      "**Validation blocks** enforce constraints at `plan` time. Use `condition` (a bool expression) and `error_message`. You can validate CIDR formats, enum values, string patterns, and numeric ranges. Multiple validation blocks per variable are supported — all must pass.",
      "**Type conversion** is implicit for compatible types (number → string) but fails for incompatible ones (string → list). Use `tostring()`, `tonumber()`, `tolist()`, `toset()`, `tomap()` for explicit conversion. `try()` provides fallback values when expressions might fail.",
    ],
    code: `# Complex type examples
variable "vpc_config" {
  type = object({
    cidr    = string
    azs     = list(string)
    tags    = map(string)
    private = bool
  })
  default = {
    cidr    = "10.0.0.0/16"
    azs     = ["us-east-1a", "us-east-1b"]
    tags    = { Team = "platform", CostCenter = "1234" }
    private = true
  }
}

# Multiple validations on a single variable
variable "instance_type" {
  type        = string
  description = "EC2 instance type — must be t3 or m5 family"

  validation {
    condition = can(regex("^(t3|m5)\\\\.", var.instance_type))
    error_message = "Instance type must be t3.* or m5.*"
  }

  validation {
    condition = !contains(["t3.nano"], var.instance_type)
    error_message = "t3.nano is too small for this workload."
  }
}

# Sensitive variables — masked in output
variable "db_password" {
  type      = string
  sensitive = true
}

# Type conversion & try()
locals {
  port_number = tonumber(var.port_string)        # explicit conversion
  safe_value  = try(var.optional_map["key"], "default")  # fallback
}

# Variable precedence demo:
# terraform apply -var="env=staging"              # highest priority
# terraform apply -var-file="prod.tfvars"         # file-based
# export TF_VAR_env="dev"                         # env var
# default = "dev"                                 # lowest priority`,
    practice: "Create an object variable for database config (engine, version, instance_class, storage_gb) with validation that engine must be 'postgres' or 'mysql' and storage_gb must be between 20 and 1000.",
    solution: `variable "db_config" {
  type = object({
    engine         = string
    version        = string
    instance_class = string
    storage_gb     = number
  })

  validation {
    condition     = contains(["postgres", "mysql"], var.db_config.engine)
    error_message = "Engine must be postgres or mysql."
  }

  validation {
    condition     = var.db_config.storage_gb >= 20 && var.db_config.storage_gb <= 1000
    error_message = "Storage must be between 20 and 1000 GB."
  }

  default = {
    engine         = "postgres"
    version        = "15.4"
    instance_class = "db.t3.medium"
    storage_gb     = 100
  }
}`,
  },
  {
    time: "Hour 3",
    title: "Loops, Conditionals & Dynamic Blocks",
    concept: [
      "**count** is the simplest loop — set `count = 3` to create 3 copies of a resource. Reference the current index with `count.index`. Use `count = var.create_it ? 1 : 0` as a conditional toggle to create or skip a resource entirely. Drawback: removing an item from the middle re-indexes everything after it.",
      "**for_each** iterates over a `map` or `set`, creating one resource per element. Each instance is keyed by the map key or set element, so removing an item only affects that instance — no re-indexing. Access the key with `each.key` and value with `each.value`. Always prefer `for_each` over `count` for named resources.",
      "**for expressions** transform collections inline: `[for s in var.list : upper(s)]` maps, `{for s in var.list : s.name => s.value}` creates maps, and adding `if` filters: `[for s in var.list : s if s.active]`. Use `...` for grouping mode: `{for s in var.list : s.key => s.value...}` produces map of lists.",
      "**dynamic blocks** generate repeated nested blocks inside a resource. Common use: security group ingress rules, IAM policy statements, or tag sets. The `dynamic` block has a `for_each`, a label, and a `content` block with the nested attributes. This replaces copy-pasting identical blocks.",
    ],
    code: `# count — simple numeric loop
resource "aws_subnet" "public" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.azs[count.index]
}

# count as conditional toggle
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
}

# for_each — iterate over a map (preferred over count)
variable "buckets" {
  default = {
    logs   = { versioning = true,  lifecycle_days = 90 }
    assets = { versioning = false, lifecycle_days = 365 }
    backup = { versioning = true,  lifecycle_days = 30 }
  }
}

resource "aws_s3_bucket" "this" {
  for_each = var.buckets
  bucket   = "\${local.name_prefix}-\${each.key}"
  tags     = { Purpose = each.key }
}

# for expression — transform a list
locals {
  upper_azs  = [for az in var.azs : upper(az)]
  subnet_map = {for idx, subnet in aws_subnet.public : var.azs[idx] => subnet.id}
  prod_only  = [for s in var.services : s if s.env == "prod"]
}

# dynamic block — generate repeated nested blocks
variable "ingress_rules" {
  default = [
    { port = 443, cidr = "0.0.0.0/0", desc = "HTTPS" },
    { port = 80,  cidr = "0.0.0.0/0", desc = "HTTP" },
    { port = 22,  cidr = "10.0.0.0/8", desc = "SSH internal" },
  ]
}

resource "aws_security_group" "web" {
  name_prefix = "web-"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = [ingress.value.cidr]
      description = ingress.value.desc
    }
  }
}`,
    practice: "Use for_each to create 3 IAM users from a set, and a dynamic block to attach multiple policies to a security group from a variable list.",
    solution: `variable "users" {
  type    = set(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "this" {
  for_each = var.users
  name     = each.key
}

variable "ports" {
  default = [80, 443, 8080]
}

resource "aws_security_group" "app" {
  name_prefix = "app-"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/8"]
    }
  }
}`,
  },
  {
    time: "Hour 4",
    title: "Functions & Data Sources",
    concept: [
      "Terraform provides **100+ built-in functions** organized by category: **string** (`join`, `split`, `replace`, `format`, `trimspace`), **numeric** (`min`, `max`, `ceil`, `floor`, `abs`), **collection** (`length`, `flatten`, `merge`, `lookup`, `keys`, `values`, `zipmap`), **encoding** (`jsonencode`, `yamlencode`, `base64encode`), **filesystem** (`file`, `templatefile`, `fileexists`), and **network** (`cidrsubnet`, `cidrhost`).",
      "**`templatefile()`** renders a template file with variables — ideal for user data scripts, policy documents, or config files. The template uses `${var_name}` for interpolation and `%{if condition}...%{endif}` for control flow. This replaces messy heredoc strings with clean, testable template files.",
      "**Data sources** (`data` blocks) read information from providers without creating resources. `data.aws_ami.latest` looks up the newest AMI, `data.aws_vpc.existing` reads a VPC by tag, `data.aws_caller_identity.current` gives your account ID. Data sources refresh on every `plan` — they always reflect current state.",
      "**`can()` and `try()`** are safety functions. `can(expression)` returns true if the expression evaluates without error — perfect for validation conditions. `try(expr1, expr2, default)` returns the first expression that doesn't error. Use them to handle optional attributes and dynamic data.",
    ],
    code: `# String functions
locals {
  parts     = split(",", "web,api,worker")        # ["web", "api", "worker"]
  joined    = join("-", local.parts)               # "web-api-worker"
  formatted = format("arn:aws:s3:::%s/*", var.bucket)
  replaced  = replace("hello-world", "-", "_")     # "hello_world"
}

# Collection functions
locals {
  merged = merge(
    { env = "prod" },
    { team = "platform" },
    var.extra_tags
  )
  flat    = flatten([["a", "b"], ["c"], ["d", "e"]])  # ["a","b","c","d","e"]
  looked  = lookup(var.instance_map, "web", "t3.micro")  # default fallback
  zipped  = zipmap(["name", "age"], ["Alice", "30"])     # {name="Alice", age="30"}
}

# templatefile — clean templates for user data
# templates/user_data.tftpl:
# #!/bin/bash
# echo "Deploying \${app_name} version \${app_version}"
# %{ for port in ports ~}
# iptables -A INPUT -p tcp --dport \${port} -j ACCEPT
# %{ endfor ~}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  user_data = templatefile("templates/user_data.tftpl", {
    app_name    = "myapp"
    app_version = var.app_version
    ports       = [80, 443, 8080]
  })
}

# Data sources — read existing infrastructure
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-*"]
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

output "account_id" { value = data.aws_caller_identity.current.account_id }

# can() and try()
variable "optional_config" {
  type    = any
  default = null
}

locals {
  has_config = can(var.optional_config.key)
  safe_val   = try(var.optional_config.key, "default_value")
}`,
    practice: "Use templatefile to generate an Nginx config from a template, merge two tag maps, and write a data source to look up the latest Amazon Linux 2023 AMI.",
    solution: `# templates/nginx.conf.tftpl:
# server {
#   listen \${port};
#   server_name \${domain};
#   location / {
#     proxy_pass http://localhost:\${app_port};
#   }
# }

locals {
  nginx_conf = templatefile("templates/nginx.conf.tftpl", {
    port     = 80
    domain   = "api.example.com"
    app_port = 8080
  })

  all_tags = merge(
    { ManagedBy = "terraform" },
    { Environment = var.environment }
  )
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}`,
  },
  {
    time: "Hour 5",
    title: "State Deep Dive — How State Works",
    concept: [
      "**Terraform state** (`terraform.tfstate`) is a JSON file that maps every resource in your config to its real-world counterpart. It stores resource IDs, attributes, metadata, and dependencies. Without state, Terraform doesn't know what exists — it would try to create everything from scratch on every apply. State is the **single source of truth** for what Terraform manages.",
      "State contains **sensitive data** — database passwords, access keys, private IPs. It must be encrypted at rest and access-controlled. **Never commit state to Git.** For teams, use a **remote backend** (S3 + DynamoDB) with encryption, versioning, and IAM policies that restrict who can read/write it.",
      "**State structure**: the file has a `version`, `terraform_version`, `serial` (incremented on every write), `lineage` (unique ID for the state chain), and `resources` (array of resource blocks). Each resource has `type`, `name`, `provider`, `instances` (with `attributes` containing every known attribute from the provider).",
      "**terraform show** displays the current state in human-readable format. `terraform state list` shows all resource addresses. `terraform state show aws_vpc.main` shows one resource's details. These commands read state — they don't modify it. Use them to understand what Terraform currently manages.",
    ],
    code: `# Where state lives — backend configuration
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true                          # AES-256
    dynamodb_table = "terraform-state-lock"        # locking
    # Optional: use KMS for state encryption
    # kms_key_id   = "arn:aws:kms:us-east-1:123:key/xxx"
  }
}

# State file structure (simplified JSON):
# {
#   "version": 4,
#   "terraform_version": "1.7.0",
#   "serial": 42,                    <-- increments on every write
#   "lineage": "abc123-...",         <-- unique chain ID
#   "resources": [{
#     "type": "aws_vpc",
#     "name": "main",
#     "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
#     "instances": [{
#       "attributes": {
#         "id": "vpc-0abc123",
#         "cidr_block": "10.0.0.0/16",
#         "tags": { "Name": "prod-vpc" }
#       }
#     }]
#   }]
# }

# Reading state
# terraform state list                  # list all managed resources
# terraform state show aws_vpc.main     # show one resource's state
# terraform show                        # full state in readable format
# terraform show -json | jq '.values.root_module.resources'

# S3 bucket for state — create BEFORE the backend config
resource "aws_s3_bucket" "tf_state" {
  bucket = "mycompany-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}`,
    practice: "Create the full S3 backend infrastructure: an S3 bucket with versioning, encryption, and prevent_destroy lifecycle, plus a DynamoDB table for locking.",
    solution: `resource "aws_s3_bucket" "state" {
  bucket = "my-tf-state"
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_dynamodb_table" "lock" {
  name         = "tf-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}`,
  },
  {
    time: "Hour 6",
    title: "State Locking, Corruption & Recovery",
    concept: [
      "**State locking** prevents two users or CI jobs from running `terraform apply` simultaneously — which would corrupt state. With S3 backend, a **DynamoDB table** acts as the lock. When Terraform starts an operation, it writes a lock entry; when it finishes, it deletes it. If two operations try at once, the second sees the lock and waits or fails.",
      "**Lock stuck?** If Terraform crashes mid-apply, the DynamoDB lock isn't released. Use `terraform force-unlock LOCK_ID` to remove it. **Only do this when you're certain no operation is running** — force-unlocking during an active apply will cause corruption. The lock ID is shown in the error message.",
      "**State file accidental deletion**: if someone deletes the S3 state file, Terraform thinks no resources exist and will try to recreate everything. **Recovery**: S3 versioning saves you — restore the previous version of the `.tfstate` file from S3's version history. This is why bucket versioning is **mandatory** for state buckets. Without versioning, deletion is permanent and you must manually import every resource.",
      "**State file corruption** (malformed JSON, incomplete write): download the file, fix the JSON manually or restore a previous S3 version, then re-upload. `terraform state pull > backup.tfstate` downloads current state; `terraform state push backup.tfstate` uploads a fixed version. Use `terraform plan` to verify the restored state matches reality.",
    ],
    code: `# DynamoDB table for state locking
resource "aws_dynamodb_table" "tf_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"   # no capacity planning needed
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = { Purpose = "terraform-state-locking" }
}

# --- Common State Lock Scenarios ---

# Scenario 1: Lock stuck after crash
# Error: "Error acquiring the state lock"
# Fix:
# terraform force-unlock <LOCK_ID>
# The LOCK_ID is printed in the error message

# Scenario 2: Accidental state deletion
# Step 1: Check S3 versioning — list previous versions
# aws s3api list-object-versions \\
#   --bucket mycompany-terraform-state \\
#   --prefix prod/network/terraform.tfstate

# Step 2: Restore the previous version
# aws s3api get-object \\
#   --bucket mycompany-terraform-state \\
#   --key prod/network/terraform.tfstate \\
#   --version-id "versionId123" \\
#   restored.tfstate

# Step 3: Push restored state
# terraform state push restored.tfstate

# Step 4: Verify — plan should show no changes
# terraform plan

# Scenario 3: Corrupted state — backup and restore
# terraform state pull > backup.tfstate        # download
# (fix the JSON or use a previous S3 version)
# terraform state push fixed.tfstate           # upload
# terraform plan                               # verify

# Prevention: S3 lifecycle rule to keep 30 days of versions
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    id     = "keep-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90   # keep 90 days of old state versions
    }
  }
}`,
    practice: "Write the DynamoDB lock table resource, and document the step-by-step commands to recover from an accidentally deleted state file using S3 versioning.",
    solution: `resource "aws_dynamodb_table" "lock" {
  name         = "tf-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# Recovery steps for deleted state:
# 1. List versions:
#    aws s3api list-object-versions \\
#      --bucket my-tf-state \\
#      --prefix prod/terraform.tfstate
#
# 2. Download last good version:
#    aws s3api get-object \\
#      --bucket my-tf-state \\
#      --key prod/terraform.tfstate \\
#      --version-id "abc123" \\
#      restored.tfstate
#
# 3. Push restored state:
#    terraform state push restored.tfstate
#
# 4. Verify (should show no changes):
#    terraform plan`,
  },
  {
    time: "Hour 7",
    title: "State Sync — Import, Refresh & Drift",
    concept: [
      "**Configuration drift** is when real infrastructure diverges from your Terraform state — someone changed a security group in the AWS console, or a scaling event modified the desired count. `terraform plan` detects drift by comparing state to both your config and the real cloud. It shows you exactly what changed.",
      "**terraform refresh** (now `terraform apply -refresh-only`) updates the state file to match reality *without changing infrastructure*. Use this when you know real-world changes happened and you want to accept them into state. It reads every resource from the provider API and updates state attributes. Run `plan -refresh-only` first to preview what will change in state.",
      "**terraform import** brings existing (unmanaged) resources under Terraform control. Syntax: `terraform import aws_vpc.main vpc-0abc123`. This writes the resource into state, but you must also write the matching HCL config. Without config, the next `plan` will show the resource as needing deletion. Import one resource at a time and verify with `plan` after each.",
      "**Import blocks** (Terraform 1.5+) are declarative imports in HCL — no CLI needed. Add an `import { to = aws_vpc.main; id = \"vpc-0abc123\" }` block, run `terraform plan -generate-config-out=generated.tf` to auto-generate the HCL, review and adjust it, then `apply`. This is the modern, team-friendly import workflow.",
    ],
    code: `# --- Drift Detection ---
# Someone added a tag via AWS Console to our VPC.
# terraform plan shows:
#   ~ resource "aws_vpc" "main" {
#       ~ tags = {
#           + "ManualTag" = "oops"   <-- detected drift
#         }
#     }

# Option A: Accept the drift — refresh state to match reality
# terraform apply -refresh-only
# This updates state but doesn't change infrastructure

# Option B: Correct the drift — apply reverts the manual change
# terraform apply
# This removes "ManualTag" because it's not in your config

# --- terraform import (CLI) ---
# Step 1: Write the HCL config first
resource "aws_vpc" "imported" {
  cidr_block           = "172.16.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "imported-vpc" }
}

# Step 2: Import the resource
# terraform import aws_vpc.imported vpc-0abc123def

# Step 3: Run plan to verify — should show no changes
# terraform plan

# --- Import block (Terraform 1.5+, declarative) ---
import {
  to = aws_security_group.legacy_app
  id = "sg-0abc123def456"
}

# Auto-generate config from the imported resource:
# terraform plan -generate-config-out=generated_sg.tf
# Review generated_sg.tf, clean it up, move to main.tf
# Remove the import block after successful apply

# --- Moved block — refactoring without destroy/recreate ---
# Renaming a resource without destroying it
moved {
  from = aws_instance.web
  to   = aws_instance.web_server
}

# Moving a resource into a module
moved {
  from = aws_vpc.main
  to   = module.network.aws_vpc.main
}

# --- State manipulation commands ---
# terraform state mv aws_instance.old aws_instance.new  # rename in state
# terraform state rm aws_instance.decommissioned         # remove from state (keeps real resource)
# terraform state mv aws_instance.web module.compute.aws_instance.web  # move into module`,
    practice: "Import an existing S3 bucket into Terraform using both CLI import and the declarative import block (1.5+). Then use a moved block to rename a resource.",
    solution: `# CLI approach:
# 1. Write config:
resource "aws_s3_bucket" "legacy" {
  bucket = "my-existing-bucket"
}
# 2. terraform import aws_s3_bucket.legacy my-existing-bucket
# 3. terraform plan  # should show no changes

# Declarative import block (Terraform 1.5+):
import {
  to = aws_s3_bucket.legacy
  id = "my-existing-bucket"
}
# terraform plan -generate-config-out=imported.tf
# review imported.tf, then apply

# Moved block for renaming:
moved {
  from = aws_s3_bucket.legacy
  to   = aws_s3_bucket.app_data
}

resource "aws_s3_bucket" "app_data" {
  bucket = "my-existing-bucket"
}`,
  },
  {
    time: "Hour 8",
    title: "State Surgery, Workspaces & Best Practices",
    concept: [
      "**terraform state mv** renames a resource in state without destroying/recreating it. `terraform state mv aws_instance.old aws_instance.new` updates the state address. Use this when refactoring HCL (renaming resources, moving into modules). The `moved` block (Hour 7) is the modern declarative alternative.",
      "**terraform state rm** removes a resource from state *without deleting it from the cloud*. Use this when you want to 'unmanage' a resource — Terraform forgets it exists, but the real resource keeps running. The inverse of `import`. Common use: transferring resource ownership to another Terraform project.",
      "**Workspaces** create isolated state files within the same backend. `terraform workspace new staging` creates a new state at `env:/staging/terraform.tfstate`. Reference the workspace name with `terraform.workspace` to vary config (smaller instances in dev, HA in prod). Each workspace is completely independent — different state, same code.",
      "**Best practices summary**: ✅ Always use remote state with locking ✅ Enable S3 versioning (90+ day retention) ✅ Never edit state manually — use `state mv/rm/import` ✅ Run `plan` after every state operation ✅ Use `moved` blocks for refactoring ✅ Use `prevent_destroy` on stateful resources ✅ Limit state access to CI/CD pipelines ✅ Small state files (split large projects into multiple states with remote state data sources).",
    ],
    code: `# --- State Surgery Commands ---

# Rename a resource in state
# terraform state mv aws_security_group.web aws_security_group.frontend

# Move a resource into a module
# terraform state mv aws_rds_cluster.main module.database.aws_rds_cluster.main

# Remove from state (resource stays in AWS)
# terraform state rm aws_instance.temporary

# List all resources
# terraform state list

# Show one resource's full attributes
# terraform state show aws_vpc.main

# --- Workspaces ---
# terraform workspace new staging
# terraform workspace new prod
# terraform workspace list
# terraform workspace select staging

# Use workspace name in config
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = terraform.workspace == "prod" ? "m5.large" : "t3.micro"
  count         = terraform.workspace == "prod" ? 3 : 1

  tags = {
    Name        = "web-\${terraform.workspace}"
    Environment = terraform.workspace
  }
}

# State files per workspace in S3:
# env:/dev/terraform.tfstate
# env:/staging/terraform.tfstate
# env:/prod/terraform.tfstate

# --- Remote State Data Source ---
# Read outputs from another Terraform project's state
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "mycompany-terraform-state"
    key    = "prod/network/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "web" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
}

# --- Full State Recovery Runbook ---
# 1. DON'T PANIC — if state is lost but S3 versioning is on, you can recover
# 2. List S3 versions: aws s3api list-object-versions --bucket STATE_BUCKET --prefix STATE_KEY
# 3. Download previous version: aws s3api get-object --version-id VER_ID --bucket BUCKET --key KEY recovered.tfstate
# 4. Verify the file: cat recovered.tfstate | python -m json.tool
# 5. Push to backend: terraform state push recovered.tfstate
# 6. Run plan: terraform plan (should show zero changes)
# 7. If no versioned backup exists, import every resource manually:
#    terraform import aws_vpc.main vpc-xxx
#    terraform import aws_subnet.public[0] subnet-xxx
#    (repeat for every resource — this is why versioning is critical)`,
    practice: "Create a workspace-aware config that uses t3.micro for dev and m5.large for prod. Then use terraform_remote_state to read VPC outputs from another project's state.",
    solution: `resource "aws_instance" "app" {
  instance_type = terraform.workspace == "prod" ? "m5.large" : "t3.micro"
  count         = terraform.workspace == "prod" ? 3 : 1
  ami           = data.aws_ami.ubuntu.id
  subnet_id     = data.terraform_remote_state.net.outputs.private_subnet_ids[0]

  tags = {
    Env = terraform.workspace
  }
}

data "terraform_remote_state" "net" {
  backend = "s3"
  config = {
    bucket = "my-tf-state"
    key    = "\${terraform.workspace}/network/terraform.tfstate"
    region = "us-east-1"
  }
}`,
  },
  {
    time: "Homework Project",
    title: "Build & Deploy Multi-Env Infrastructure with Modules",
    concept: [
      "**Project Goal**: you will build an enterprise-grade Terraform module library and use it to deploy a complete 3-tier web application to `dev`, `staging`, and `prod` environments. The infrastructure includes VPC, ECS Fargate, Aurora PostgreSQL, S3, and CloudWatch — all parameterized by environment using workspaces and `.tfvars` files.",
      "**Step 1 — Create the Module Library.** In your project root, create a `modules/` folder. Create four subdirectories: `vpc`, `ecs`, `aurora`, and `monitoring`. In each, create `main.tf`, `variables.tf`, and `outputs.tf`. Move the raw resource blocks from previous lessons into these modules. For example, the `vpc` module should define `aws_vpc`, `aws_subnet`s, and `aws_nat_gateway`, then output the `vpc_id` and `subnet_ids`.",
      "**Step 2 — Set Up the S3 Backend and Locking.** For remote state, you need a chicken-and-egg solution. Create a separate folder called `state-prep/`, and write a small Terraform script to provision an S3 bucket (with versioning enabled) and a DynamoDB table (with partition key `LockID`). Apply this first. Then, in your root level `backend.tf`, add the `terraform { backend \"s3\" { ... } }` block referencing the new bucket and table.",
      "**Step 3 — Write the Root Module.** Create `main.tf` in the root folder. Call the modules you created in Step 1. Wire them together using interpolations: pass `module.vpc.vpc_id` into the `ecs` and `aurora` modules. Pass `module.aurora.secret_arn` into the `ecs` module so containers can access DB credentials. Prefix all resources with `\${var.project}-\${terraform.workspace}` to ensure names are unique per environment.",
      "**Step 4 — Create Environment Configurations.** Create an `environments/` folder. In it, create `dev.tfvars`, `staging.tfvars`, and `prod.tfvars`. In `dev.tfvars`, set `ecs_desired_count = 1` and `db_instance_class = \"db.t3.micro\"`. In `prod.tfvars`, set `ecs_desired_count = 3` and `db_instance_class = \"db.r6g.large\"`. This is the core principle of environment parity: same code, different sizing.",
      "**Step 5 — Deploy to Dev and Staging.** Run `terraform init` to initialize the backend. Run `terraform workspace new dev` to create the dev state isolation. Run `terraform plan -var-file=environments/dev.tfvars -out=dev.plan` and review the output. Apply it with `terraform apply dev.plan`. Then, run `terraform workspace new staging` and apply `staging.tfvars`. Look in your AWS console — you now have two completely isolated environments side by side.",
      "**Step 6 — Simulate Complete State Loss.** Now for the scary part. Go to your local machine and delete the `.terraform` directory. Let's pretend a new developer joined the team. Run `terraform init`. Note how Terraform automatically downloads the S3 state. Now try `terraform plan -var-file=environments/dev.tfvars`. It should show `No changes. Infrastructure is up-to-date.` You've just verified your remote state is the source of truth.",
      "**Step 7 — Simulate Accidental State Deletion.** Go to AWS S3 and manually delete the `terraform.tfstate` file for the `dev` workspace. Run a `plan` — Terraform will think the infrastructure doesn't exist and want to recreate it (which would fail due to naming conflicts). Because you enabled S3 versioning in Step 2, go back to S3, show \"Versions\", and delete the \"DeleteMarker\". Run a `plan` again — Terraform instantly knows the infrastructure is perfectly fine. You've just recovered from a disaster.",
      "**Step 8 — Destroy Everything (If Desired).** When you're done testing, you must destroy the infrastructure to avoid large AWS bills. Switch to each workspace: `terraform workspace select dev && terraform destroy -var-file=environments/dev.tfvars -auto-approve`. Repeat for staging. Finally, go to the `state-prep/` folder and `terraform destroy` the S3 bucket and DynamoDB table (you must manually empty the S3 bucket first).",
    ],
    code: `# === PROJECT STRUCTURE ===
# terraform-infra/
# ├── main.tf              # root module, calls child modules
# ├── variables.tf         # environment-level inputs
# ├── outputs.tf           # key outputs (ALB DNS, DB endpoint)
# ├── backend.tf           # S3 + DynamoDB backend
# ├── providers.tf         # AWS provider version
# ├── environments/
# │   ├── dev.tfvars
# │   ├── staging.tfvars
# │   └── prod.tfvars
# └── modules/
#     ├── vpc/
#     │   ├── main.tf
#     │   ├── variables.tf
#     │   └── outputs.tf
#     ├── ecs/
#     ├── aurora/
#     └── monitoring/

# === backend.tf ===
terraform {
  backend "s3" {
    bucket         = "mycompany-tf-state"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "tf-state-lock"
  }
}

# === main.tf (root) ===
module "vpc" {
  source      = "./modules/vpc"
  name_prefix = "\${var.project}-\${terraform.workspace}"
  cidr        = var.vpc_cidr
  azs         = var.azs
}

module "aurora" {
  source          = "./modules/aurora"
  name_prefix     = "\${var.project}-\${terraform.workspace}"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_class  = var.db_instance_class
  instance_count  = var.db_instance_count
  app_sg_id       = module.ecs.task_sg_id
}

module "ecs" {
  source         = "./modules/ecs"
  name_prefix    = "\${var.project}-\${terraform.workspace}"
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnet_ids
  private_subnets = module.vpc.private_subnet_ids
  container_image = var.container_image
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  desired_count   = var.ecs_desired_count
  db_secret_arn   = module.aurora.secret_arn
}

module "monitoring" {
  source       = "./modules/monitoring"
  name_prefix  = "\${var.project}-\${terraform.workspace}"
  alb_arn      = module.ecs.alb_arn
  cluster_name = module.aurora.cluster_id
  alert_email  = var.alert_email
}

# === environments/dev.tfvars ===
# project            = "myapp"
# vpc_cidr           = "10.0.0.0/16"
# azs                = ["us-east-1a", "us-east-1b"]
# db_instance_class  = "db.t3.medium"
# db_instance_count  = 1
# ecs_cpu            = 256
# ecs_memory         = 512
# ecs_desired_count  = 1
# container_image    = "123456.dkr.ecr.us-east-1.amazonaws.com/myapp:dev"
# alert_email        = "dev-alerts@company.com"

# === environments/prod.tfvars ===
# project            = "myapp"
# vpc_cidr           = "10.1.0.0/16"
# azs                = ["us-east-1a", "us-east-1b", "us-east-1c"]
# db_instance_class  = "db.r6g.large"
# db_instance_count  = 2
# ecs_cpu            = 1024
# ecs_memory         = 2048
# ecs_desired_count  = 3
# container_image    = "123456.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.2.0"
# alert_email        = "prod-alerts@company.com"

# === modules/vpc/main.tf (example) ===
resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  tags = { Name = "\${var.name_prefix}-vpc" }
}

resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr, 8, count.index)
  availability_zone = var.azs[count.index]
  tags = { Name = "\${var.name_prefix}-private-\${count.index}" }
}`,
    practice: "Build the full project: create VPC and Aurora modules, set up the root module calling them, create dev and prod tfvars, deploy to dev workspace, then prod. Validate state locking works by running two applies simultaneously.",
    solution: `# Full deployment checklist:
# 1. Create S3 state bucket + DynamoDB lock table (bootstrap)
# 2. mkdir -p modules/{vpc,ecs,aurora,monitoring} environments
# 3. Write all module files (variables.tf, main.tf, outputs.tf)
# 4. Write root main.tf calling all modules
# 5. Create dev.tfvars and prod.tfvars
# 6. terraform init
# 7. terraform workspace new dev
# 8. terraform plan -var-file=environments/dev.tfvars
# 9. terraform apply -var-file=environments/dev.tfvars
# 10. terraform workspace new prod
# 11. terraform plan -var-file=environments/prod.tfvars
# 12. terraform apply -var-file=environments/prod.tfvars
# 13. Verify: terraform state list (both workspaces independent)
# 14. Test recovery: delete S3 state, restore from version, terraform plan
# 15. Output should show ALB DNS and Aurora endpoint per environment`,
  },
];
