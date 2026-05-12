/**
 * AWS Cloud Foundations — Lesson Data
 * Hour 1: AWS Cloud (Accounts, Regions, AZs)
 * Hour 2: AWS IAM (Users, Groups, Roles, Policies)
 * Hour 3: Amazon CloudWatch (Logs, Dashboards, Alarms, Logs Insights)
 */

export const awsLessons = [
  {
    time: "Hour 1",
    title: "AWS Cloud Foundations: Accounts, Regions & Availability Zones",
    concept: [
      "**What is AWS and why does its structure matter?** AWS (Amazon Web Services) is a cloud platform that lets you rent computing infrastructure on demand, paying only for what you use. But before you launch a single server, you need to understand the **three-tier geography** AWS uses to organize its infrastructure: AWS Accounts → Regions → Availability Zones. Getting this hierarchy wrong causes security incidents, outages, and unexpected bills. Getting it right gives you global reach, automatic resilience, and a clean security boundary.",
      "**AWS Account — the fundamental isolation boundary.** An AWS Account is NOT just a login. It is a completely isolated container for all your cloud resources. Think of it as a walled compound: resources inside one account cannot see, access, or affect resources in another account by default. This is why large enterprises run dozens or hundreds of AWS accounts. A typical 'Landing Zone' pattern creates separate accounts for: (a) **Management/Root** — billing and governance only, never run workloads here; (b) **Development** — engineers experiment freely; (c) **Staging** — mirrors production for testing; (d) **Production** — hardened, minimal permissions; (e) **Security/Audit** — central log archive, read-only access to all accounts. By separating accounts, a security breach in Development cannot reach your Production databases even if an attacker gets full administrator access.",
      "**AWS Organizations — managing accounts at scale.** AWS Organizations lets you group accounts into a hierarchy called an **Organizational Unit (OU)** tree. You apply Service Control Policies (SCPs) at the OU level. An SCP is a guardrail: it sets the maximum permissions any IAM user or role in that OU can ever have. For example, you might attach an SCP to the 'Production' OU that prevents anyone from disabling CloudTrail logging, deleting S3 buckets, or deploying resources outside of approved regions — even if an IAM admin user tries. SCPs act before IAM policies, making them incredibly powerful for compliance.",
      "**AWS Regions — your primary geographic choice.** A Region is a fully independent AWS data center cluster in a specific geographic location — for example, `us-east-1` (Northern Virginia), `eu-west-1` (Ireland), or `ap-southeast-1` (Singapore). Each Region is completely isolated from all others; a major infrastructure failure in `us-east-1` cannot affect `eu-west-1`. **Why does Region selection matter?** (1) **Latency** — choose the Region closest to your users. A user in Germany will experience 150ms+ latency hitting `us-east-1` but under 20ms hitting `eu-west-1`. (2) **Data sovereignty** — EU GDPR requires personal data of EU citizens to stay in the EU. Choosing `eu-west-1` or `eu-central-1` keeps data inside EU jurisdiction. (3) **Service availability** — not every AWS service is available in every Region. Bedrock AI models launched in `us-east-1` months before reaching `eu-central-1`. (4) **Pricing** — the same EC2 instance type can cost 15-25% less in `us-east-1` than `ap-southeast-1` due to infrastructure costs.",
      "**Availability Zones — the secret to high availability.** Each Region is subdivided into 2-6 Availability Zones (AZs). An AZ is one or more physically separate data centers within the same Region, connected by ultra-low-latency fiber (under 2ms). They are far enough apart to have independent power grids, cooling systems, and flood zones — but close enough for synchronous database replication. **The golden rule of production architecture: never run critical workloads in a single AZ.** If `us-east-1a` loses power, your application in `us-east-1b` and `us-east-1c` keeps running. An ALB (Application Load Balancer) automatically routes traffic to healthy AZs. An RDS Multi-AZ instance automatically fails over to the standby replica in under 35 seconds. AZs are the primary tool for achieving the '4-nines' (99.99%) availability targets enterprises require.",
      "**Local Zones and Wavelength Zones — edge extensions.** Beyond standard Regions and AZs, AWS offers Local Zones which bring compute (EC2, ECS, EKS) physically closer to dense population centers like Los Angeles, Boston, or Miami for sub-10ms latency workloads like live video streaming and gaming. Wavelength Zones embed AWS compute inside 5G carrier networks (Verizon, KDDI) for sub-5ms latency for mobile applications. You likely won't use these daily, but in financial trading, broadcast media, or real-time gaming contexts they are essential architectural tools."
    ],
    code: `# ================================================================
# AWS ACCOUNT & REGION FOUNDATIONS — AWS CLI CHEATSHEET
# ================================================================

# --- ACCOUNT DISCOVERY ---

# Who you are: see your Account ID, Account alias, ARN
aws sts get-caller-identity
# Returns:
# {
#   "UserId": "AIDIODR4TAW7CSEXAMPLE",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/alice"
# }

# List all accounts in your AWS Organization
aws organizations list-accounts \
  --query "Accounts[*].{ID:Id, Name:Name, Status:Status}" \
  --output table

# See the OUs (Organizational Units) at root level
aws organizations list-organizational-units-for-parent \
  --parent-id "r-xxxx"    # replace with your root ID

# --- REGION MANAGEMENT ---

# List all regions enabled in your account
aws ec2 describe-regions --output table
# Shows: RegionName, Endpoint, OptInStatus

# Opt-in to a new region (e.g., ap-south-2 — Hyderabad)
aws account enable-region --region-name ap-south-2

# List all AZs in a specific region
aws ec2 describe-availability-zones --region us-east-1 \
  --query "AvailabilityZones[*].{Name:ZoneName, State:State}" \
  --output table
# Returns:
#   us-east-1a   available
#   us-east-1b   available
#   us-east-1c   available
#   us-east-1d   available
#   us-east-1e   available
#   us-east-1f   available

# Switch regions in AWS CLI
export AWS_DEFAULT_REGION=eu-west-1
aws ec2 describe-availability-zones  # now queries eu-west-1

# --- TERRAFORM: MULTI-REGION SETUP ---

# variables.tf
variable "primary_region"  { default = "us-east-1" }
variable "failover_region" { default = "us-west-2" }

# providers.tf — two provider aliases for two regions
provider "aws" {
  region = var.primary_region
  alias  = "primary"
}

provider "aws" {
  region = var.failover_region
  alias  = "failover"
}

# main.tf — S3 bucket in each region (disaster recovery pair)
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "myapp-data-primary-us-east-1"
}

resource "aws_s3_bucket" "failover" {
  provider = aws.failover
  bucket   = "myapp-data-failover-us-west-2"
}

# --- MULTI-AZ VPC — TERRAFORM EXAMPLE ---

# Best practice: one public + one private subnet per AZ
# For us-east-1 (6 AZs) this gives 12 subnets total.
# For production, always deploy to at MINIMUM 2 AZs (preferably 3).

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false  # one NAT per AZ for HA (costs more, worth it)
  enable_dns_hostnames = true

  tags = {
    Environment = "production"
    Terraform   = "true"
  }
}`,
    practice: "Your company has 3 teams (Platform Eng, Backend Dev, Data Science). Describe the AWS account structure you would recommend, which Region(s) you would choose if your users are in New York and London, and how many AZs you would use for production. Justify each decision.",
    solution: `# RECOMMENDED ACCOUNT STRUCTURE:
#
# Management Account    (AWS Organizations root, billing only)
# ├── Security OU
# │   └── Security Account  (CloudTrail logs, GuardDuty, Config)
# ├── Workloads OU
# │   ├── Dev Account       (all 3 teams experiment)
# │   ├── Staging Account   (mirrors prod, pre-release gate)
# │   └── Production Account (hardened, min permissions)
# └── (Optional) Sandbox OU
#     └── Individual sandbox accounts per engineer
#
# REGION CHOICE:
# Primary:   us-east-1 (NYC users, cheapest, most services)
# Secondary: eu-west-1 (London users, GDPR jurisdiction)
# Implement Route 53 latency-based routing or Global Accelerator
# to direct users to nearest region automatically.
#
# AZ STRATEGY:
# Production: 3 AZs (us-east-1a, us-east-1b, us-east-1c)
# - EKS nodes spread across all 3 via Topology Spread Constraints
# - RDS Multi-AZ with 2 AZs active (primary + standby)
# - ALB spans all 3 AZs, routes only to healthy AZ instances
# - One NAT Gateway per AZ (do NOT use single NAT — entire AZ loss = outage)`
  },
  {
    time: "Hour 2",
    title: "AWS IAM: Users, Groups, Roles & Policies",
    concept: [
      "**What is IAM and why is it the most important AWS service?** IAM (Identity and Access Management) is the gatekeeper for every single API call made to AWS. Every time your code uploads a file to S3, every time your Lambda reads a secret, every time your EKS node pulls an ECR image — IAM either approves or denies that action. IAM is free, globally consistent (not region-scoped), and arguably harder to get right than any other AWS service. The famous '2019 Capital One breach' was caused by an IAM misconfiguration: an EC2 instance had an overprivileged IAM role that allowed it to read any S3 bucket in the account. Understanding IAM deeply is not optional for anyone working on AWS.",
      "**IAM Users — human identities with long-lived credentials.** An IAM User represents a single human or system. When you create an IAM User, you can give them: (a) a **password** for AWS Console access, (b) **Access Keys** (Access Key ID + Secret Access Key) for programmatic CLI/SDK access. Access Keys are essentially long-lived passwords for the API — they never expire unless you explicitly rotate or delete them. **Production best practice: do NOT create IAM Users for applications.** Access Keys in code are frequently leaked via GitHub commits, S3 bucket exposures, or stolen laptops. Use IAM Roles instead (explained next). For human users at scale, use AWS SSO (IAM Identity Center) with your corporate identity provider (Okta, Azure AD) so users log in with their existing corporate credentials and get temporary, session-based AWS credentials — never long-lived access keys.",
      "**IAM User Groups — manage permissions at scale.** An IAM User Group is a collection of IAM Users that share the same set of permissions. You attach IAM Policies to the Group, and every user in the group inherits those policies automatically. For example: create a `dev-engineers` Group with permissions to read/write S3, access RDS in dev, and deploy to ECS. Add all 20 developers to that group. When a new engineer joins, you add them to the group and they immediately have all the right access. When an engineer leaves, you remove them from the group (or disable their IAM User) and all permissions are revoked instantly. Groups cannot be nested (you cannot put a Group inside a Group), but users can belong to multiple groups.",
      "**IAM Roles — the right way to give permissions to AWS services.** An IAM Role is like a permission badge that can be 'assumed' (picked up and used) by AWS services, EC2 instances, Lambda functions, EKS pods, or even users from other AWS accounts. The fundamental difference from an IAM User: Roles issue **temporary security credentials** (valid for 15 minutes to 12 hours) via STS (Security Token Service). There are no long-lived access keys. When the credential expires, the service automatically requests a new one. This means even if credentials are somehow leaked, they stop working within hours — unlike IAM User access keys which work until manually revoked. Every Lambda function you write, every EC2 instance you launch, every EKS pod that needs AWS access, every CodeBuild project — they all use IAM Roles.",
      "**Service Roles — the most common Role pattern.** A Service Role is an IAM Role that an AWS service assumes ON YOUR BEHALF to perform actions. The classic example: EC2 Instance Profile. When you launch an EC2 instance and attach an IAM Role to it (via Instance Profile), every application running on that instance can call the EC2 metadata service at `169.254.169.254` to get temporary credentials for that role. The AWS SDK does this automatically — no code changes needed, no credentials.json files, no environment variables. The same pattern works for Lambda (the execution role), ECS tasks (task role), CodeBuild projects (service role), and dozens of other services. **Trust Policy** is the key concept: a Role's Trust Policy defines WHO is allowed to assume the Role. For an EC2 Role, the trust policy says `ec2.amazonaws.com` can assume it. For a Lambda Role, it says `lambda.amazonaws.com`. You cannot accidentally use an EC2 Role from a Lambda — the trust policy prevents it.",
      "**IAM Policies — the permission documents.** A Policy is a JSON document that lists exactly what API actions are allowed or denied, on which resources, and under what conditions. There are three types: (1) **AWS Managed Policies** — pre-built by AWS, like `AmazonS3ReadOnlyAccess` or `AWSLambdaBasicExecutionRole`. Easy to use, but often too broad. `AdministratorAccess` gives full access to everything — should never be attached to application roles. (2) **Customer Managed Policies** — policies you write and manage. Best for production. You control the exact permissions. (3) **Inline Policies** — policies embedded directly inside a User, Group, or Role. Avoid these in production — they are harder to manage at scale. Always write Customer Managed Policies. The most important principle is **Least Privilege**: grant only the exact permissions required and nothing more. `s3:GetObject` on a specific bucket is better than `s3:*` on `*`."
    ],
    code: `# ================================================================
# AWS IAM — COMPLETE PRODUCTION REFERENCE
# ================================================================

# ── IAM USERS (for humans, use sparingly in favor of SSO) ──────

# Create an IAM user
aws iam create-user --user-name alice

# Create login profile (console password)
aws iam create-login-profile \
  --user-name alice \
  --password "TemporaryPass123!" \
  --password-reset-required

# Create programmatic access key (AVOID for prod — use Roles)
aws iam create-access-key --user-name alice
# Returns AccessKeyId + SecretAccessKey — store securely, shown ONCE

# List access keys for a user (check for stale, old keys)
aws iam list-access-keys --user-name alice

# ── IAM USER GROUPS ────────────────────────────────────────────

# Create a group and attach a managed policy
aws iam create-group --group-name dev-engineers

aws iam attach-group-policy \
  --group-name dev-engineers \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Add a user to a group
aws iam add-user-to-group \
  --group-name dev-engineers \
  --user-name alice

# ── IAM POLICIES — Writing Least-Privilege Policies ───────────

# GOOD: Tightly scoped policy (S3 access to a specific bucket only)
cat > s3-app-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppBucketReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::myapp-prod-data",
        "arn:aws:s3:::myapp-prod-data/*"
      ]
    }
  ]
}
EOF

# BAD: Overprivileged policy — NEVER use in production
# { "Effect": "Allow", "Action": "s3:*", "Resource": "*" }

# Create the policy in AWS
aws iam create-policy \
  --policy-name myapp-s3-access \
  --policy-document file://s3-app-policy.json

# ── IAM ROLES — EC2 Instance Role Example ──────────────────────

# Step 1: Trust policy — who can ASSUME this role
cat > ec2-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Step 2: Create the Role with the trust policy
aws iam create-role \
  --role-name myapp-ec2-role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Step 3: Attach the permission policy to the Role
aws iam attach-role-policy \
  --role-name myapp-ec2-role \
  --policy-arn arn:aws:iam::123456789012:policy/myapp-s3-access

# Step 4: Create an Instance Profile to attach the Role to EC2
aws iam create-instance-profile \
  --instance-profile-name myapp-ec2-instance-profile

aws iam add-role-to-instance-profile \
  --instance-profile-name myapp-ec2-instance-profile \
  --role-name myapp-ec2-role

# Step 5: Launch EC2 with the Instance Profile attached
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --iam-instance-profile Name=myapp-ec2-instance-profile \
  --count 1

# ── IAM ROLES — Lambda Execution Role ──────────────────────────

cat > lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name myapp-lambda-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach basic Lambda logging permissions
aws iam attach-role-policy \
  --role-name myapp-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# ── TERRAFORM: COMPLETE IAM ROLE EXAMPLE ──────────────────────

# This is the cleanest, most production-ready pattern.
# Creates a Lambda role with S3 read access using Terraform's
# aws_iam_policy_document data source (no raw JSON strings).

# data sources generate the JSON policy documents safely
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_s3_read" {
  statement {
    sid     = "ReadAppBucket"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.app_data.arn,
      "\${aws_s3_bucket.app_data.arn}/*",
    ]
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "myapp-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = { Terraform = "true" }
}

resource "aws_iam_role_policy" "lambda_s3" {
  name   = "s3-read-access"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_s3_read.json
}

# Attach AWS-managed basic execution role (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}`,
    practice: "A startup uses one AWS account, one IAM User ('admin') with AdministratorAccess for everything, and hardcodes the access key in their application's config file. Identify every problem with this setup and design a production-grade alternative.",
    solution: `# PROBLEMS WITH CURRENT SETUP:
# 1. Single account: dev and prod share the same blast radius.
#    A bug in dev can delete prod resources. No isolation whatsoever.
# 2. Single admin IAM User: if this account is compromised, the attacker
#    has full access to EVERYTHING — S3, EC2, RDS, billing, IAM itself.
# 3. AdministratorAccess on an application: the app can delete itself,
#    its own database, stop all EC2 instances, and exfiltrate all data.
# 4. Hardcoded access key: access keys in config files get committed
#    to git accidentally. Key is long-lived — works until manually rotated.
#    Even after rotation, git history stores the old key forever.
#
# PRODUCTION-GRADE REDESIGN:
#
# ACCOUNT STRUCTURE:
# ├── Management Account (billing, Organizations only)
# ├── Dev Account (engineers experiment here)
# └── Production Account (hardened)
#     └── SCP prevents: disabling CloudTrail, leaving approved regions
#
# HUMAN ACCESS:
# Use AWS IAM Identity Center (SSO) with their existing corporate IdP.
# Engineers authenticate via SSO and get temporary credentials (1-8h).
# No long-lived access keys for any human.
# Create Groups: 'dev-engineers' (PowerUser in Dev),
#                'prod-readonly' (ReadOnly in Prod for debugging).
#
# APPLICATION ACCESS:
# EC2 instance: attach IAM Role via Instance Profile.
#   Role permissions: only the specific S3 bucket + SecretsManager access.
#   No access keys anywhere in code.
# Lambda: assign Execution Role with only required permissions.
#
# PRINCIPLE OF LEAST PRIVILEGE EXAMPLE:
# Instead of AdministratorAccess, the app gets:
#   s3:GetObject, s3:PutObject on arn:aws:s3:::myapp-prod/* ONLY
#   secretsmanager:GetSecretValue on arn:aws:secretsmanager:*:*:secret:myapp/* ONLY
#   logs:CreateLogGroup, logs:PutLogEvents on its own log group ONLY`
  },
  {
    time: "Hour 3",
    title: "Amazon CloudWatch: Logs, Dashboards, Alarms & Logs Insights",
    concept: [
      "**What is CloudWatch and why is it the observability backbone of AWS?** Amazon CloudWatch is AWS's native monitoring, logging, and alerting service. Every AWS service — EC2, Lambda, EKS, RDS, ECS, API Gateway, DynamoDB — automatically emits metrics and, in most cases, logs into CloudWatch without any extra configuration. Think of CloudWatch as having four core pillars: (1) **Logs** — centralized log storage and streaming from any source; (2) **Metrics** — time-series numerical data (CPU usage, error rates, request counts); (3) **Alarms** — automated threshold-based notifications and actions triggered by metric changes; (4) **Logs Insights** — an SQL-like query engine for running ad-hoc analytical queries across your logs in seconds. Understanding all four makes the difference between flying blind during an incident and resolving it in minutes.",

      "**CloudWatch Logs — the anatomy of log storage.** CloudWatch Logs organizes log data in a two-level hierarchy: **Log Groups** and **Log Streams**. A **Log Group** is a container for logs from a single application or service — for example `/aws/lambda/payment-processor` or `/myapp/production/api`. Think of it as a folder. A **Log Stream** is a sequence of log events from a single specific source — for example one Lambda function invocation creates one log stream. Inside a Log Group you will have many Log Streams. Key configurations every engineer must know: (a) **Retention Policy** — by default CloudWatch stores logs FOREVER and you pay for every GB stored. Always set a retention period (7 days for dev, 30-90 days for prod, 1-7 years for compliance-driven workloads). A single high-traffic service can generate 100GB+ of logs per day. Forgetting to set retention is one of the most common sources of unexpected AWS bills. (b) **Log Subscriptions** — you can stream logs in real-time from a Log Group to Kinesis Data Streams, Kinesis Data Firehose, or Lambda for real-time processing, anomaly detection, or forwarding to ElasticSearch/Splunk.",

      "**CloudWatch Metrics — built-in vs custom, namespaces and dimensions.** Every AWS service publishes metrics into CloudWatch under its own **Namespace** — for example `AWS/EC2`, `AWS/Lambda`, `AWS/RDS`, `AWS/EKS`. Within a namespace, each metric has **Dimensions** that act like filters or labels. For EC2, dimensions include `InstanceId` and `AutoScalingGroupName`. For Lambda, dimensions include `FunctionName` and `Resource`. This lets you ask: 'show me the `Duration` metric for Lambda function `payment-processor` only'. Beyond built-in metrics, you can publish your own **Custom Metrics** — for example your application's active order count, cart abandonment rate, or database query latency measured at the application layer. You push custom metrics using the AWS SDK or the CloudWatch Agent. Custom metrics cost $0.30 per metric per month. A good rule of thumb: instrument every business-critical operation (order placed, payment processed, user login) as a custom metric so you can alarm on them independently of infrastructure metrics.",

      "**CloudWatch Alarms — the automated response system.** A CloudWatch Alarm watches a single metric over a time window and transitions between three states: `OK` (metric within threshold), `ALARM` (threshold breached), and `INSUFFICIENT_DATA` (not enough data points yet). When an alarm transitions to `ALARM`, it sends a notification to an **SNS Topic** which then fans out to: email addresses, SMS, PagerDuty/OpsGenie webhooks, Lambda functions, or SQS queues. Crucially, alarms can also trigger **automated actions** — for example automatically scaling an EC2 Auto Scaling Group up when CPU exceeds 70%, or automatically stopping an EC2 instance when CPU drops below 5% (cost saving). **Composite Alarms** are an advanced pattern: instead of alarming on a single metric, you combine multiple alarms with AND/OR logic. Example: only alert the on-call engineer if BOTH error rate is high AND latency is high simultaneously — preventing false positive pages during planned maintenance when one metric spikes briefly.",

      "**CloudWatch Logs Insights — querying logs like a database.** Logs Insights is a purpose-built query engine that runs directly against your CloudWatch Log Groups without needing to export data anywhere. It uses its own SQL-inspired query language with powerful built-in commands: `filter` (WHERE clause), `fields` (SELECT specific fields), `stats` (GROUP BY + aggregations), `sort` (ORDER BY), `limit` (TOP N), and `parse` (extract regex-matched fields from unstructured log strings). The query engine auto-discovers fields from JSON-structured logs — if your application logs structured JSON (which it should in production), every JSON key becomes a queryable field automatically. Performance: Logs Insights can scan gigabytes of logs in seconds by distributing the scan across CloudWatch's infrastructure. It charges per GB of data scanned — so structured JSON logs and targeted time windows dramatically reduce cost. This is why every serious production application logs JSON instead of plain text strings.",

      "**CloudWatch Dashboards — building operational visibility.** A CloudWatch Dashboard is a customizable, shareable page containing any combination of widgets: line graphs, stacked area charts, numbers, gauges, alarms status panels, and even Logs Insights query results embedded as tables or bar charts. Dashboards are region-specific but can be configured to pull cross-region and cross-account metrics — critical for multi-region deployments where you need a single pane of glass. Best practices: (1) **Service-level dashboard** — one dashboard per microservice showing its key metrics: request rate, error rate, P50/P95/P99 latency, downstream dependency health. (2) **Business-level dashboard** — orders per minute, revenue processed, active users — visible to product and business teams, not just engineers. (3) **On-call dashboard** — pin only the metrics that matter during an incident: service error rate, database connection pool utilization, queue depth, node CPU/memory. Dashboards can be created via AWS Console, AWS CLI, or Terraform, making them reproducible and version-controlled."
    ],
    code: `# ================================================================
# AMAZON CLOUDWATCH — COMPLETE PRODUCTION REFERENCE
# ================================================================

# ── LOG GROUPS: CREATE AND CONFIGURE RETENTION ─────────────────

# Create a Log Group for your application
aws logs create-log-group \
  --log-group-name /myapp/production/api \
  --tags Environment=production,Service=api

# CRITICAL: Set retention (default is NEVER EXPIRE = you pay forever)
aws logs put-retention-policy \
  --log-group-name /myapp/production/api \
  --retention-in-days 30   # 30 days for production application logs

# For compliance: use 365 or 2555 (7 years) for audit/security logs
aws logs put-retention-policy \
  --log-group-name /myapp/production/audit \
  --retention-in-days 2555

# List log groups and their retention settings
aws logs describe-log-groups \
  --query "logGroups[*].{Name:logGroupName, Retention:retentionInDays, SizeMB:storedBytes}" \
  --output table

# ── PUSHING LOGS FROM YOUR APPLICATION (Python + Boto3) ────────

import boto3
import json
import time

logs = boto3.client("logs", region_name="us-east-1")
LOG_GROUP  = "/myapp/production/api"
LOG_STREAM = "order-service/instance-001"

# Create the log stream (one per application instance)
logs.create_log_stream(
    logGroupName=LOG_GROUP,
    logStreamName=LOG_STREAM,
)

# Send structured JSON log events
# Structured JSON = every field becomes queryable in Logs Insights
def emit_log(level, message, **extra):
    event = {
        "timestamp": int(time.time() * 1000),  # milliseconds
        "message": json.dumps({
            "level":   level,
            "service": "order-service",
            "msg":     message,
            **extra,                            # any extra fields
        }),
    }
    logs.put_log_events(
        logGroupName=LOG_GROUP,
        logStreamName=LOG_STREAM,
        logEvents=[event],
    )

emit_log("INFO",  "order_placed",    order_id="ORD-1234", amount=99.99, user_id="USR-42")
emit_log("ERROR", "payment_failed",  order_id="ORD-1235", error="card_declined", user_id="USR-43")
emit_log("WARN",  "db_slow_query",   query="SELECT * FROM orders", duration_ms=2340)

# ── CUSTOM METRICS — push business metrics from your app ────────

cloudwatch = boto3.client("cloudwatch", region_name="us-east-1")

cloudwatch.put_metric_data(
    Namespace="MyApp/Orders",        # custom namespace
    MetricData=[
        {
            "MetricName": "OrdersPlaced",
            "Value": 1,
            "Unit": "Count",
            "Dimensions": [
                {"Name": "Environment", "Value": "production"},
                {"Name": "Region",      "Value": "us-east-1"},
            ],
        },
        {
            "MetricName": "OrderValueUSD",
            "Value": 99.99,
            "Unit": "None",
            "Dimensions": [{"Name": "Environment", "Value": "production"}],
        },
    ],
)

# ── CLOUDWATCH ALARMS — CLI EXAMPLES ───────────────────────────

# Alarm 1: Lambda error rate > 1% over 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name "lambda-payment-high-error-rate" \
  --alarm-description "Lambda payment processor error rate exceeded 1%" \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=payment-processor \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:oncall-alerts \
  --ok-actions    arn:aws:sns:us-east-1:123456789012:oncall-alerts \
  --treat-missing-data notBreaching

# Alarm 2: EC2 CPU > 80% — triggers auto scaling
aws cloudwatch put-metric-alarm \
  --alarm-name "ec2-api-high-cpu" \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=api-asg \
  --statistic Average \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:xxx

# Alarm 3: Custom business metric — orders drop to 0 for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name "orders-placed-zero-warning" \
  --alarm-description "No orders placed in 5 minutes — possible checkout failure" \
  --namespace MyApp/Orders \
  --metric-name OrdersPlaced \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --treat-missing-data breaching \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:oncall-alerts

# ── LOGS INSIGHTS QUERIES — real operational examples ──────────

# --- Query 1: Count errors per service in the last hour ---
# Run in AWS Console → CloudWatch → Logs Insights
# Select log group: /myapp/production/api

fields @timestamp, level, service, msg, order_id
| filter level = "ERROR"
| stats count(*) as error_count by service
| sort error_count desc
| limit 20

# --- Query 2: P50 / P95 / P99 latency for slow DB queries ---
fields @timestamp, query, duration_ms
| filter msg = "db_slow_query"
| stats
    percentile(duration_ms, 50)  as p50_ms,
    percentile(duration_ms, 95)  as p95_ms,
    percentile(duration_ms, 99)  as p99_ms,
    count(*)                     as query_count
| sort p99_ms desc

# --- Query 3: Failed orders per user (fraud investigation) ---
fields @timestamp, user_id, order_id, error
| filter level = "ERROR" and msg = "payment_failed"
| stats count(*) as failures by user_id
| sort failures desc
| limit 10

# --- Query 4: Lambda cold start analysis ---
# Log group: /aws/lambda/payment-processor
fields @timestamp, @duration, @billedDuration, @initDuration
| filter @initDuration > 0        # only cold starts have initDuration
| stats
    avg(@initDuration)   as avg_cold_start_ms,
    max(@initDuration)   as max_cold_start_ms,
    count(*)             as cold_starts_total
| sort avg_cold_start_ms desc

# Run Logs Insights from CLI
aws logs start-query \
  --log-group-name /myapp/production/api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time   $(date +%s) \
  --query-string 'fields @timestamp, level, msg | filter level = "ERROR" | limit 20'

# Get the results (use queryId from above command)
aws logs get-query-results --query-id <queryId>

# ── TERRAFORM: COMPLETE CLOUDWATCH SETUP ───────────────────────

# Log Group with 30-day retention
resource "aws_cloudwatch_log_group" "api" {
  name              = "/myapp/production/api"
  retention_in_days = 30
  tags = { Environment = "production" }
}

# Alarm on Lambda errors with SNS notification
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "payment-lambda-high-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Payment Lambda error count >= 5 in 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = "payment-processor"
  }

  alarm_actions = [aws_sns_topic.oncall.arn]
  ok_actions    = [aws_sns_topic.oncall.arn]
}

# Dashboard with key widgets
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "myapp-production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0; y = 0; width = 12; height = 6
        properties = {
          title   = "Lambda Invocations & Errors"
          period  = 60
          stat    = "Sum"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "payment-processor"],
            ["AWS/Lambda", "Errors",      "FunctionName", "payment-processor"],
          ]
        }
      },
      {
        type   = "metric"
        x      = 12; y = 0; width = 12; height = 6
        properties = {
          title   = "Orders Placed (Business KPI)"
          period  = 300
          stat    = "Sum"
          metrics = [
            ["MyApp/Orders", "OrdersPlaced", "Environment", "production"],
          ]
        }
      },
      {
        type   = "log"
        x      = 0; y = 6; width = 24; height = 6
        properties = {
          title   = "Recent Errors (Live)"
          region  = "us-east-1"
          query   = "SOURCE '/myapp/production/api' | fields @timestamp, msg, order_id | filter level='ERROR' | sort @timestamp desc | limit 20"
          view    = "table"
        }
      }
    ]
  })
}`,
    practice: "Your e-commerce application is live on AWS. Users are complaining that checkout fails intermittently but your EC2 CPU alarm is not firing. Design a complete CloudWatch observability strategy: what log groups to create, what custom metrics to emit, what alarms to set (including one that catches the checkout issue), and write the Logs Insights query you would run first during the incident.",
    solution: `# ================================================================
# COMPLETE CLOUDWATCH OBSERVABILITY STRATEGY
# ================================================================

# LOG GROUPS (with retention):
# /myapp/production/api          -> 30 days  (API logs)
# /myapp/production/checkout     -> 30 days  (checkout-specific)
# /myapp/production/payments     -> 90 days  (payment audit trail)
# /aws/lambda/payment-processor  -> 30 days  (auto-created by Lambda)
# /myapp/production/audit        -> 2555 days (compliance)

# CUSTOM METRICS TO EMIT (from application code):
# Namespace: MyApp/Checkout
#   CheckoutStarted     (Count, per Environment + Region)
#   CheckoutCompleted   (Count)
#   CheckoutFailed      (Count, + Dimension: FailureReason)
#   CheckoutDurationMs  (Milliseconds — measure P99)
#
# Namespace: MyApp/Payments
#   PaymentAttempted    (Count)
#   PaymentSucceeded    (Count)
#   PaymentFailed       (Count, + Dimension: ErrorCode)

# ALARMS:
# 1. checkout-failure-rate-high
#    Metric: CheckoutFailed / CheckoutStarted > 2%
#    CATCHES THE INTERMITTENT CHECKOUT ISSUE — CPU alarm misses
#    logic bugs. Business metric catches what infra metrics cannot.
#    Period: 60s, EvaluationPeriods: 2
#    Action: SNS → PagerDuty

# 2. checkout-zero-completions
#    Metric: CheckoutCompleted < 1 over 5 minutes
#    treat-missing-data: breaching
#    Catches total checkout outage even if failure metric is 0

# 3. payment-error-spike
#    Metric: PaymentFailed > 10 in 1 minute
#    Action: SNS → on-call + auto-trigger Lambda to pause checkout

# 4. p99-checkout-latency-high
#    Custom metric: CheckoutDurationMs P99 > 5000ms
#    Catches slowdowns before users notice cart abandonment spike

# FIRST LOGS INSIGHTS QUERY TO RUN DURING INCIDENT:
# Log group: /myapp/production/checkout

fields @timestamp, user_id, session_id, step, error_code, duration_ms
| filter level = "ERROR"
| stats
    count(*)   as errors,
    count_distinct(user_id) as affected_users
  by error_code, step
| sort errors desc
| limit 20

# This immediately shows: which step fails (add-to-cart, payment-init,
# confirmation?), which error code, how many users affected.
# From there: narrow to specific step and pull full traces.

# SECOND QUERY: timeline of checkout funnel drop-off
fields @timestamp, step
| filter msg in ["checkout_started", "payment_submitted", "checkout_completed", "checkout_failed"]
| stats count(*) as events by bin(5m), step
| sort @timestamp asc
# Shows exactly WHEN the failure started and which funnel step dropped.`
  },
];
