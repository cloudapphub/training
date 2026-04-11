export const springbootLessons = [
  {
    time: "Hour 1",
    title: "Spring Boot & Aurora PostgreSQL Architecture on EKS",
    concept: [
      "The architecture has three layers: **EKS pods** running Spring Boot, **Aurora PostgreSQL** as the managed database, and **AWS Secrets Manager** handling credentials. The pod connects to Aurora via a JDBC URL, authenticates with credentials fetched from Secrets Manager, and communicates over a private VPC subnet — never over the public internet.",
      "**Aurora PostgreSQL** is a cloud-native relational database compatible with PostgreSQL. It separates compute (instances) from storage (distributed across 3 AZs automatically). You get up to 15 read replicas, automatic failover in under 30 seconds, and storage that auto-scales to 128 TB. The cluster exposes two endpoints: a **writer endpoint** (for reads and writes) and a **reader endpoint** (load-balanced across read replicas).",
      "Spring Boot connects to Aurora using **HikariCP** (the default connection pool). The connection string uses the Aurora cluster endpoint, not individual instance endpoints. This way, during a failover, the DNS endpoint automatically resolves to the new primary — your app reconnects transparently.",
      "**Network path**: the EKS pod (in a private subnet) → VPC internal routing → Aurora security group (port 5432 allowed only from the app security group) → Aurora writer endpoint. No NAT Gateway needed for this traffic — it stays entirely within the VPC.",
    ],
    code: `# --- Terraform: Aurora PostgreSQL Cluster ---
resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "\${local.name_prefix}-aurora"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  database_name          = "appdb"
  master_username        = "app_admin"
  master_password        = random_password.aurora_master.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  storage_encrypted   = true
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"

  # Performance & reliability
  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  copy_tags_to_snapshot     = true
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.environment == "prod" ? 2 : 1
  identifier         = "\${local.name_prefix}-aurora-\${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.db_instance_class  # db.r6g.large
  engine             = aws_rds_cluster.aurora.engine
}

# Security group: only allow from app pods
resource "aws_security_group" "aurora" {
  name_prefix = "\${local.name_prefix}-aurora-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_pods.id]
  }
}

# Outputs for Spring Boot config
output "aurora_writer_endpoint" {
  value = aws_rds_cluster.aurora.endpoint
}
output "aurora_reader_endpoint" {
  value = aws_rds_cluster.aurora.reader_endpoint
}`,
    practice: "Create an Aurora PostgreSQL cluster with encryption, backup retention of 7 days, and a security group that only allows port 5432 from your app's security group.",
    solution: `resource "aws_rds_cluster" "db" {
  cluster_identifier      = "myapp-aurora"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "appdb"
  master_username         = "admin"
  master_password         = random_password.db.result
  storage_encrypted       = true
  backup_retention_period = 7

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.db.name
}

resource "aws_security_group" "db" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

resource "random_password" "db" {
  length  = 32
  special = false
}`,
  },
  {
    time: "Hour 2",
    title: "Secrets Manager — Storing Database Credentials",
    concept: [
      "**Never hardcode database credentials** in application code, Docker images, ConfigMaps, or environment variables. Instead, store them in **AWS Secrets Manager**, which provides encryption at rest (KMS), fine-grained IAM access control, audit logging via CloudTrail, and — critically — **automatic rotation**.",
      "A secrets manager secret for Aurora stores a JSON payload: `{\"username\": \"...\", \"password\": \"...\", \"host\": \"...\", \"port\": 5432, \"dbname\": \"...\"}`. Terraform creates this secret and its initial version. The Spring Boot app fetches the secret at startup using the AWS SDK.",
      "**Access control flow**: the pod runs with a Kubernetes service account → the service account is annotated with an IAM role ARN (IRSA) → the IAM role has a policy allowing `secretsmanager:GetSecretValue` on the specific secret ARN → the pod can read the secret, but nothing else.",
      "**Why Secrets Manager over SSM Parameter Store?** Secrets Manager has built-in rotation with Lambda, cross-account sharing, and replica secrets in other regions. Parameter Store (SecureString) is cheaper for static secrets but lacks native rotation. For database credentials, always use Secrets Manager.",
    ],
    code: `# --- Terraform: Secrets Manager for Aurora credentials ---

resource "random_password" "aurora_master" {
  length  = 32
  special = false  # Aurora doesn't allow some special chars
}

resource "aws_secretsmanager_secret" "aurora_creds" {
  name        = "\${local.name_prefix}/aurora/credentials"
  description = "Aurora PostgreSQL master credentials"
  kms_key_id  = aws_kms_key.secrets.arn  # customer-managed KMS key

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "aurora_creds" {
  secret_id = aws_secretsmanager_secret.aurora_creds.id
  secret_string = jsonencode({
    username = aws_rds_cluster.aurora.master_username
    password = random_password.aurora_master.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.aurora.database_name
  })
}

# IRSA: IAM role for the Spring Boot pod
data "aws_iam_policy_document" "app_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [aws_secretsmanager_secret.aurora_creds.arn]
  }
  # Also allow KMS decrypt since the secret is KMS-encrypted
  statement {
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.secrets.arn]
  }
}

resource "aws_iam_policy" "app_secrets" {
  name   = "\${local.name_prefix}-app-secrets-access"
  policy = data.aws_iam_policy_document.app_secrets.json
}

resource "aws_iam_role_policy_attachment" "app_secrets" {
  role       = aws_iam_role.app_pod.name
  policy_arn = aws_iam_policy.app_secrets.arn
}`,
    practice: "Create a Secrets Manager secret with a KMS customer-managed key and an IAM policy that grants GetSecretValue scoped to that single secret ARN.",
    solution: `resource "aws_kms_key" "secrets" {
  description = "Encrypt app secrets"
}

resource "aws_secretsmanager_secret" "db" {
  name       = "myapp/db-credentials"
  kms_key_id = aws_kms_key.secrets.arn
}

data "aws_iam_policy_document" "read_secret" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.db.arn]
  }
  statement {
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.secrets.arn]
  }
}

resource "aws_iam_policy" "read_secret" {
  name   = "app-read-db-secret"
  policy = data.aws_iam_policy_document.read_secret.json
}`,
  },
  {
    time: "Hour 3",
    title: "Spring Boot — Fetching Secrets & Configuring DataSource",
    concept: [
      "Spring Boot connects to Aurora via a **DataSource** configured with JDBC URL, username, and password. The key decision: how does the app get the credentials? The best approach is **Spring Cloud AWS Secrets Manager integration**, which maps an AWS secret directly into Spring's `Environment` as properties — no custom code needed.",
      "With `spring-cloud-aws-starter-secrets-manager`, you add the secret name to `spring.config.import` and Spring auto-resolves `spring.datasource.url`, `spring.datasource.username`, and `spring.datasource.password` from the JSON fields in your Secrets Manager secret. The mapping is automatic if your JSON keys match Spring property names.",
      "If you prefer **programmatic control**, use the AWS SDK's `SecretsManagerClient` to fetch the secret in a `@Configuration` class and build the `DataSource` bean manually. This gives you full control over caching, fallback behavior, and secret field mapping. The AWS SDK automatically uses the IRSA-projected credentials in the pod.",
      "**HikariCP tuning** for Aurora: set `maximumPoolSize` based on your pod count × connections per pod (Aurora's `max_connections` depends on instance class). Set `connectionTimeout` to 30s, `idleTimeout` to 10 minutes, `maxLifetime` to 30 minutes (under Aurora's `wait_timeout`). Enable `leakDetectionThreshold` in dev.",
    ],
    code: `// --- build.gradle (key dependencies) ---
// implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
// implementation 'org.postgresql:postgresql'
// implementation 'io.awspring.cloud:spring-cloud-aws-starter-secrets-manager:3.1.0'
// implementation 'software.amazon.awssdk:secretsmanager'

// --- application.yml ---
// spring:
//   config:
//     import: aws-secretsmanager:myapp-prod/aurora/credentials
//   datasource:
//     url: jdbc:postgresql://\${host}:\${port}/\${dbname}
//     username: \${username}
//     password: \${password}
//     hikari:
//       maximum-pool-size: 10
//       connection-timeout: 30000
//       idle-timeout: 600000
//       max-lifetime: 1800000
//       leak-detection-threshold: 60000
//   jpa:
//     hibernate:
//       ddl-auto: validate
//     properties:
//       hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect

// --- Programmatic approach: custom DataSource from Secrets Manager ---
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource(SecretsManagerClient smClient) throws Exception {
        // Fetch the secret — IRSA provides credentials automatically
        String secretJson = smClient.getSecretValue(
            GetSecretValueRequest.builder()
                .secretId("myapp-prod/aurora/credentials")
                .build()
        ).secretString();

        JsonNode secret = new ObjectMapper().readTree(secretJson);

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(String.format("jdbc:postgresql://%s:%s/%s",
            secret.get("host").asText(),
            secret.get("port").asInt(),
            secret.get("dbname").asText()
        ));
        ds.setUsername(secret.get("username").asText());
        ds.setPassword(secret.get("password").asText());

        // HikariCP tuning
        ds.setMaximumPoolSize(10);
        ds.setConnectionTimeout(30_000);
        ds.setIdleTimeout(600_000);
        ds.setMaxLifetime(1_800_000);

        return ds;
    }

    @Bean
    public SecretsManagerClient secretsManagerClient() {
        return SecretsManagerClient.create(); // uses IRSA credentials
    }
}`,
    practice: "Write a Spring Boot @Configuration class that fetches Aurora credentials from Secrets Manager and builds a HikariDataSource with proper pool tuning.",
    solution: `@Configuration
public class DataSourceConfig {

    @Value("\${aws.secret.name:myapp/db-credentials}")
    private String secretName;

    @Bean
    public DataSource dataSource() throws Exception {
        SecretsManagerClient client = SecretsManagerClient.create();
        String json = client.getSecretValue(
            GetSecretValueRequest.builder()
                .secretId(secretName).build()
        ).secretString();

        JsonNode s = new ObjectMapper().readTree(json);

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://" +
            s.get("host").asText() + ":" +
            s.get("port").asInt() + "/" +
            s.get("dbname").asText());
        ds.setUsername(s.get("username").asText());
        ds.setPassword(s.get("password").asText());
        ds.setMaximumPoolSize(10);
        ds.setMaxLifetime(1_800_000);
        return ds;
    }
}`,
  },
  {
    time: "Hour 4",
    title: "Automatic Credential Rotation with Lambda",
    concept: [
      "**Credential rotation** replaces database passwords on a schedule without application downtime. Secrets Manager has built-in support: you configure a rotation Lambda, set a rotation schedule (e.g., every 30 days), and Secrets Manager orchestrates a 4-step process: `createSecret` → `setSecret` → `testSecret` → `finishSecret`.",
      "The **rotation Lambda** receives events from Secrets Manager and performs the actual password change. For Aurora, AWS provides a **managed rotation Lambda** (`SecretsManagerRDSPostgreSQLRotationSingleUser`) — you don't write any code. It generates a new password, calls `ALTER USER` on Aurora, and updates the secret version.",
      "**Single-user vs multi-user rotation**: Single-user rotation changes the password of the same user — there's a brief moment during rotation when the old password is invalid but the app might still be using it. **Multi-user rotation** (alternating users) creates two database users and alternates between them, so one is always valid. For production, use multi-user.",
      "**Spring Boot handles rotation transparently** if you set `maxLifetime` on HikariCP to be shorter than the rotation period. When a connection expires and is replaced, HikariCP fetches fresh credentials. For immediate rotation response, implement a `SecretsManagerRotationEventHandler` that clears the connection pool when a rotation event fires.",
    ],
    code: `# --- Terraform: Automatic rotation with managed Lambda ---

resource "aws_secretsmanager_secret_rotation" "aurora_creds" {
  secret_id           = aws_secretsmanager_secret.aurora_creds.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# Managed rotation Lambda for Aurora PostgreSQL
resource "aws_lambda_function" "rotate_secret" {
  function_name = "\${local.name_prefix}-rotate-aurora-secret"
  filename      = data.archive_file.rotation_lambda.output_path
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  role          = aws_iam_role.rotation_lambda.arn

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.rotation_lambda.id]
  }

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.\${var.aws_region}.amazonaws.com"
    }
  }
}

# Lambda SG must reach Aurora and Secrets Manager
resource "aws_security_group" "rotation_lambda" {
  vpc_id = aws_vpc.main.id

  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.aurora.id]
  }
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # for Secrets Manager API
  }
}

# Allow rotation Lambda to access Aurora
resource "aws_security_group_rule" "aurora_from_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.rotation_lambda.id
}

# IAM role for rotation Lambda
data "aws_iam_policy_document" "rotation_lambda" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:UpdateSecretVersionStage",
      "secretsmanager:DescribeSecret",
    ]
    resources = [aws_secretsmanager_secret.aurora_creds.arn]
  }
}`,
    practice: "Configure Secrets Manager rotation with a 30-day schedule and create the security group rules that allow the rotation Lambda to reach both Aurora (port 5432) and the Secrets Manager API (port 443).",
    solution: `resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_lambda_function.rotator.arn
  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_security_group" "rotator" {
  vpc_id = aws_vpc.main.id

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.aurora.id]
  }
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "aurora_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.rotator.id
}`,
  },
  {
    time: "Hour 5",
    title: "Spring Boot JPA & Repository Pattern on Aurora",
    concept: [
      "With the connection established, Spring Data JPA provides the **repository pattern** — interfaces that Spring implements automatically. Define an `@Entity` class mapping to a database table, create a `JpaRepository` interface, and Spring generates all CRUD operations plus query derivation from method names.",
      "**Entity mapping**: use `@Entity`, `@Table(name = ...)`, `@Id`, `@GeneratedValue` for the primary key, and `@Column` for field mappings. For Aurora PostgreSQL, use `GenerationType.IDENTITY` (PostgreSQL SERIAL) or `GenerationType.SEQUENCE` with `@SequenceGenerator` for better batch insert performance.",
      "**Transactions**: annotate service methods with `@Transactional`. Spring wraps the method in a database transaction — if any exception is thrown, the entire transaction rolls back. Use `@Transactional(readOnly = true)` for read-only methods to hint the connection pool and Aurora to use the reader endpoint.",
      "**Read/write splitting**: Aurora provides a reader endpoint for read replicas. Configure two DataSources — one for the writer endpoint, one for the reader — and use Spring's `@Transactional(readOnly = true)` to route reads to replicas. This reduces load on the primary instance significantly.",
    ],
    code: `// --- Entity ---
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    // getters, setters omitted for brevity
}

// --- Repository ---
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<Order> findByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.amount > :minAmount AND o.status = :status")
    List<Order> findLargeOrdersByStatus(java.math.BigDecimal minAmount, OrderStatus status);
}

// --- Service with transactions ---
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository repo;

    public OrderService(OrderRepository repo) { this.repo = repo; }

    @Transactional
    public Order createOrder(String customerId, java.math.BigDecimal amount) {
        Order order = new Order();
        order.setCustomerId(customerId);
        order.setAmount(amount);
        return repo.save(order);
    }

    @Transactional(readOnly = true)  // routes to read replica
    public List<Order> getOrdersForCustomer(String customerId) {
        return repo.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public Order fulfillOrder(Long orderId) {
        Order order = repo.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.setStatus(OrderStatus.FULFILLED);
        return repo.save(order);
    }
}`,
    practice: "Create a JPA Entity for a 'Product' table with id, name, price, and createdAt fields. Write a JpaRepository with a custom query to find products above a given price.",
    solution: `@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private java.math.BigDecimal price;

    @Column(updatable = false)
    private Instant createdAt = Instant.now();
}

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByPriceGreaterThanOrderByPriceDesc(
        java.math.BigDecimal minPrice
    );

    @Query("SELECT p FROM Product p WHERE p.name LIKE %:term%")
    List<Product> searchByName(String term);
}`,
  },
  {
    time: "Hour 6",
    title: "Database Migrations with Flyway",
    concept: [
      "**Never use `ddl-auto: update` in production.** Hibernate can create and alter tables, but it can't drop columns, rename things, or do data migrations. Use **Flyway** (or Liquibase) for versioned, repeatable database schema migrations that run automatically on application startup.",
      "Flyway migrations are SQL files named `V1__create_orders_table.sql`, `V2__add_status_column.sql`, etc. Flyway tracks which migrations have been applied in a `flyway_schema_history` table. On startup, Spring Boot auto-detects Flyway on the classpath and runs any pending migrations before the application starts serving traffic.",
      "**Migration best practices for Aurora**: always use `IF NOT EXISTS` and `IF EXISTS` guards. Never lock large tables with `ALTER TABLE ... ADD COLUMN` with a default on PostgreSQL < 11 (Aurora 15+ handles this fast). Test migrations against a clone of production data using Aurora cloning (instant, zero-cost copy).",
      "**In EKS**, database migrations must handle **concurrent pod startups**. Flyway uses a database advisory lock by default — only one pod runs migrations, the rest wait. This is safe for rolling deployments. For blue-green deployments, run migrations as a **Kubernetes Job** before deploying the new version.",
    ],
    code: `// --- build.gradle ---
// implementation 'org.flywaydb:flyway-core'
// implementation 'org.flywaydb:flyway-database-postgresql'

// --- application.yml ---
// spring:
//   flyway:
//     enabled: true
//     locations: classpath:db/migration
//     baseline-on-migrate: true    # for existing databases
//     validate-migration-naming: true
//   jpa:
//     hibernate:
//       ddl-auto: validate         # NEVER 'update' in prod

// --- src/main/resources/db/migration/V1__create_orders_table.sql ---
CREATE TABLE IF NOT EXISTS orders (
    id          BIGSERIAL    PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer
    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

// --- V2__add_shipping_address.sql ---
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address TEXT;

// --- V3__create_products_table.sql ---
CREATE TABLE IF NOT EXISTS products (
    id         BIGSERIAL     PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

// --- Kubernetes Job for pre-deploy migration (optional) ---
// apiVersion: batch/v1
// kind: Job
// metadata:
//   name: db-migrate
// spec:
//   template:
//     spec:
//       serviceAccountName: api-service  # IRSA for Secrets Manager
//       containers:
//       - name: migrate
//         image: 123456.dkr.ecr.us-east-1.amazonaws.com/myapp-api:v2.0
//         command: ["java", "-jar", "app.jar", "--spring.flyway.enabled=true",
//                   "--spring.main.web-application-type=none"]
//       restartPolicy: Never`,
    practice: "Write Flyway migration files V1 (create users table), V2 (add email column), and configure application.yml to use Flyway with validate mode.",
    solution: `-- V1__create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    full_name  VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- V2__add_email.sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

-- application.yml
-- spring:
--   flyway:
--     enabled: true
--     locations: classpath:db/migration
--   jpa:
--     hibernate:
--       ddl-auto: validate`,
  },
  {
    time: "Hour 7",
    title: "Kubernetes Deployment & Health Checks",
    concept: [
      "The Kubernetes **Deployment** manifest defines how your Spring Boot pods run: the container image from ECR, CPU/memory requests and limits, environment variables, the IRSA service account, and health check probes. Spring Boot Actuator provides the `/actuator/health` endpoints that Kubernetes probes call.",
      "**Three probe types**: `startupProbe` (is the app still starting? — prevents premature kills during slow JVM warmup), `livenessProbe` (is the app alive? — restarts the pod if it hangs), and `readinessProbe` (is the app ready for traffic? — removes the pod from the Service endpoint if unready). Spring Boot Actuator's `/actuator/health/liveness` and `/actuator/health/readiness` endpoints map directly.",
      "**Resource requests and limits**: requests guarantee CPU/memory to the pod; limits cap it. For Spring Boot (JVM), set memory request = limit (JVM heap doesn't give back memory). Set `-Xmx` to ~75% of the memory limit to leave room for non-heap memory (metaspace, threads, NIO buffers).",
      "**ConfigMaps** hold non-sensitive config (feature flags, timeout values, read endpoint URL). **External Secrets Operator** syncs the Secrets Manager secret into a Kubernetes Secret, which is mounted as an environment variable or volume. This way, the pod gets both config and secrets via standard Kubernetes mechanisms.",
    ],
    code: `# --- Kubernetes manifests ---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: app
spec:
  replicas: 3
  selector:
    matchLabels: { app: api-service }
  template:
    metadata:
      labels: { app: api-service }
    spec:
      serviceAccountName: api-service  # IRSA-annotated

      containers:
      - name: api
        image: 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp/api:v1.5.0
        ports:
        - containerPort: 8080

        # JVM tuning — 75% of memory limit for heap
        env:
        - name: JAVA_OPTS
          value: "-Xms512m -Xmx768m -XX:+UseG1GC"
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: AWS_SECRET_NAME
          value: "myapp-prod/aurora/credentials"

        envFrom:
        - configMapRef:
            name: api-config

        resources:
          requests: { cpu: "500m",  memory: "1Gi" }
          limits:   { cpu: "1000m", memory: "1Gi" }  # memory request = limit

        # Spring Boot Actuator probes
        startupProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 15
          periodSeconds: 5
          failureThreshold: 20   # 15 + (5*20) = 115s max startup

        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 10
          failureThreshold: 3

        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          periodSeconds: 5
          failureThreshold: 3

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: app
data:
  AURORA_READER_ENDPOINT: "myapp-aurora.cluster-ro-xxx.us-east-1.rds.amazonaws.com"
  APP_FEATURE_NEW_CHECKOUT: "true"`,
    practice: "Write a Kubernetes Deployment for a Spring Boot app with proper JVM memory settings, all three health check probe types, and IRSA service account annotation.",
    solution: `# Service Account with IRSA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-service
  namespace: app
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/myapp-api-pod

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: app
spec:
  replicas: 2
  selector:
    matchLabels: { app: api-service }
  template:
    spec:
      serviceAccountName: api-service
      containers:
      - name: api
        image: 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp/api:v1.0
        env:
        - name: JAVA_OPTS
          value: "-Xmx768m"
        resources:
          requests: { cpu: "500m", memory: "1Gi" }
          limits:   { memory: "1Gi" }
        startupProbe:
          httpGet: { path: /actuator/health, port: 8080 }
          failureThreshold: 20
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }`,
  },
  {
    time: "Hour 8",
    title: "Monitoring, Connection Resilience & Production Checklist",
    concept: [
      "**Database health in Actuator**: Spring Boot Actuator auto-detects the DataSource and includes a DB health indicator at `/actuator/health`. It runs `SELECT 1` against Aurora to verify connectivity. In production, set `management.endpoint.health.show-details: when-authorized` so health details aren't publicly exposed.",
      "**Connection resilience**: Aurora failovers take ~30s. During failover, the DNS endpoint updates but existing TCP connections break. Configure HikariCP's `connectionTestQuery` or `connectionInitSql`, set `validationTimeout` to 5s, and enable `spring.datasource.hikari.keepaliveTime` to 300000 (5 min) so stale connections are proactively recycled.",
      "**Observability stack**: export Spring Boot Micrometer metrics to **CloudWatch** or **Prometheus**. Key metrics to alarm on: `hikaricp_connections_active`, `hikaricp_connections_timeout_total`, `hikaricp_connections_usage_seconds`, `db_query_duration_seconds`, and Aurora's `DatabaseConnections` and `CPUUtilization` CloudWatch metrics.",
      "**Production checklist**: ✅ Secrets in SM with rotation enabled ✅ IRSA for pod-level permissions ✅ Security groups locked down (app→Aurora only) ✅ Encryption at rest (Aurora + Secrets Manager) ✅ Encryption in transit (SSL/TLS for JDBC) ✅ Flyway migrations validated ✅ HikariCP tuned for pod count ✅ All three K8s probes configured ✅ CloudWatch alarms on 5xx and connection pool exhaustion.",
    ],
    code: `// --- application-prod.yml — production configuration ---
// spring:
//   datasource:
//     url: jdbc:postgresql://\${host}:\${port}/\${dbname}?sslmode=require&sslrootcert=/app/certs/rds-ca.pem
//     hikari:
//       maximum-pool-size: 10
//       connection-timeout: 30000
//       validation-timeout: 5000
//       idle-timeout: 600000
//       max-lifetime: 1800000
//       keepalive-time: 300000
//       connection-test-query: SELECT 1
//
//   jpa:
//     open-in-view: false    # disable OSIV anti-pattern
//     hibernate:
//       ddl-auto: validate
//
// management:
//   endpoints:
//     web:
//       exposure:
//         include: health,info,metrics,prometheus
//   endpoint:
//     health:
//       show-details: when-authorized
//       probes:
//         enabled: true    # enables /health/liveness and /health/readiness
//   metrics:
//     export:
//       cloudwatch:
//         namespace: MyApp
//         enabled: true

// --- SSL/TLS enforcement for Aurora ---
@Configuration
public class AuroraSslConfig {

    @Bean
    public DataSourceCustomizer sslCustomizer() {
        return (ds) -> {
            if (ds instanceof HikariDataSource hikari) {
                String url = hikari.getJdbcUrl();
                if (!url.contains("sslmode")) {
                    hikari.setJdbcUrl(url + "?sslmode=require");
                }
                // Connection init: verify we're on SSL
                hikari.setConnectionInitSql(
                    "SELECT CASE WHEN ssl THEN 1 ELSE 0 END FROM pg_stat_ssl " +
                    "WHERE pid = pg_backend_pid()"
                );
            }
        };
    }
}

// --- Health check customization ---
@Component
public class AuroraHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public AuroraHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (var conn = dataSource.getConnection();
             var stmt = conn.createStatement();
             var rs = stmt.executeQuery("SELECT version(), current_database()")) {
            rs.next();
            return Health.up()
                .withDetail("database", rs.getString(2))
                .withDetail("version", rs.getString(1))
                .build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}`,
    practice: "Write a production application.yml with SSL-enforced JDBC URL, tuned HikariCP settings, Actuator health probes enabled, and Micrometer metrics exporting to CloudWatch.",
    solution: `# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://aurora-endpoint:5432/appdb?sslmode=require
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000
      max-lifetime: 1800000
      keepalive-time: 300000
      connection-test-query: SELECT 1

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false

management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
  metrics:
    export:
      cloudwatch:
        namespace: MyApp
        enabled: true`,
  },
  {
    time: "Homework Project",
    title: "Build & Deploy an Order Management API on EKS",
    concept: [
      "**Project Goal**: you will build an Order Management REST API with Spring Boot, connect it to Aurora PostgreSQL, and deploy it to AWS EKS. The final deployed system will have a `/api/orders` CRUD endpoint running securely on Kubernetes, reading to and writing from an Aurora database, with credentials automatically rotated via AWS Secrets Manager. This is the gold standard for enterprise Java applications on AWS.",
      "**Step 1 — Generate the Spring Boot App.** Go to `start.spring.io` (or use the Spring CLI). Create a Java 21, Maven project. Add the following dependencies: **Spring Web** (for REST endpoints), **Spring Data JPA** (for ORM), **PostgreSQL Driver** (to talk to the DB), **Flyway** (for database migrations), and **Spring Boot Actuator** (for Kubernetes health checks). Download and extract it into a folder named `orders-api`.",
      "**Step 2 — Write the Application Code.** In `src/main/java`, create a JPA Entity called `Order` with `id`, `customerId`, `amount`, and `status`. Create a Spring Data `OrderRepository` interface. Create an `OrderService` class annotated with `@Service` to handle business logic (like checking inventory or calculating tax). Finally, create an `OrderController` annotated with `@RestController` that maps `POST /api/orders` and `GET /api/orders/{id}` to your service methods.",
      "**Step 3 — Write the Database Migration.** Never let Hibernate autogenerate your production schema. In `src/main/resources/db/migration`, create a file named `V1__create_orders_table.sql`. Write the raw SQL statement: `CREATE TABLE orders (id BIGSERIAL PRIMARY KEY, customer_id VARCHAR(50) NOT NULL, amount DECIMAL(10,2), status VARCHAR(20));`. Flyway will run this script automatically when Spring Boot starts up.",
      "**Step 4 — Test Locally with Docker.** You need a Postgres database to run the app. Spin one up quickly: `docker run -d -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=localdev -e POSTGRES_DB=appdb postgres:15`. In your `application-dev.yml`, configure the datasource URL to `jdbc:postgresql://localhost:5432/appdb`. Run `./mvnw spring-boot:run`. Test your API: `curl -X POST localhost:8080/api/orders -H 'Content-Type: application/json' -d '{\"customerId\":\"C123\", \"amount\":50.00}'`.",
      "**Step 5 — Write a Multi-Stage Dockerfile.** To run on Kubernetes, you need a container image. Create a `Dockerfile`. The first stage (`FROM maven:3.9-eclipse-temurin-21 AS build`) copies the `pom.xml`, downloads dependencies, and runs `mvn package -DskipTests`. The second stage (`FROM eclipse-temurin:21-jre-alpine`) copies the built `.jar` file from the first stage and sets the `ENTRYPOINT`. This results in a small, secure image containing only the JRE and your app.",
      "**Step 6 — Provision Infrastructure with Terraform.** Create an `infra/` folder. Write a Terraform script that uses the `terraform-aws-modules` to provision a **VPC** (2 AZs, NAT gateway) and an **EKS Cluster** with managed node groups. Create an **Aurora PostgreSQL** cluster in the private subnets. Create an **AWS Secrets Manager** secret to hold the database master password. Create an IAM Role for Service Accounts (IRSA) that grants read access to this secret. Run `terraform apply`.",
      "**Step 7 — Configure the Production Profile.** In your Spring app, create `application-prod.yml`. Instead of hardcoding the database password, configure it to read from Secrets Manager at runtime. The AWS SDK (or AWS Secrets Manager JDBC Library) will fetch the credentials when HikariCP establishes the connection pool. Set the datasource URL to point to the Aurora cluster endpoint.",
      "**Step 8 — Push and Deploy to Kubernetes.** Log into AWS ECR and push your Docker image. Create a `k8s/` folder. Write a **Deployment** that references your ECR image, passes the environment variable `SPRING_PROFILES_ACTIVE=prod`, specifies resource requests/limits, configures the `serviceAccountName` (to attach the IRSA permissions), and sets readiness/liveness probes pointing to `/actuator/health`. Write a **Service** and an **Ingress** configured for the AWS Load Balancer Controller. Apply with `kubectl apply -f k8s/`.",
      "**Step 9 — Verify the E2E Flow.** Once the ALB provisions, find its DNS name using `kubectl get ingress`. Send a POST request to create an order. Connect to the Aurora database from a bastion host or via SSM, and query the `orders` table to verify the record was saved. Finally, manually rotate the secret in AWS Secrets Manager and verify that Spring Boot (if using the AWS JDBC wrapper) or your external secrets operator seamless picks up the new credentials without downtime.",
    ],
    code: `/* === Spring Boot Application (OrderController.java) === */
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    private final OrderService service;
    
    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest req) {
        Order order = service.createOrder(req.customerId(), req.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}

public record CreateOrderRequest(String customerId, java.math.BigDecimal amount) {}`,
    infraCode: `# === Terraform Infrastructure (main.tf) ===
module "vpc" {
  source             = "terraform-aws-modules/vpc/aws"
  name               = "orders-vpc"
  cidr               = "10.0.0.0/16"
  azs                = ["us-east-1a", "us-east-1b"]
  private_subnets    = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets     = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "orders-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  eks_managed_node_groups = {
    workers = {
      instance_types = ["t3.large"]
      min_size       = 2
      max_size       = 4
    }
  }
}


# === Multi-Stage Dockerfile ===
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx768m", "-jar", "app.jar"]


# === Kubernetes Deployment (k8s/deployment.yaml) ===
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orders-api
  template:
    metadata:
      labels:
        app: orders-api
    spec:
      serviceAccountName: orders-api-sa
      containers:
      - name: api
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/orders-api:v1.0
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: AWS_SECRET_NAME
          value: "orders-prod/aurora/credentials"
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 15
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30`,
    practice: "Build the complete Order Management API: create the Spring Boot app with CRUD, write Flyway migrations, containerize with Docker, provision AWS infrastructure with Terraform, and deploy to EKS. Test all endpoints via curl.",
    solution: `# Full deployment checklist:
# 1. spring init --dependencies=web,data-jpa,postgresql,flyway,actuator orders-api
# 2. Implement Order entity, repository, service, controller
# 3. Write V1__create_orders.sql migration
# 4. Test locally: docker run -d postgres:15 && mvn spring-boot:run
# 5. curl -X POST localhost:8080/api/orders -d '{"customerId":"C1","amount":50}'
# 6. terraform init && terraform apply  (VPC, EKS, Aurora, SM, ECR)
# 7. docker build -t orders-api . && docker push <ECR_URL>/orders-api:v1.0
# 8. kubectl apply -f k8s/  (SA, Deployment, Service, Ingress)
# 9. Verify: curl -X POST https://ALB_DNS/api/orders ...
# 10. Check Aurora data: psql -h aurora-endpoint -U admin -d appdb
# 11. Verify secrets rotation: aws secretsmanager rotate-secret --secret-id ...
# 12. Monitor: kubectl logs -f deploy/orders-api && CloudWatch dashboard`,
  },
];
