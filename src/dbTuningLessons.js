export const dbTuningLessons = [
  {
    time: "Session 1",
    title: "HikariCP Connection Pool — Architecture & Configuration",
    concept: [
      "## Q: What is a connection pool and why does Spring Boot need one?",

      "**A:** A database connection is expensive to create — it involves TCP handshake, TLS negotiation (if encrypted), PostgreSQL authentication, and session initialization. Without a pool, every HTTP request opens a new connection and closes it afterward. At 200 concurrent requests, that's 200 connection open/close cycles per second. A **connection pool** (HikariCP in Spring Boot) pre-creates a set of connections at startup and reuses them across requests. A thread borrows a connection, executes queries, and returns it to the pool — no creation overhead.",

      "**HikariCP** is the default and fastest JDBC connection pool in Spring Boot. It's included automatically via `spring-boot-starter-data-jpa` or `spring-boot-starter-jdbc`. HikariCP uses a lock-free design with `ConcurrentBag` for connection management, achieving sub-microsecond borrow times.",

      "## Q: What are the critical HikariCP configuration properties?",

      "**`maximum-pool-size`** (default: 10) — The maximum number of connections the pool can hold (active + idle). This is the MOST important property. Too low → threads wait for connections → request timeouts. Too high → overwhelms the database with connections → context switching overhead → diminishing returns.",

      "**`minimum-idle`** (default: same as max) — The minimum number of idle connections maintained in the pool. HikariCP recommends setting this EQUAL to `maximum-pool-size` for best performance (avoids the overhead of creating/destroying connections dynamically). Only set lower if your database has strict connection limits.",

      "**`connection-timeout`** (default: 30000ms / 30s) — How long a thread waits for a connection from the pool before throwing `SQLTransientConnectionException`. In production, set this to 5-10 seconds. If threads wait longer, the request is likely already too slow for the user.",

      "**`max-lifetime`** (default: 1800000ms / 30min) — Maximum lifetime of a connection in the pool. Must be set LESS than the database's `wait_timeout` (PostgreSQL: `idle_in_transaction_session_timeout`). HikariCP retires connections before this limit to avoid using stale connections. Set to a few minutes less than your DB timeout.",

      "**`idle-timeout`** (default: 600000ms / 10min) — How long a connection can sit idle before being removed. Only applies when `minimum-idle` < `maximum-pool-size`. If they're equal, this setting has no effect.",

      "**`leak-detection-threshold`** (default: 0 / disabled) — If a connection is borrowed for longer than this value (in milliseconds), HikariCP logs a warning with a stack trace showing where the connection was borrowed. Set to 30000-60000 in dev/staging to catch connection leaks.",

      "## Q: How do I calculate the right pool size?",

      "**Formula:** `pool_size = (core_count * 2) + effective_spindle_count`. For SSDs (no spindles), a good starting point is `core_count * 2`. A 4-core server → 8-10 connections. This formula comes from PostgreSQL benchmarks showing that a small pool outperforms a large one due to reduced context switching and lock contention.",

      "**On-Prem:** Your DB server has a fixed CPU count. If you have 3 app instances each with a pool of 10, that's 30 connections to your PostgreSQL server. PostgreSQL's `max_connections` (default: 100) must accommodate all pools + admin connections + replication slots.",

      "**AWS RDS/Aurora:** Instance class determines max connections. `db.t3.micro` → ~87 max connections. `db.r6g.large` → ~1000+. Formula: `LEAST({DBInstanceClassMemory/9531392}, 5000)`. Check with `SHOW max_connections;`. Aurora Serverless v2 scales connections automatically but has ACU-based limits.",
    ],
    code: `# ============================================================
# application.yml — HikariCP Production Configuration
# ============================================================
spring:
  datasource:
    # --- On-Prem PostgreSQL ---
    url: jdbc:postgresql://db-server:5432/myapp
    username: app_user
    password: \${DB_PASSWORD}

    # --- AWS RDS ---
    # url: jdbc:postgresql://mydb.cluster-xxx.us-east-1.rds.amazonaws.com:5432/myapp
    # username: \${DB_USERNAME}
    # password: \${DB_PASSWORD}

    hikari:
      maximum-pool-size: 10            # core_count * 2
      minimum-idle: 10                 # Keep equal to max for best perf
      connection-timeout: 5000         # 5s — fail fast
      max-lifetime: 1740000            # 29min (less than PG idle timeout)
      idle-timeout: 600000             # 10min
      leak-detection-threshold: 30000  # 30s — catch leaks in dev
      pool-name: MyApp-Pool
      connection-test-query: SELECT 1  # Validation query (optional with PG)

      # Connection init SQL (runs on every new connection)
      connection-init-sql: SET search_path TO myapp_schema,public

      # PostgreSQL-specific driver properties
      data-source-properties:
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true

# ============================================================
# Java — Monitoring HikariCP at Runtime
# ============================================================
# @Component
# public class PoolMetricsLogger {
#     private final HikariDataSource ds;
#
#     public PoolMetricsLogger(DataSource dataSource) {
#         this.ds = (HikariDataSource) dataSource;
#     }
#
#     @Scheduled(fixedRate = 30000) // Every 30 seconds
#     public void logPoolStats() {
#         HikariPoolMXBean pool = ds.getHikariPoolMXBean();
#         log.info("Pool [{}]: active={}, idle={}, waiting={}, total={}",
#             ds.getPoolName(),
#             pool.getActiveConnections(),
#             pool.getIdleConnections(),
#             pool.getThreadsAwaitingConnection(),
#             pool.getTotalConnections());
#     }
# }`,
    practice: "Your app has 4 CPU cores and connects to an RDS db.r6g.large instance. Three app pods run in Kubernetes. Calculate the ideal pool size per pod and verify the total won't exceed RDS max_connections.",
    solution: `# Pool size per pod: core_count * 2 = 4 * 2 = 8 (conservative: 10)
# Total connections: 3 pods x 10 = 30
# RDS db.r6g.large max_connections ~ 1000+
# 30 << 1000, so this is safe. Leave headroom for:
#   - Admin connections (pgAdmin, migrations)
#   - Read replicas
#   - Connection spikes during deployments
#
# application.yml per pod:
# spring.datasource.hikari.maximum-pool-size: 10
# spring.datasource.hikari.minimum-idle: 10`
  },
  {
    time: "Session 2",
    title: "Connection Pool Troubleshooting & Scaling",
    concept: [
      "## Q: My app throws 'Connection is not available, request timed out after 30000ms'. What's wrong?",

      "**A:** This is HikariCP's `SQLTransientConnectionException`. It means all connections in the pool are in use and no connection became available within `connection-timeout`. Root causes: (1) **Pool too small** — increase `maximum-pool-size`. (2) **Long-running queries** — a slow query holds a connection, blocking other threads. (3) **Connection leak** — code borrows a connection but never returns it (missing `try-with-resources`, unclosed `EntityManager`, or `@Transactional` method that hangs). (4) **Database is overwhelmed** — PostgreSQL can't keep up with query load.",

      "**Diagnosis Steps:** Enable `leak-detection-threshold: 10000` to find leaks. Check `HikariPoolMXBean.getThreadsAwaitingConnection()` — if consistently > 0, the pool is saturated. Run `SELECT count(*) FROM pg_stat_activity WHERE state = 'active';` on PostgreSQL to see how many connections are actually executing queries. If most are idle, the leak is in your app code.",

      "## Q: How do I detect and fix connection leaks?",

      "**A:** A connection leak occurs when a connection is borrowed from the pool but never returned. Common causes: (1) **Missing @Transactional** — JPA operations without `@Transactional` may not properly release connections. (2) **Exception in manual JDBC** — if you use `DataSource.getConnection()` without `try-with-resources`, an exception skips the `close()` call. (3) **Long-lived EntityManager** — extended persistence context holds connections. (4) **Infinite loops or deadlocks** in `@Transactional` methods.",

      "**Fix:** Always use `@Transactional` or `try-with-resources`. Set `leak-detection-threshold: 15000` in dev — HikariCP logs a full stack trace showing exactly where the connection was borrowed. In production, monitor `active_connections` via Micrometer/Actuator — if it grows monotonically without decreasing, you have a leak.",

      "## Q: How does connection pooling differ between On-Prem and AWS?",

      "**On-Prem PostgreSQL:** You control `max_connections` in `postgresql.conf`. Each connection uses ~5-10MB of RAM. Setting `max_connections=500` on a 16GB server leaves less memory for shared_buffers and work_mem. Use PgBouncer as a connection proxy between your apps and PostgreSQL for connection multiplexing — 1000 app connections can share 50 actual database connections.",

      "**AWS RDS:** `max_connections` is set by the parameter group based on instance class. You can override it but risk OOM kills. RDS Proxy provides managed PgBouncer-like multiplexing: deploy an RDS Proxy endpoint, point your app to it, and it handles connection pooling at the infrastructure level. Benefits: connection reuse across Lambda/ECS tasks, failover pinning, IAM authentication.",

      "**AWS Aurora:** Aurora has a different connection model. Writer endpoint handles writes; reader endpoint load-balances across read replicas. Aurora Serverless v2 scales connections with ACUs. Use `spring.datasource.url` for the writer endpoint and a separate `DataSource` bean for the reader endpoint. Aurora can handle more connections than standard RDS because of its distributed storage architecture.",

      "## Q: How do I scale connections across multiple app instances in Kubernetes?",

      "**A:** With N pods each having a pool of size P, total connections = N * P. As you scale pods (HPA), total connections grow linearly. If your database has a hard limit (e.g., RDS db.t3.medium ~ 160 connections), you MUST set pod pool size considering max replicas. Formula: `pool_per_pod = (db_max_connections - admin_reserve) / max_pod_count`. Example: (160 - 10) / 10 pods = 15 per pod.",

      "**Use RDS Proxy or PgBouncer for elastic scaling.** They multiplex hundreds of app connections into a smaller number of actual database connections. This decouples app scaling from database connection limits. With RDS Proxy: app → RDS Proxy (handles 1000+ connections) → RDS (uses 50 actual connections).",
    ],
    code: `# ============================================================
# Diagnosing Connection Pool Issues
# ============================================================

# 1. Check active connections on PostgreSQL
SELECT pid, usename, application_name, client_addr, state,
       query, age(clock_timestamp(), query_start) AS query_age
FROM pg_stat_activity
WHERE datname = 'myapp'
ORDER BY query_start;

# 2. Find long-running queries (> 30 seconds)
SELECT pid, usename, state,
       age(clock_timestamp(), query_start) AS duration,
       left(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - interval '30 seconds'
ORDER BY query_start;

# 3. Kill a stuck query
SELECT pg_cancel_backend(12345);    -- Graceful cancel
SELECT pg_terminate_backend(12345); -- Force kill

# ============================================================
# Spring Boot — Exposing Pool Metrics via Actuator
# ============================================================
# application.yml:
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info
  metrics:
    tags:
      application: myapp

# GET /actuator/metrics/hikaricp.connections.active
# GET /actuator/metrics/hikaricp.connections.idle
# GET /actuator/metrics/hikaricp.connections.pending
# GET /actuator/metrics/hikaricp.connections.timeout

# ============================================================
# AWS RDS Proxy — Spring Boot Configuration
# ============================================================
# spring:
#   datasource:
#     url: jdbc:postgresql://my-rds-proxy.proxy-xxx.us-east-1.rds.amazonaws.com:5432/myapp
#     username: app_user
#     password: \${DB_PASSWORD}
#     hikari:
#       maximum-pool-size: 5     # Smaller pool — RDS Proxy handles multiplexing
#       connection-timeout: 3000

# ============================================================
# PgBouncer — On-Prem Connection Multiplexing (pgbouncer.ini)
# ============================================================
# [databases]
# myapp = host=127.0.0.1 port=5432 dbname=myapp
#
# [pgbouncer]
# listen_port = 6432
# listen_addr = 0.0.0.0
# auth_type = md5
# pool_mode = transaction    # Best for Spring Boot
# default_pool_size = 20
# max_client_conn = 500
# min_pool_size = 5`,
    practice: "Your Spring Boot app on EKS scales from 2 to 8 pods via HPA. Your RDS db.t3.medium supports ~160 max connections. What should the pool size per pod be? How would you add RDS Proxy to avoid this constraint entirely?",
    solution: `# Without RDS Proxy:
# Available connections: 160 - 10 (admin reserve) = 150
# Max pods: 8
# Pool per pod: 150 / 8 = 18 (round down to 15 for safety)
# spring.datasource.hikari.maximum-pool-size: 15
#
# With RDS Proxy:
# RDS Proxy handles multiplexing — it can accept 1000+ app connections
# and use only 50-100 actual DB connections.
# Per pod pool can be larger (e.g., 20-30) since RDS Proxy absorbs the load.
# Change datasource URL to the RDS Proxy endpoint:
# spring.datasource.url: jdbc:postgresql://my-proxy.proxy-xxx.rds.amazonaws.com:5432/myapp
# spring.datasource.hikari.maximum-pool-size: 20`
  },
  {
    time: "Session 3",
    title: "PostgreSQL Query Performance & EXPLAIN ANALYZE",
    concept: [
      "## Q: How do I identify slow queries in my Spring Boot application?",

      "**A:** Multiple layers can reveal slow queries: (1) **Spring Boot logging** — set `logging.level.org.hibernate.SQL=DEBUG` and `logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE` to see generated SQL and bound parameters. (2) **P6Spy** — a JDBC wrapper that logs all SQL with execution times. Add `p6spy` dependency and set `spring.datasource.url=jdbc:p6spy:postgresql://...`. (3) **PostgreSQL slow query log** — set `log_min_duration_statement = 500` (ms) in `postgresql.conf` to log queries taking > 500ms. (4) **pg_stat_statements** — PostgreSQL extension that tracks execution statistics for all queries.",

      "**On-Prem:** Edit `postgresql.conf`: `shared_preload_libraries = 'pg_stat_statements'`, then `CREATE EXTENSION pg_stat_statements;`. Query it: `SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;`",

      "**AWS RDS:** `pg_stat_statements` is pre-installed. Enable via parameter group: `shared_preload_libraries = pg_stat_statements`. Also use **Performance Insights** — a visual dashboard showing top SQL by wait events, CPU, I/O. Free tier includes 7 days retention.",

      "## Q: How do I read an EXPLAIN ANALYZE output?",

      "**A:** `EXPLAIN ANALYZE` runs the query and shows the actual execution plan with real timing. Key elements: **Seq Scan** — full table scan (reads every row). **Index Scan** — uses an index to find rows (much faster). **Bitmap Index Scan** — builds a bitmap of matching pages, then fetches them (good for moderate selectivity). **Nested Loop** — for each row in outer table, scan inner table (fast for small outer sets). **Hash Join** — builds a hash table from one table, probes with the other (fast for large equi-joins). **Sort** — explicit sort operation (check if an index could avoid this). **actual time=X..Y** — X is startup time, Y is total time in ms. **rows=N** — actual rows returned (compare with planned `rows` estimate).",

      "**Planning vs Actual rows mismatch:** If planned `rows=1` but actual `rows=50000`, PostgreSQL chose a terrible plan. Fix: run `ANALYZE tablename;` to update statistics, or check if the column lacks a histogram (low `n_distinct` in `pg_stats`).",

      "## Q: What is the difference between EXPLAIN and EXPLAIN ANALYZE?",

      "**EXPLAIN** shows the *planned* execution without running the query. It estimates costs and row counts. Use for: checking if an index is used, estimating query cost. **EXPLAIN ANALYZE** actually *executes* the query and shows real timings and row counts. Use for: measuring actual performance, finding misestimates. Add **BUFFERS** option to see I/O: `EXPLAIN (ANALYZE, BUFFERS) SELECT ...` — shows shared blocks hit (from cache) vs read (from disk).",

      "## Q: When does PostgreSQL choose a sequential scan instead of an index?",

      "**A:** PostgreSQL's query planner makes cost-based decisions. It chooses Seq Scan when: (1) The query returns > ~5-10% of the table (index scan has per-row overhead). (2) The table is very small (< a few pages). (3) No suitable index exists. (4) Statistics are stale (`ANALYZE` not run). (5) `random_page_cost` is too high (default 4.0 — reduce to 1.1 for SSDs). (6) The `WHERE` clause uses a function on the indexed column (e.g., `WHERE LOWER(email) = '...'` won't use a B-tree index on `email` — create a functional index instead).",
    ],
    code: `-- ============================================================
-- EXPLAIN ANALYZE — Reading Query Plans
-- ============================================================

-- BAD: Full table scan (Seq Scan)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE status = 'PENDING';
-- Seq Scan on orders  (cost=0.00..15432.00 rows=5234 width=128)
--                      (actual time=0.012..89.432 rows=5127 loops=1)
--   Filter: (status = 'PENDING')
--   Rows Removed by Filter: 494873
--   Buffers: shared hit=8432
-- Planning Time: 0.089 ms
-- Execution Time: 90.234 ms   ← 90ms is SLOW for a simple filter

-- GOOD: After adding an index
CREATE INDEX idx_orders_status ON orders(status);
ANALYZE orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'PENDING';
-- Index Scan using idx_orders_status on orders
--   (cost=0.42..234.56 rows=5234 width=128)
--   (actual time=0.028..2.345 rows=5127 loops=1)
--   Index Cond: (status = 'PENDING')
--   Buffers: shared hit=156
-- Execution Time: 2.789 ms   ← 32x faster!

-- ============================================================
-- pg_stat_statements — Top Slow Queries
-- ============================================================
SELECT
    left(query, 80) AS query_preview,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round(total_exec_time::numeric, 2) AS total_ms,
    rows AS total_rows
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'myapp')
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================================
-- Spring Boot — Enable SQL Logging (Dev Only)
-- ============================================================
-- application-dev.yml:
-- spring:
--   jpa:
--     show-sql: true
--     properties:
--       hibernate:
--         format_sql: true
-- logging:
--   level:
--     org.hibernate.SQL: DEBUG
--     org.hibernate.orm.jdbc.bind: TRACE

-- ============================================================
-- Update Statistics After Bulk Data Load
-- ============================================================
ANALYZE orders;           -- Single table
ANALYZE;                  -- All tables (expensive on large DBs)
-- On AWS RDS: autovacuum handles ANALYZE automatically
-- but after bulk imports, run it manually`,
    practice: "Run EXPLAIN (ANALYZE, BUFFERS) on a query against a table with 500K+ rows that filters on a non-indexed column. Note the Seq Scan and execution time. Then create an index, run ANALYZE, and re-run EXPLAIN. Compare the two plans.",
    solution: `-- Step 1: Without index
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM orders WHERE customer_email = 'john@example.com';
-- Result: Seq Scan, ~120ms, Buffers: shared hit=8500
--
-- Step 2: Create index
-- CREATE INDEX idx_orders_customer_email ON orders(customer_email);
-- ANALYZE orders;
--
-- Step 3: With index
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM orders WHERE customer_email = 'john@example.com';
-- Result: Index Scan, ~0.5ms, Buffers: shared hit=4
--
-- Key insight: Index reduced I/O from 8500 pages to 4 pages (2000x reduction)`
  },
  {
    time: "Session 4",
    title: "Indexing Strategies — B-Tree, GIN, Partial & Covering Indexes",
    concept: [
      "## Q: What index types does PostgreSQL support and when should I use each?",

      "**B-Tree (default):** The most common index type. Supports `=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `IN`, `IS NULL`, `LIKE 'prefix%'` (prefix only). Use for: primary keys, foreign keys, equality and range filters, ORDER BY. Created by default with `CREATE INDEX`.",

      "**Hash:** Only supports equality (`=`) comparisons. Slightly faster than B-Tree for pure equality but no range support. Rarely used — B-Tree covers equality AND ranges. Use only when you have millions of equality-only lookups and need marginal performance gain.",

      "**GIN (Generalized Inverted Index):** Designed for composite values — arrays, JSONB, full-text search (`tsvector`). Use `CREATE INDEX idx ON orders USING gin(tags)` for `@>` (contains), `?` (key exists), `?&` (all keys exist) operators on JSONB columns. Essential for `WHERE data @> '{\"status\": \"active\"}'` JSONB queries.",

      "**GiST (Generalized Search Tree):** For geometric, range, and full-text search data. Used with PostGIS for geospatial queries (`ST_Within`, `ST_Distance`). Also supports range types (`int4range`, `tsrange`).",

      "**BRIN (Block Range Index):** Very small index for naturally ordered data (e.g., timestamp columns that increase monotonically). Instead of indexing every row, BRIN stores min/max values per block of pages. Use for time-series data with `created_at` columns where rows are inserted in order.",

      "## Q: What is a partial index and when should I use one?",

      "**A:** A partial index only indexes rows matching a `WHERE` condition. `CREATE INDEX idx_active_orders ON orders(status) WHERE status = 'PENDING';` — only rows with `status = 'PENDING'` are in the index, making it much smaller and faster. Use when: you frequently query a small subset of a table (e.g., 5% of orders are 'PENDING' but 95% are 'COMPLETED'). The query planner automatically uses the partial index when your `WHERE` clause matches.",

      "## Q: What is a covering index and how does it avoid table lookups?",

      "**A:** A covering index (Index-Only Scan) includes all columns the query needs, so PostgreSQL doesn't need to fetch the actual table row. `CREATE INDEX idx_users_covering ON users(status) INCLUDE (name, email);` — if your query is `SELECT name, email FROM users WHERE status = 'ACTIVE'`, PostgreSQL reads ONLY the index, never touches the table. This eliminates heap fetches and can be 5-10x faster for read-heavy queries.",

      "## Q: How many indexes are too many?",

      "**A:** Each index slows down INSERT, UPDATE, and DELETE operations because the index must be updated. Rule of thumb: (1) Index every foreign key column. (2) Index columns in frequent WHERE clauses and JOIN conditions. (3) Index columns used in ORDER BY. (4) Avoid indexing low-cardinality columns (e.g., boolean `is_active` with only 2 values — partial index is better). (5) Remove unused indexes. Monitor with `pg_stat_user_indexes`: if `idx_scan = 0` for weeks, the index is unused and should be dropped.",
    ],
    code: `-- ============================================================
-- Indexing Strategy Examples
-- ============================================================

-- 1. Composite B-Tree Index (column order matters!)
-- Query: WHERE status = 'ACTIVE' AND created_at > '2024-01-01'
CREATE INDEX idx_orders_status_created
    ON orders(status, created_at);
-- The LEFT-most column must appear in WHERE clause
-- This index works for: WHERE status = 'X'
-- AND: WHERE status = 'X' AND created_at > date
-- NOT: WHERE created_at > date (status not in WHERE)

-- 2. Partial Index — Small, Fast, Targeted
CREATE INDEX idx_pending_orders
    ON orders(created_at)
    WHERE status = 'PENDING';
-- Only indexes the ~5% of rows that are PENDING
-- 20x smaller than a full index

-- 3. Covering Index — Index-Only Scans
CREATE INDEX idx_users_status_covering
    ON users(status)
    INCLUDE (name, email);
-- SELECT name, email FROM users WHERE status = 'ACTIVE'
-- → Index Only Scan (no heap fetch)

-- 4. Functional Index — For Expressions
CREATE INDEX idx_users_lower_email
    ON users(LOWER(email));
-- Enables: WHERE LOWER(email) = 'john@example.com'

-- 5. GIN Index for JSONB
CREATE INDEX idx_orders_metadata
    ON orders USING gin(metadata);
-- Enables: WHERE metadata @> '{"priority": "high"}'
-- Enables: WHERE metadata ? 'coupon_code'

-- 6. BRIN Index for Time-Series Data
CREATE INDEX idx_events_created_brin
    ON events USING brin(created_at);
-- 1000x smaller than B-Tree for time-series tables
-- Only effective when data is physically ordered

-- ============================================================
-- Find Unused Indexes (candidates for removal)
-- ============================================================
SELECT schemaname, relname AS table, indexrelname AS index,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size,
       idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================
-- Index Size Analysis
-- ============================================================
SELECT tablename,
       indexname,
       pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;`,
    practice: "You have an 'orders' table with 1M rows. 98% of orders have status 'COMPLETED', 2% are 'PENDING'. Your app frequently queries pending orders sorted by created_at. Design the optimal index strategy: should you use a regular index, partial index, or covering index?",
    solution: `-- Best approach: Partial Covering Index
-- CREATE INDEX idx_pending_orders_covering
--     ON orders(created_at DESC)
--     INCLUDE (id, customer_id, total_amount)
--     WHERE status = 'PENDING';
--
-- Why partial: Only 2% of rows (20K) are indexed instead of 1M
-- Index size: ~2MB instead of ~100MB
-- Why covering: INCLUDE columns avoid heap fetch
-- Why DESC on created_at: If you ORDER BY created_at DESC,
--   the index is already in the right order — no sort needed
--
-- Query that benefits:
-- SELECT id, customer_id, total_amount, created_at
-- FROM orders
-- WHERE status = 'PENDING'
-- ORDER BY created_at DESC
-- LIMIT 50;
-- → Index Only Scan, sub-millisecond, no sort`
  },
  {
    time: "Session 5",
    title: "N+1 Query Problem — Detection & Solutions",
    concept: [
      "## Q: What is the N+1 query problem?",

      "**A:** The N+1 problem occurs when your code executes 1 query to load N parent entities, then N additional queries to load each parent's child entities. Example: `SELECT * FROM orders` returns 100 orders (1 query). Then Hibernate lazily loads `order.getItems()` for each order → 100 more queries (N queries). Total: 101 queries instead of 1-2. This is the #1 JPA performance killer in Spring Boot applications.",

      "**Why it happens:** JPA relationships (`@OneToMany`, `@ManyToOne`) default to `FetchType.LAZY` (loaded on first access). When you iterate over orders and access `order.getItems()`, Hibernate fires a `SELECT * FROM order_items WHERE order_id = ?` for EACH order. In a loop of 100 orders, that's 100 separate round-trips to the database.",

      "## Q: How do I detect N+1 queries?",

      "**A:** (1) **Enable SQL logging** in dev: `logging.level.org.hibernate.SQL=DEBUG`. Count the number of SELECT statements for a single API call. If you see the same query repeated with different IDs, it's N+1. (2) **spring-boot-starter-data-jpa + Hibernate statistics:** set `spring.jpa.properties.hibernate.generate_statistics=true` — Hibernate logs query count, fetch count, and cache hits per session. (3) **P6Spy or Datasource Proxy** — log all SQL with execution counts. (4) **Integration tests** — assert on query count using libraries like `datasource-proxy` or `spring-boot-data-jpa-test`.",

      "## Q: How do I fix N+1 queries?",

      "**Fix 1 — JOIN FETCH (JPQL):** `SELECT o FROM Order o JOIN FETCH o.items WHERE o.status = :status`. This generates a single SQL query with a JOIN, loading orders and items together. Limitation: can only JOIN FETCH one collection per query (multiple collections cause a Cartesian product). For multiple collections, use separate queries.",

      "**Fix 2 — @EntityGraph:** Define which associations to eagerly load at the repository level. `@EntityGraph(attributePaths = {\"items\", \"customer\"})` on a repository method tells Hibernate to use LEFT JOIN FETCH. More declarative than JPQL and doesn't require writing a custom query.",

      "**Fix 3 — @BatchSize (Hibernate extension):** `@BatchSize(size = 50)` on the `@OneToMany` field. Instead of N individual queries, Hibernate batches them: `SELECT * FROM order_items WHERE order_id IN (?, ?, ..., ?)` with 50 IDs per batch. For 100 orders, that's 2 queries instead of 100. Less optimal than JOIN FETCH but simpler to add.",

      "**Fix 4 — DTO Projection:** If you don't need full entities, use a JPQL projection: `SELECT new OrderSummary(o.id, o.status, i.productName) FROM Order o JOIN o.items i`. This avoids entity management overhead entirely.",

      "## Q: JOIN FETCH vs @EntityGraph — When to use which?",

      "**JOIN FETCH:** Use when you need control over the JOIN type, WHERE conditions, or sorting. Works in custom `@Query` JPQL. Downside: query is less reusable. **@EntityGraph:** Use when you want to reuse the same repository method with different fetch strategies. Define the graph once, apply to any finder method. Downside: always uses LEFT JOIN (can't filter on the association). Use JOIN FETCH for complex queries, @EntityGraph for simple eager loading.",
    ],
    code: `// ============================================================
// N+1 Problem — Before and After
// ============================================================

// PROBLEM: N+1 Queries (BAD)
@Entity
public class Order {
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items;  // Loaded lazily per entity
}

// In service:
List<Order> orders = orderRepository.findByStatus("ACTIVE"); // 1 query
for (Order order : orders) {
    order.getItems().size(); // N queries (one per order!)
}

// ============================================================
// FIX 1: JOIN FETCH in JPQL
// ============================================================
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN FETCH o.items " +
           "WHERE o.status = :status")
    List<Order> findByStatusWithItems(@Param("status") String status);
    // → 1 single SQL query with JOIN
}

// ============================================================
// FIX 2: @EntityGraph — Declarative Eager Loading
// ============================================================
public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"items", "customer"})
    List<Order> findByStatus(String status);
    // Hibernate generates:
    // SELECT o.*, i.*, c.*
    // FROM orders o
    // LEFT JOIN order_items i ON o.id = i.order_id
    // LEFT JOIN customers c ON o.customer_id = c.id
    // WHERE o.status = ?
}

// ============================================================
// FIX 3: @BatchSize — Batch Lazy Loading
// ============================================================
@Entity
public class Order {
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    @BatchSize(size = 50) // Load 50 collections at a time
    private List<OrderItem> items;
}
// Instead of 100 queries, Hibernate fires:
// SELECT * FROM order_items WHERE order_id IN (1,2,3,...,50)
// SELECT * FROM order_items WHERE order_id IN (51,52,...,100)
// → 2 queries instead of 100!

// ============================================================
// FIX 4: DTO Projection — Skip Entities Entirely
// ============================================================
public record OrderItemSummary(Long orderId, String status,
                                String productName, int quantity) {}

@Query("SELECT new com.app.dto.OrderItemSummary(" +
       "o.id, o.status, i.productName, i.quantity) " +
       "FROM Order o JOIN o.items i WHERE o.status = :status")
List<OrderItemSummary> findOrderItemSummaries(@Param("status") String status);
// → 1 query, no entity management, no dirty checking`,
    practice: "You have Order -> OrderItems -> Product relationships. Write a repository method that loads all orders with their items AND each item's product name in a single query. Use both JOIN FETCH and @EntityGraph approaches.",
    solution: `// Approach 1: JOIN FETCH (JPQL)
// @Query("SELECT DISTINCT o FROM Order o " +
//        "JOIN FETCH o.items i " +
//        "JOIN FETCH i.product " +
//        "WHERE o.status = :status")
// List<Order> findWithItemsAndProducts(@Param("status") String status);
//
// Approach 2: @EntityGraph
// @EntityGraph(attributePaths = {"items", "items.product"})
// List<Order> findByStatus(String status);
//
// Approach 3: DTO Projection (best for read-only)
// @Query("SELECT new com.app.dto.OrderDetail(" +
//        "o.id, o.status, i.quantity, p.name, p.price) " +
//        "FROM Order o JOIN o.items i JOIN i.product p " +
//        "WHERE o.status = :status")
// List<OrderDetail> findOrderDetails(@Param("status") String status);`
  },
  {
    time: "Session 6",
    title: "Transaction Management & Isolation Levels",
    concept: [
      "## Q: How does @Transactional work in Spring Boot?",

      "**A:** `@Transactional` creates an AOP proxy around your method. When the method is called: (1) Spring opens a database transaction (`BEGIN`). (2) Your method executes. (3) If the method returns normally → `COMMIT`. (4) If it throws a **runtime exception** (unchecked) → `ROLLBACK`. (5) If it throws a **checked exception** → `COMMIT` (by default!). Override with `@Transactional(rollbackFor = Exception.class)` to rollback on checked exceptions too.",

      "**Critical Rule:** `@Transactional` does NOT work on `private` methods (CGLIB proxy can't intercept them). It also doesn't work for **self-invocation** — if `methodA()` calls `methodB()` within the same class, and `methodB()` has `@Transactional`, the proxy is bypassed because the call goes through `this` rather than the proxy. Fix: inject the bean into itself, or move the transactional method to a separate service.",

      "## Q: What is @Transactional(readOnly = true) and why should I use it?",

      "**A:** `readOnly = true` tells Spring and Hibernate that this transaction will not modify data. Benefits: (1) **Hibernate disables dirty checking** — no field-by-field comparison at flush time, saving CPU. (2) **No flush at commit** — Hibernate skips the flush phase entirely. (3) **JDBC driver optimization** — PostgreSQL can route read-only transactions to a read replica (if configured). (4) **Prevents accidental writes** — calling `save()` or modifying a managed entity in a read-only transaction silently does nothing (or throws, depending on config).",

      "## Q: What are PostgreSQL transaction isolation levels?",

      "**READ COMMITTED (default in PostgreSQL):** Each statement within a transaction sees only data committed before that statement started. If another transaction commits between your two SELECTs, the second SELECT sees the new data. This is safe for most CRUD applications.",

      "**REPEATABLE READ:** All statements within a transaction see a snapshot of the database taken at the start of the FIRST statement. Even if other transactions commit changes, your transaction sees the original data. Use for: report generation, financial calculations that must see consistent data across multiple queries. Downside: serialization failures possible — your transaction may be aborted if it conflicts with another.",

      "**SERIALIZABLE:** The strongest isolation level. Transactions execute as if they ran one at a time. PostgreSQL uses **Serializable Snapshot Isolation (SSI)** — it allows concurrent execution but aborts transactions that would violate serializability. Use for: banking transfers, inventory systems where race conditions are unacceptable. Performance cost: higher abort rate, retry logic required.",

      "## Q: How do I handle pessimistic vs optimistic locking?",

      "**Optimistic Locking (recommended for web apps):** Add `@Version` field to your entity. Hibernate checks the version on UPDATE: `UPDATE users SET name = 'X', version = 2 WHERE id = 1 AND version = 1`. If another transaction changed the version, the UPDATE affects 0 rows and Hibernate throws `OptimisticLockException`. Handle it by retrying or showing an error. No database locks held — high concurrency.",

      "**Pessimistic Locking:** Use `@Lock(LockModeType.PESSIMISTIC_WRITE)` on a repository method. Hibernate adds `SELECT ... FOR UPDATE`, locking the row until the transaction commits. Other transactions block until the lock is released. Use for: inventory deduction, payment processing where you MUST prevent concurrent modifications. Risk: deadlocks if two transactions lock rows in different order.",
    ],
    code: `// ============================================================
// Transaction Management Patterns
// ============================================================

// 1. Standard @Transactional usage
@Service
@Transactional(readOnly = true)  // Default for all methods
public class OrderService {

    // Read method — inherits readOnly = true
    public OrderResponse findById(Long id) {
        return orderRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("Order", id));
    }

    // Write method — overrides with read-write
    @Transactional  // readOnly = false (implicit)
    public OrderResponse createOrder(CreateOrderRequest req) {
        Order order = new Order(req.customerId(), req.items());
        return toResponse(orderRepository.save(order));
    }

    // Rollback on ALL exceptions (including checked)
    @Transactional(rollbackFor = Exception.class)
    public void processPayment(Long orderId) throws PaymentException {
        // If PaymentException (checked) is thrown, transaction rolls back
    }
}

// ============================================================
// 2. Isolation Levels
// ============================================================
// REPEATABLE READ for financial reports
@Transactional(isolation = Isolation.REPEATABLE_READ, readOnly = true)
public FinancialReport generateMonthlyReport(YearMonth month) {
    BigDecimal revenue = orderRepository.sumRevenueForMonth(month);
    BigDecimal expenses = expenseRepository.sumForMonth(month);
    long orderCount = orderRepository.countForMonth(month);
    // All three queries see the same consistent snapshot
    return new FinancialReport(month, revenue, expenses, orderCount);
}

// ============================================================
// 3. Optimistic Locking with @Version
// ============================================================
@Entity
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int stockQuantity;

    @Version  // Hibernate auto-increments on each UPDATE
    private int version;
}

// Service with retry logic for optimistic lock failures
@Transactional
@Retryable(value = OptimisticLockException.class, maxAttempts = 3)
public void decrementStock(Long productId, int quantity) {
    Product p = productRepository.findById(productId).orElseThrow();
    if (p.getStockQuantity() < quantity)
        throw new InsufficientStockException(productId);
    p.setStockQuantity(p.getStockQuantity() - quantity);
    // Hibernate: UPDATE products SET stock=?, version=2
    //            WHERE id=? AND version=1
}

// ============================================================
// 4. Pessimistic Locking
// ============================================================
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
    // Generates: SELECT ... FROM products WHERE id = ? FOR UPDATE
    // Row is locked until transaction commits
}

// ============================================================
// PostgreSQL — Check for Lock Waits
-- ============================================================
-- SELECT pid, usename, pg_blocking_pids(pid) AS blocked_by,
--        query, state
-- FROM pg_stat_activity
-- WHERE cardinality(pg_blocking_pids(pid)) > 0;`,
    practice: "Two users simultaneously try to buy the last item in stock. With no locking, both succeed and stock goes to -1. Implement optimistic locking with @Version and add retry logic using Spring Retry.",
    solution: `// 1. Add @Version to Product entity:
// @Version private int version;
//
// 2. Service method with retry:
// @Transactional
// @Retryable(
//     value = {OptimisticLockException.class,
//              ObjectOptimisticLockingFailureException.class},
//     maxAttempts = 3,
//     backoff = @Backoff(delay = 100))
// public void purchaseItem(Long productId) {
//     Product p = productRepository.findById(productId).orElseThrow();
//     if (p.getStockQuantity() <= 0)
//         throw new OutOfStockException(productId);
//     p.setStockQuantity(p.getStockQuantity() - 1);
//     // If version mismatch → OptimisticLockException → retry
// }
//
// @Recover
// public void purchaseFallback(OptimisticLockException ex, Long id) {
//     throw new ConflictException("Could not complete purchase after retries");
// }
//
// Don't forget @EnableRetry on your @Configuration class
// and spring-retry + spring-aspects dependencies`
  },
  {
    time: "Session 7",
    title: "PostgreSQL VACUUM, Autovacuum & Table Bloat",
    concept: [
      "## Q: What is VACUUM and why does PostgreSQL need it?",

      "**A:** PostgreSQL uses **MVCC (Multi-Version Concurrency Control)** — when you UPDATE a row, it doesn't modify the original. Instead, it marks the old row as dead and creates a new row version. DELETE also just marks rows as dead. Over time, dead rows (called **dead tuples**) accumulate, wasting disk space and slowing down sequential scans. `VACUUM` reclaims this space by marking dead tuples as available for reuse. Without VACUUM, tables grow indefinitely (table bloat) and queries slow down.",

      "**VACUUM vs VACUUM FULL:** `VACUUM` marks dead tuples as reusable but does NOT return space to the OS. Table size on disk stays the same. `VACUUM FULL` rewrites the entire table, compacting it and returning space to OS. But it requires an **ACCESS EXCLUSIVE lock** — the table is unavailable for reads and writes during the operation. Use `VACUUM FULL` only during maintenance windows. For production, use `pg_repack` instead — it compacts without locking.",

      "## Q: How does autovacuum work and when should I tune it?",

      "**A:** Autovacuum is a background process that automatically runs VACUUM on tables that exceed a threshold of dead tuples. Default trigger: `autovacuum_vacuum_threshold (50) + autovacuum_vacuum_scale_factor (0.2) * table_row_count`. For a 1M-row table: 50 + 200,000 = 200,050 dead tuples before autovacuum fires. For high-churn tables, this is too late.",

      "**Tuning per-table:** `ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_threshold = 1000);` — triggers at 1% dead tuples or 1000 dead tuples, whichever is higher. Do this for hot tables (orders, events, sessions).",

      "**On-Prem:** Tune in `postgresql.conf`: `autovacuum_max_workers = 5` (default 3), `autovacuum_naptime = 30s` (default 1min), `autovacuum_vacuum_cost_delay = 2ms` (default 2ms). Monitor with `pg_stat_user_tables`: `n_dead_tup`, `last_autovacuum`.",

      "**AWS RDS:** Autovacuum is enabled and managed. You can tune scale factors via parameter groups. RDS Enhanced Monitoring shows vacuum activity. Aurora has optimized vacuum: its storage engine handles some garbage collection at the storage layer, reducing vacuum overhead.",

      "## Q: How do I detect and fix table bloat?",

      "**A:** Table bloat means a table occupies much more disk space than its live data requires. Detect with: `SELECT relname, n_dead_tup, n_live_tup, round(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 1) AS dead_pct FROM pg_stat_user_tables WHERE n_dead_tup > 10000 ORDER BY n_dead_tup DESC;`. If dead_pct > 20%, the table is bloated. Fix: run `VACUUM tablename;` for space reuse, or `pg_repack` for compaction without downtime.",
    ],
    code: `-- ============================================================
-- VACUUM & Autovacuum Monitoring
-- ============================================================

-- Check dead tuple counts and last vacuum time
SELECT relname AS table_name,
       n_live_tup AS live_rows,
       n_dead_tup AS dead_rows,
       round(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 1) AS dead_pct,
       last_vacuum,
       last_autovacuum,
       last_analyze,
       last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Check table size vs estimated live data
SELECT tablename,
       pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size,
       pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size,
       pg_size_pretty(pg_indexes_size(tablename::regclass)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Per-table autovacuum tuning for high-churn tables
ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor = 0.01,  -- Trigger at 1% dead tuples
    autovacuum_vacuum_threshold = 1000,
    autovacuum_analyze_scale_factor = 0.005
);

ALTER TABLE audit_log SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_vacuum_threshold = 5000
);

-- Manual VACUUM with verbose output
VACUUM (VERBOSE, ANALYZE) orders;

-- Compact without downtime (install pg_repack extension)
-- pg_repack --table orders --no-kill-backend -d myapp`,
    practice: "Check your database for tables with high dead tuple percentages. Which tables would benefit from more aggressive autovacuum settings? Write the ALTER TABLE statements to tune autovacuum for a high-churn orders table.",
    solution: `-- Step 1: Find bloated tables
-- SELECT relname, n_live_tup, n_dead_tup,
--        round(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 1) AS dead_pct
-- FROM pg_stat_user_tables
-- ORDER BY n_dead_tup DESC LIMIT 10;
--
-- Step 2: Tune autovacuum for high-churn table
-- ALTER TABLE orders SET (
--     autovacuum_vacuum_scale_factor = 0.01,
--     autovacuum_vacuum_threshold = 500,
--     autovacuum_analyze_scale_factor = 0.005,
--     autovacuum_analyze_threshold = 500
-- );
--
-- Step 3: Verify settings
-- SELECT relname, reloptions FROM pg_class WHERE relname = 'orders';`
  },
  {
    time: "Session 8",
    title: "AWS RDS & Aurora PostgreSQL — Tuning & Best Practices",
    concept: [
      "## Q: What are the key differences between RDS PostgreSQL and Aurora PostgreSQL?",

      "**RDS PostgreSQL** is standard PostgreSQL running on EC2 with managed backups, patching, and monitoring. Storage is EBS-based (gp3, io1, io2). Replication uses standard PostgreSQL streaming replication. Failover: 1-2 minutes (DNS flip to standby).",

      "**Aurora PostgreSQL** uses a custom cloud-native storage engine. 6-way replicated across 3 AZs automatically. Storage scales automatically up to 128 TB (no pre-provisioning). Read replicas share the same storage volume (no replication lag for writes). Failover: < 30 seconds. 3-5x throughput vs standard PostgreSQL. Cost: ~20% more than RDS for comparable instances, but storage efficiency can offset this.",

      "## Q: How do I tune RDS/Aurora parameter groups?",

      "**A:** You can't edit `postgresql.conf` directly on RDS. Instead, create a **custom parameter group** and attach it to your instance. Key parameters: `shared_buffers` (25% of instance memory — auto-set by RDS), `work_mem` (per-operation sort memory — 4-16MB for OLTP), `effective_cache_size` (75% of instance memory — helps query planner), `random_page_cost` (set to 1.1 for SSD-backed storage), `checkpoint_timeout` and `max_wal_size` (tune WAL for write-heavy workloads).",

      "## Q: How do I set up read replicas for read scaling?",

      "**A:** Create a read replica in RDS/Aurora console or Terraform. In Spring Boot, configure two DataSources: the writer (cluster endpoint) and reader (reader endpoint). Use `@Transactional(readOnly = true)` to route to the reader. Spring provides `AbstractRoutingDataSource` to switch between writer and reader based on transaction type.",

      "**Aurora Reader Endpoint:** Aurora provides a reader endpoint that automatically load-balances across read replicas: `mydb.cluster-ro-xxx.us-east-1.rds.amazonaws.com`. Point your read-only DataSource at this endpoint. Aurora supports up to 15 read replicas with near-zero replication lag.",

      "## Q: How do I handle RDS credentials securely?",

      "**A:** Never hardcode credentials. Use **AWS Secrets Manager**: store DB credentials in a secret, rotate automatically every 30 days. In Spring Boot on EKS, use **IRSA** (IAM Roles for Service Accounts) to give pods permission to read the secret. Use `spring-cloud-aws-starter-secrets-manager` to load credentials at startup. Alternatively, use **RDS IAM Authentication** — generate short-lived tokens instead of passwords. Aurora supports IAM auth natively.",

      "## Q: What monitoring should I set up for RDS/Aurora?",

      "**A:** (1) **CloudWatch Metrics:** `CPUUtilization`, `FreeableMemory`, `DatabaseConnections`, `ReadIOPS`, `WriteIOPS`, `ReadLatency`, `WriteLatency`, `DiskQueueDepth`. Set alarms on CPU > 80%, connections > 80% of max, freeable memory < 10%. (2) **Performance Insights:** Visual dashboard showing top SQL by wait events. Identifies CPU-bound vs I/O-bound queries. Free: 7 days retention. (3) **Enhanced Monitoring:** OS-level metrics at 1-second granularity — process list, memory breakdown, I/O stats. (4) **pg_stat_statements:** Query-level performance data accessible from SQL.",
    ],
    code: `# ============================================================
# Spring Boot — Writer/Reader DataSource Routing
# ============================================================
# application.yml:
spring:
  datasource:
    writer:
      url: jdbc:postgresql://mydb.cluster-xxx.us-east-1.rds.amazonaws.com:5432/myapp
      username: app_writer
      password: \${WRITER_DB_PASSWORD}
      hikari:
        maximum-pool-size: 10
        pool-name: Writer-Pool
    reader:
      url: jdbc:postgresql://mydb.cluster-ro-xxx.us-east-1.rds.amazonaws.com:5432/myapp
      username: app_reader
      password: \${READER_DB_PASSWORD}
      hikari:
        maximum-pool-size: 15
        pool-name: Reader-Pool

# ============================================================
# Java — Routing DataSource Configuration
# ============================================================
# @Configuration
# public class DataSourceConfig {
#
#     @Bean @ConfigurationProperties("spring.datasource.writer")
#     public DataSource writerDataSource() {
#         return DataSourceBuilder.create().build();
#     }
#
#     @Bean @ConfigurationProperties("spring.datasource.reader")
#     public DataSource readerDataSource() {
#         return DataSourceBuilder.create().build();
#     }
#
#     @Bean @Primary
#     public DataSource routingDataSource(
#             @Qualifier("writerDataSource") DataSource writer,
#             @Qualifier("readerDataSource") DataSource reader) {
#         var routing = new TransactionRoutingDataSource();
#         routing.setTargetDataSources(Map.of(
#             "writer", writer, "reader", reader));
#         routing.setDefaultTargetDataSource(writer);
#         return routing;
#     }
# }
#
# public class TransactionRoutingDataSource extends AbstractRoutingDataSource {
#     @Override
#     protected Object determineCurrentLookupKey() {
#         return TransactionSynchronizationManager
#             .isCurrentTransactionReadOnly() ? "reader" : "writer";
#     }
# }

# ============================================================
# AWS Secrets Manager — Spring Boot Integration
# ============================================================
# pom.xml: io.awspring.cloud:spring-cloud-aws-starter-secrets-manager
#
# application.yml:
# spring:
#   cloud:
#     aws:
#       secretsmanager:
#         region: us-east-1
#   config:
#     import: aws-secretsmanager:/myapp/db-credentials
# Secret JSON: {"username":"app_user","password":"s3cureP@ss"}
# Spring maps to: spring.datasource.username, spring.datasource.password`,
    practice: "Design a Spring Boot configuration that routes @Transactional(readOnly = true) queries to an Aurora reader endpoint and write queries to the writer endpoint. Include HikariCP pool settings for both.",
    solution: `# See code section above for the full implementation.
# Key points:
# 1. Two DataSource beans (writer + reader) with separate HikariCP configs
# 2. AbstractRoutingDataSource that checks isCurrentTransactionReadOnly()
# 3. @Primary on the routing DataSource so JPA uses it automatically
# 4. Writer pool: smaller (writes are fewer) — max-pool-size: 10
# 5. Reader pool: larger (reads are more frequent) — max-pool-size: 15
# 6. @Transactional(readOnly = true) on service methods → routes to reader
# 7. @Transactional (no readOnly) → routes to writer`
  },
  {
    time: "Session 9",
    title: "Monitoring, Alerting & Observability",
    concept: [
      "## Q: What metrics should I monitor for a Spring Boot + PostgreSQL application?",

      "**Application Layer (Spring Boot Actuator + Micrometer):** `hikaricp.connections.active` — current active connections (if near max, pool is saturated). `hikaricp.connections.pending` — threads waiting for a connection (should be 0). `hikaricp.connections.timeout` — number of timeout exceptions (pool exhaustion). `http.server.requests` — request latency P50/P95/P99. `jvm.memory.used` — heap usage. `jvm.gc.pause` — GC pause duration.",

      "**Database Layer (PostgreSQL):** `pg_stat_activity` — active connections, query states. `pg_stat_user_tables` — sequential scans vs index scans, dead tuples. `pg_stat_user_indexes` — index usage (unused indexes waste write performance). `pg_stat_statements` — top queries by time, calls, rows. `pg_stat_bgwriter` — checkpoint frequency and duration.",

      "**Infrastructure Layer:** On-Prem: CPU, memory, disk I/O, network (Prometheus + Grafana). AWS: CloudWatch metrics (CPUUtilization, FreeableMemory, DatabaseConnections, ReadLatency, WriteLatency, DiskQueueDepth, ReplicaLag).",

      "## Q: How do I integrate Spring Boot with Prometheus and Grafana?",

      "**A:** (1) Add `spring-boot-starter-actuator` and `micrometer-registry-prometheus` dependencies. (2) Expose Prometheus endpoint: `management.endpoints.web.exposure.include=prometheus,health,metrics`. (3) Prometheus scrapes `/actuator/prometheus` every 15s. (4) Import Grafana dashboards: Spring Boot dashboard (ID: 12900), HikariCP dashboard (ID: 6083). This gives you connection pool health, request latencies, JVM metrics, and custom business metrics.",

      "## Q: What CloudWatch alarms should I set for RDS?",

      "**A:** Critical alarms: `CPUUtilization > 80%` for 5 minutes (scale up or optimize queries). `DatabaseConnections > 80% of max_connections` (increase max or add RDS Proxy). `FreeableMemory < 256MB` (scale up instance). `ReadLatency > 20ms` or `WriteLatency > 20ms` (I/O bottleneck — switch to io2 storage or scale up). `DiskQueueDepth > 10` (storage is overwhelmed). `ReplicaLag > 30 seconds` (read replica falling behind — check write load).",

      "## Q: How do I set up slow query alerting?",

      "**A:** On-Prem: Set `log_min_duration_statement = 1000` (logs queries > 1s). Send logs to ELK stack, create alert on frequency of slow queries. AWS: Enable `log_min_duration_statement` in parameter group. Logs go to CloudWatch Logs. Create a metric filter for slow queries, set CloudWatch alarm when count > 10 in 5 minutes. Also use Performance Insights for visual analysis without log parsing.",
    ],
    code: `# ============================================================
# Spring Boot Actuator + Prometheus Configuration
# ============================================================
# pom.xml dependencies:
# spring-boot-starter-actuator
# micrometer-registry-prometheus

# application.yml:
management:
  endpoints:
    web:
      exposure:
        include: prometheus,health,metrics,info
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: myapp
      environment: production
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5,0.95,0.99
      sla:
        http.server.requests: 100ms,500ms,1s

# ============================================================
# Custom Business Metrics with Micrometer
# ============================================================
# @Component
# public class OrderMetrics {
#     private final Counter ordersCreated;
#     private final Timer orderProcessingTime;
#     private final Gauge activeOrders;
#
#     public OrderMetrics(MeterRegistry registry,
#                         OrderRepository orderRepo) {
#         this.ordersCreated = Counter.builder("orders.created")
#             .description("Total orders created")
#             .tag("type", "all")
#             .register(registry);
#
#         this.orderProcessingTime = Timer.builder("orders.processing.time")
#             .description("Order processing duration")
#             .publishPercentiles(0.5, 0.95, 0.99)
#             .register(registry);
#
#         Gauge.builder("orders.active.count",
#             orderRepo, r -> r.countByStatus("PROCESSING"))
#             .description("Currently processing orders")
#             .register(registry);
#     }
#
#     public void recordOrderCreated() { ordersCreated.increment(); }
#     public Timer.Sample startTimer() { return Timer.start(); }
#     public void stopTimer(Timer.Sample s) { s.stop(orderProcessingTime); }
# }

# ============================================================
# PostgreSQL — Monitoring Queries Dashboard
# ============================================================
-- Table I/O: Seq Scans vs Index Scans
-- SELECT relname, seq_scan, idx_scan,
--        round(idx_scan * 100.0 / NULLIF(seq_scan + idx_scan, 0), 1) AS idx_pct
-- FROM pg_stat_user_tables
-- WHERE seq_scan + idx_scan > 100
-- ORDER BY seq_scan DESC;

-- Cache Hit Ratio (should be > 99%)
-- SELECT
--   round(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit + blks_read), 0), 2) AS cache_hit_pct
-- FROM pg_stat_database
-- WHERE datname = 'myapp';

-- Connection Usage
-- SELECT count(*), state FROM pg_stat_activity
-- WHERE datname = 'myapp' GROUP BY state;`,
    practice: "Set up Micrometer to track a custom metric: 'db.query.slow.count' that increments every time a query takes longer than 500ms. Expose it on the Prometheus endpoint and describe the CloudWatch alarm you would set.",
    solution: `# @Component
# public class SlowQueryTracker {
#     private final Counter slowQueries;
#     public SlowQueryTracker(MeterRegistry registry) {
#         this.slowQueries = Counter.builder("db.query.slow.count")
#             .description("Queries exceeding 500ms")
#             .register(registry);
#     }
#     public void recordSlowQuery() { slowQueries.increment(); }
# }
#
# Use a DataSource proxy (datasource-proxy library) to intercept
# all queries, measure duration, and call recordSlowQuery() if > 500ms.
#
# CloudWatch Alarm:
# - Metric: db_query_slow_count (pushed from Prometheus via CloudWatch agent)
# - Threshold: > 10 in 5 minutes
# - Action: SNS → PagerDuty / Slack alert
# - Runbook: Check pg_stat_statements for new slow queries,
#   run EXPLAIN ANALYZE, check for missing indexes`
  },
  {
    time: "Session 10",
    title: "PostgreSQL Memory Tuning — shared_buffers, work_mem & Caching",
    concept: [
      "## Q: What is shared_buffers and how do I tune it?",

      "**A:** `shared_buffers` is PostgreSQL's main memory cache for frequently accessed data pages. Default: 128MB (too low for production). Set to **25% of total system RAM**. On a 16GB server: 4GB. Monitor cache hit ratio: `SELECT round(sum(blks_hit) * 100.0 / sum(blks_hit + blks_read), 2) FROM pg_stat_database;`. Target: > 99%.",

      "**On-Prem:** Edit `postgresql.conf`. Requires restart. **AWS RDS:** Automatically set per instance class. Override in parameter group if needed. Aurora uses a larger buffer cache at the storage layer.",

      "## Q: What is work_mem and why does it matter?",

      "**A:** `work_mem` controls memory for each sort/hash operation within a query. Default: 4MB. A complex query with 5 operations* 100 connections = 2GB total. Too high → OOM. Too low → sorts spill to disk temp files (slow). Start at 4-16MB for OLTP. For reports, set per-session: `SET work_mem = '256MB';`. Monitor: `SELECT temp_files, temp_bytes FROM pg_stat_database;` — non-zero means work_mem is too low.",

      "## Q: What is effective_cache_size?",

      "**A:** A planner hint (no actual allocation) telling PostgreSQL how much total cache is available (shared_buffers + OS cache). Set to **75% of RAM**. Higher value favors index scans; lower favors seq scans.",

      "## Q: How do I tune for write-heavy workloads?",

      "**A:** Increase `checkpoint_timeout` (15-30min), `max_wal_size` (4-8GB), `wal_buffers` (64MB). For non-critical writes, `synchronous_commit = off` boosts throughput but risks losing up to 600ms of committed data on crash.",
    ],
    code: `-- ============================================================
-- PostgreSQL Memory Configuration (postgresql.conf)
-- ============================================================
-- For a 16GB RAM server:
-- shared_buffers = 4GB
-- effective_cache_size = 12GB
-- work_mem = 16MB
-- maintenance_work_mem = 1GB
-- wal_buffers = 64MB
-- checkpoint_timeout = 15min
-- max_wal_size = 4GB

-- ============================================================
-- Spring Boot — JPA/Hibernate Performance Tuning
-- ============================================================
-- application.yml:
-- spring:
--   jpa:
--     open-in-view: false    # CRITICAL: Disable OSIV
--     properties:
--       hibernate:
--         jdbc:
--           batch_size: 50
--           fetch_size: 100
--         order_inserts: true
--         order_updates: true
--         default_batch_fetch_size: 32

-- ============================================================
-- Monitor Memory Usage
-- ============================================================
-- Cache hit ratio:
SELECT round(sum(blks_hit) * 100.0 /
  NULLIF(sum(blks_hit + blks_read), 0), 2) AS cache_hit_pct
FROM pg_stat_database WHERE datname = 'myapp';

-- Temp file usage (work_mem too low?):
SELECT datname, temp_files, pg_size_pretty(temp_bytes)
FROM pg_stat_database WHERE temp_files > 0;

-- Per-table cache hit ratio:
SELECT relname,
  round(heap_blks_hit * 100.0 /
    NULLIF(heap_blks_hit + heap_blks_read, 0), 2) AS hit_pct
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 100
ORDER BY hit_pct ASC LIMIT 20;`,
    practice: "Your 32GB server runs PostgreSQL with defaults. Calculate optimal shared_buffers, effective_cache_size, and work_mem for 100 concurrent connections.",
    solution: `-- shared_buffers = 8GB (25% of 32GB)
-- effective_cache_size = 24GB (75% of 32GB)
-- work_mem = 32MB (conservative: 100 conns * 5 ops * 32MB = 16GB max)
-- maintenance_work_mem = 2GB
-- On AWS RDS: These are set via parameter groups`
  },
  {
    time: "Session 11",
    title: "Flyway Migrations & Schema Management",
    concept: [
      "## Q: Why use Flyway instead of Hibernate auto-DDL?",

      "**A:** `ddl-auto=update` is dangerous in production — it can drop columns, create wrong indexes, and has no rollback. **Flyway** provides versioned, repeatable, auditable SQL migrations. Each file (`V1__create_tables.sql`) runs exactly once, tracked in `flyway_schema_history`. Use `spring.jpa.hibernate.ddl-auto=validate` in production.",

      "## Q: How do I handle zero-downtime migrations?",

      "**A:** Use expand-and-contract: (1) **Expand:** Add new columns (backward compatible). (2) **Migrate:** Backfill data. (3) **Contract:** Remove old columns in a future release. Never rename columns in one step.",

      "## Q: How do I manage migrations in Kubernetes?",

      "**A:** Run migrations from a Kubernetes InitContainer or Job BEFORE deploying app pods. Never run from all pods simultaneously. Use Flyway's built-in advisory lock to prevent concurrent migrations.",
    ],
    code: `-- ============================================================
-- Flyway Migration Files (src/main/resources/db/migration/)
-- ============================================================

-- V1__create_tables.sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    total       NUMERIC(12,2) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- V2__add_order_items.sql
CREATE TABLE order_items (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT       NOT NULL REFERENCES orders(id),
    product_name VARCHAR(255) NOT NULL,
    quantity    INT          NOT NULL,
    price       NUMERIC(10,2) NOT NULL
);

-- V3__expand_phase.sql (Zero-downtime)
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
-- Old app ignores new column, new app writes to it

-- ============================================================
-- Spring Boot + Kubernetes Config
-- ============================================================
-- application.yml:
-- spring:
--   flyway:
--     enabled: true
--     locations: classpath:db/migration
--     baseline-on-migrate: true
--   jpa:
--     hibernate:
--       ddl-auto: validate

-- K8s InitContainer:
-- initContainers:
--   - name: flyway-migrate
--     image: flyway/flyway:10
--     command: ["flyway", "migrate"]
--     env:
--       - name: FLYWAY_URL
--         value: jdbc:postgresql://db-host:5432/myapp`,
    practice: "Write three Flyway migration files: V1 creates products table, V2 adds JSONB metadata column with GIN index, V3 creates a partial index on active products.",
    solution: `-- V1__create_products.sql:
-- CREATE TABLE products (
--     id BIGSERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- V2__add_metadata.sql:
-- ALTER TABLE products ADD COLUMN metadata JSONB DEFAULT '{}';
-- CREATE INDEX idx_products_metadata ON products USING gin(metadata);
--
-- V3__add_partial_index.sql:
-- CREATE INDEX idx_active_products ON products(name)
--     WHERE status = 'ACTIVE';`
  },
  {
    time: "Session 12",
    title: "Production Troubleshooting Runbook",
    concept: [
      "## Q: API response times jumped from 50ms to 2000ms. Diagnostic workflow?",

      "**A:** Step 1: Check HikariCP — `GET /actuator/metrics/hikaricp.connections.pending`. Pending > 0 → pool saturated. Step 2: Check PostgreSQL — `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`. Many 'idle in transaction' → connection leak. Step 3: Find slow queries — `SELECT pid, query, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state = 'active';`. Step 4: Check bloat — `SELECT relname, n_dead_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;`. Step 5: Check disk I/O (On-Prem: iostat, AWS: CloudWatch DiskQueueDepth).",

      "## Q: Connections max out during deployments. Why?",

      "**A:** Rolling deployments run old + new pods simultaneously, doubling connections. Fix: (1) Enable graceful shutdown: `server.shutdown=graceful`. (2) Reduce pool size to account for overlap. (3) Use RDS Proxy to absorb spikes. (4) Set `max-lifetime` shorter than deployment window.",

      "## Q: Queries are fast in dev but slow in production. Why?",

      "**A:** (1) Data volume difference (1K vs 10M rows). (2) Stale statistics — run `ANALYZE;`. (3) Missing indexes (dev uses ddl-auto, prod uses Flyway — indexes may be missing). (4) Connection contention (200 concurrent users vs 1). (5) Network latency. Use `EXPLAIN (ANALYZE, BUFFERS)` in production.",

      "## Q: How do I handle database failover?",

      "**A:** On-Prem with PgBouncer: auto-redirects after promotion. AWS RDS Multi-AZ: 1-2 min DNS failover. Aurora: < 30s. Spring Boot: enable connection validation (`connection-test-query: SELECT 1`), add `@Retryable` for transient SQL errors.",

      "## Q: Weekly production health checklist?",

      "**A:** (1) Cache hit ratio > 99%. (2) No unused indexes. (3) Dead tuple ratio < 10% on hot tables. (4) No long-running transactions > 5min. (5) Connection count < 70% of max. (6) Zero temp file usage. (7) Replication lag < 1s. (8) Table sizes trending normally. (9) All Flyway migrations applied. (10) Backup retention verified.",
    ],
    code: `-- ============================================================
-- Production Troubleshooting — Copy-Paste Ready
-- ============================================================

-- 1. Connection Summary
SELECT state, count(*) FROM pg_stat_activity
WHERE datname = 'myapp' GROUP BY state ORDER BY count DESC;

-- 2. Long-Running Queries (> 1 minute)
SELECT pid, usename,
       age(clock_timestamp(), query_start) AS duration,
       left(query, 120) AS query
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - interval '1 minute';

-- 3. Blocked Queries (lock contention)
SELECT blocked.pid, blocked.query AS waiting_query,
       blocking.pid AS blocker, blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- 4. Table Bloat Check
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 1) AS bloat_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 5000 ORDER BY n_dead_tup DESC;

-- 5. Unused Indexes
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 6. Database Size Breakdown
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total,
       pg_size_pretty(pg_relation_size(relid)) AS data,
       pg_size_pretty(pg_indexes_size(relid)) AS indexes
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC LIMIT 15;

-- 7. Cache Hit Ratio
SELECT round(sum(blks_hit) * 100.0 /
  NULLIF(sum(blks_hit + blks_read), 0), 2) AS hit_pct
FROM pg_stat_database WHERE datname = 'myapp';

-- ============================================================
-- Spring Boot Resilience Config
-- ============================================================
-- spring.datasource.hikari.connection-test-query: SELECT 1
-- spring.datasource.hikari.validation-timeout: 3000
-- spring.lifecycle.timeout-per-shutdown-phase: 30s
-- server.shutdown: graceful`,
    practice: "Your app shows intermittent 504 timeouts. Diagnose whether the issue is pool exhaustion, slow queries, lock contention, or table bloat using the queries above.",
    solution: `# 1. Pool: GET /actuator/metrics/hikaricp.connections.pending
#    pending > 0 → pool exhaustion → increase max-pool-size
#
# 2. Connections: SELECT state, count(*) FROM pg_stat_activity
#    Many 'idle in transaction' → connection leak
#
# 3. Slow queries: SELECT pid, query, duration FROM pg_stat_activity
#    Queries > 30s → need EXPLAIN ANALYZE + indexing
#
# 4. Locks: Check pg_blocking_pids for lock contention
#
# 5. Bloat: Check n_dead_tup — high values → run VACUUM`
  },
];
