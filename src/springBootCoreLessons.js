export const springBootCoreLessons = [
  {
    time: "Hour 1",
    title: "Spring Boot 3 Fundamentals",
    concept: [
      "**Spring Framework** is a comprehensive Java platform that simplifies enterprise development through **Inversion of Control (IoC)** and **Dependency Injection (DI)**. Instead of your code creating its own dependencies, the Spring Container creates and injects them for you. The core container (`ApplicationContext`) manages the full lifecycle of every object (bean) — creation, wiring, initialization, and destruction.",
      "**Spring Boot** builds on top of Spring Framework by providing **auto-configuration**, **embedded servers**, and **opinionated defaults**. A single `@SpringBootApplication` annotation bootstraps everything — component scanning, auto-config, and the embedded Tomcat server. Under the hood, `@SpringBootApplication` is a meta-annotation combining three: `@Configuration` (marks the class as a bean definition source), `@EnableAutoConfiguration` (triggers classpath-based auto-configuration), and `@ComponentScan` (scans the current package and sub-packages for `@Component`, `@Service`, `@Repository`, `@Controller` annotated classes).",
      "**Auto-Configuration Internals:** When the app starts, Spring Boot inspects the classpath via `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. If it finds `postgresql` on the classpath, it auto-configures a `DataSource`. If Jackson is present, it configures JSON serialization. You can see exactly which auto-configs activated by adding `--debug` to the startup command or setting `debug=true` in `application.properties`.",
      "**Starters** are curated dependency bundles. Adding `spring-boot-starter-web` pulls in Spring MVC, Jackson JSON, Tomcat, and validation. Adding `spring-boot-starter-data-jpa` pulls in Hibernate, HikariCP, and Spring Data. Starters follow a naming convention: `spring-boot-starter-*` for official starters. Third-party starters use `*-spring-boot-starter`. Each starter has a transitive dependency tree carefully curated to avoid version conflicts through the `spring-boot-dependencies` BOM (Bill of Materials).",
      "**Configuration Hierarchy:** Spring Boot reads configuration from multiple sources in priority order: (1) Command-line args, (2) Environment variables, (3) `application.yml` / `application.properties`, (4) Default values. Profiles let you swap configs per environment. A higher-priority source overrides a lower one. For example, `SPRING_DATASOURCE_URL` env var overrides `spring.datasource.url` in YAML.",
      "**Profiles** provide environment-specific configuration. Use `application-dev.yml` and `application-prod.yml` for per-environment settings. Activate via `spring.profiles.active=dev` or `SPRING_PROFILES_ACTIVE=dev`. Profile-specific files merge with and override the base `application.yml`. You can also group profiles in Spring Boot 3: `spring.profiles.group.production=proddb,prodmetrics` activates multiple profiles together.",
      "**Embedded Servers:** Spring Boot includes an embedded Tomcat (default), Jetty, or Undertow server. You don't need to deploy a WAR file to an external server. This makes your application a self-contained JAR that can be started with `java -jar`. For production, Tomcat's thread pool defaults to 200 threads (`server.tomcat.threads.max`). You can switch to Jetty by excluding `spring-boot-starter-tomcat` and adding `spring-boot-starter-jetty`.",
    ],
    code: `// === Spring Boot 3.4.x + Java 21 Project Anatomy ===

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

// pom.xml — Minimal Dependencies
// <parent>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-parent</artifactId>
//     <version>3.4.5</version>
// </parent>
// <properties><java.version>21</java.version></properties>
// <dependencies>
//     <dependency>
//         <groupId>org.springframework.boot</groupId>
//         <artifactId>spring-boot-starter-web</artifactId>
//     </dependency>
// </dependencies>

// application.yml
// server:
//   port: 8081
// spring:
//   application:
//     name: demo-service
//   profiles:
//     active: dev`,
    practice: "Create a new Spring Boot project with Java 21, Spring Boot 3.4.x, and the Web starter. Add a GET endpoint returning 'Hello, Spring Boot 3!' and run it.",
    solution: `// @RestController
// public class HelloController {
//     @GetMapping("/hello")
//     public String hello() {
//         return "Hello, Spring Boot 3!";
//     }
// }
// Run: mvn spring-boot:run
// Test: curl http://localhost:8080/hello`
  },
  {
    time: "Hour 2",
    title: "Dependency Injection Deep Dive",
    concept: [
      "**IoC Container:** At startup, Spring scans for classes annotated with stereotype annotations (`@Component`, `@Service`, `@Repository`, `@Controller`) and creates singleton instances called **Beans** living in the **ApplicationContext**. The container fully manages each bean's lifecycle — from instantiation through dependency resolution, initialization callbacks, and eventual destruction.",
      "**Stereotype Annotations Explained:** `@Component` is the generic stereotype. `@Service` marks business logic classes (no extra behavior, but signals intent). `@Repository` marks data access classes AND enables automatic exception translation — Spring converts JDBC/JPA exceptions into its own `DataAccessException` hierarchy. `@Controller` marks web controllers that return views; `@RestController` returns JSON/XML directly.",
      "**Constructor Injection** is the recommended DI style. Spring automatically injects the required beans via the constructor. If a class has exactly one constructor, `@Autowired` is optional. This makes dependencies explicit and immutable. Constructor injection also makes classes easier to unit test — you can pass mock dependencies directly without reflection or Spring context.",
      "**Field Injection Anti-Pattern:** While `@Autowired private SomeService service;` works, it hides dependencies, breaks immutability, makes the class impossible to construct outside Spring (e.g., in unit tests), and bypasses compile-time checks. Always prefer constructor injection. Spring will error at startup if a dependency is missing, rather than at runtime.",
      "**@Qualifier vs @Primary:** When multiple beans of the same type exist, use `@Primary` to mark a default, or `@Qualifier(\"beanName\")` at the injection point to pick a specific one. `@Primary` is resolved at the injection point, not at bean creation. If both `@Primary` and `@Qualifier` are present, `@Qualifier` wins. You can also group beans using custom qualifiers (create your own annotation annotated with `@Qualifier`).",
      "**Profiles:** Mark beans with `@Profile(\"dev\")` or `@Profile(\"prod\")` to conditionally load them. Combined with `spring.profiles.active=dev`, this lets you swap implementations without changing code. Use `@Profile(\"!prod\")` for negation (loaded everywhere except prod). Multiple profiles: `@Profile({\"dev\", \"staging\"})` means the bean loads in either.",
      "**Circular Dependencies:** If BeanA needs BeanB and BeanB needs BeanA via constructor injection, Spring throws `UnsatisfiedDependencyException` at startup. This is intentional — circular deps signal a design problem. Refactor by extracting shared logic into a third bean, or use `@Lazy` on one constructor parameter to break the cycle (creates a proxy resolved later).",
    ],
    code: `// === Dependency Injection Patterns ===

// 1. Service Layer with Constructor Injection
@Service
public class OrderService {
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;

    // @Autowired is optional with single constructor
    public OrderService(PaymentGateway paymentGateway, NotificationService notificationService) {
        this.paymentGateway = paymentGateway;
        this.notificationService = notificationService;
    }
}

// 2. Interface + Multiple Implementations
public interface NotificationService { void send(String message); }

@Service
@Primary  // Default when no @Qualifier is specified
public class EmailNotificationService implements NotificationService {
    @Override
    public void send(String message) { System.out.println("EMAIL: " + message); }
}

@Service("smsNotification")
public class SmsNotificationService implements NotificationService {
    @Override
    public void send(String message) { System.out.println("SMS: " + message); }
}

// 3. Choosing a specific implementation
@Service
public class AlertService {
    public AlertService(@Qualifier("smsNotification") NotificationService sms) {
        this.sms = sms;
    }
}

// 4. Profile-Based Bean Loading
@Service @Profile("dev")
public class MockPaymentGateway implements PaymentGateway {
    @Override public void charge(String item) { System.out.println("MOCK charge"); }
}

@Service @Profile("prod")
public class StripePaymentGateway implements PaymentGateway {
    @Override public void charge(String item) { /* Real Stripe call */ }
}`,
    practice: "Create an interface CacheService with RedisCacheService (prod) and InMemoryCacheService (dev). Use @Profile to wire them conditionally.",
    solution: `// public interface CacheService { void put(String k, String v); String get(String k); }
// @Service @Profile("prod")
// public class RedisCacheService implements CacheService { ... }
// @Service @Profile("dev")
// public class InMemoryCacheService implements CacheService {
//     private final Map<String, String> store = new ConcurrentHashMap<>();
//     ...
// }
// Run with: mvn spring-boot:run -Dspring-boot.run.profiles=dev`
  },
  {
    time: "Hour 3",
    title: "REST Controllers & Exception Handling",
    concept: [
      "**@RestController** combines `@Controller` and `@ResponseBody`. Every method return value is serialized to JSON via Jackson and written directly into the HTTP response body. Jackson uses getter methods by default to discover fields. For Java Records (recommended for DTOs), Jackson uses the canonical constructor and component accessors automatically.",
      "**Request Mapping:** `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` are shortcuts for `@RequestMapping(method = ...)`. Use `@PathVariable` for URI templates (`/users/{id}`), `@RequestParam` for query strings (`?page=0&size=10`), and `@RequestBody` for JSON payloads (deserialized by Jackson). `@PathVariable` matches the method parameter name by default; use `@PathVariable(\"userId\")` if names differ.",
      "**Content Negotiation:** Spring MVC supports JSON (default), XML, and other formats. The `Accept` header determines the response format. Add `jackson-dataformat-xml` to the classpath and Spring auto-configures XML support. Use `produces = \"application/json\"` on `@GetMapping` to restrict response type explicitly.",
      "**ResponseEntity** gives full control over the HTTP response — status code, headers, and body. `ResponseEntity.created(uri).body(user)` returns 201 Created with a Location header. Use `ResponseEntity.noContent().build()` for 204 (successful delete), and `ResponseEntity.ok(body)` for 200. Always return proper HTTP status codes — 201 for creation, 204 for deletion, 400 for validation errors, 404 for not found.",
      "**DTOs with Java Records:** Use Java Records as request/response DTOs. Records are immutable, have auto-generated `equals()`, `hashCode()`, and `toString()`, and their canonical constructor integrates seamlessly with Jackson deserialization and Bean Validation annotations.",
      "**Global Exception Handling:** Use `@ControllerAdvice` + `@ExceptionHandler` to centralize error responses instead of try-catch in every controller. `@RestControllerAdvice` is a convenience combining `@ControllerAdvice` and `@ResponseBody`. Order multiple advice classes with `@Order` annotation. Each `@ExceptionHandler` method handles a specific exception type and returns a structured error response.",
      "**API Versioning Strategies:** (1) URI versioning: `/api/v1/users` (most common, explicit). (2) Header versioning: `Accept: application/vnd.company.v1+json`. (3) Query parameter: `/api/users?version=1`. URI versioning is recommended for its simplicity and discoverability.",
    ],
    code: `// === Production-Grade REST API ===

// 1. DTO using Java Record
public record CreateUserRequest(
    @NotBlank String name, @Email String email, @Min(18) int age
) {}
public record UserResponse(Long id, String name, String email, int age, Instant createdAt) {}

// 2. REST Controller
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) { this.userService = userService; }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        UserResponse created = userService.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

// 3. Global Exception Handler
public record ErrorResponse(int status, String error, String message, Instant timestamp) {}

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(404, "Not Found", ex.getMessage(), Instant.now());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return new ErrorResponse(400, "Validation Failed", errors, Instant.now());
    }
}

// 4. Custom Exception
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " with id " + id + " not found");
    }
}`,
    practice: "Add a PUT /api/v1/users/{id} endpoint that updates a user. Return 200 OK with the updated body, or throw ResourceNotFoundException for a 404.",
    solution: `// @PutMapping("/{id}")
// public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody CreateUserRequest req) {
//     return ResponseEntity.ok(userService.update(id, req));
// }
// In UserService:
// public UserResponse update(Long id, CreateUserRequest req) {
//     User user = userRepository.findById(id)
//         .orElseThrow(() -> new ResourceNotFoundException("User", id));
//     user.setName(req.name()); user.setEmail(req.email()); user.setAge(req.age());
//     return toResponse(userRepository.save(user));
// }`
  },
  {
    time: "Hour 4",
    title: "Bean Lifecycle, Scopes & Configuration",
    concept: [
      "**Bean Lifecycle:** Constructor -> DI -> `@PostConstruct` -> Bean ready. On shutdown: `@PreDestroy` for cleanup. This is the lifecycle for singleton beans (the default). The full lifecycle is: (1) Instantiation via constructor, (2) Dependency injection, (3) `BeanPostProcessor.postProcessBeforeInitialization()`, (4) `@PostConstruct` methods, (5) `InitializingBean.afterPropertiesSet()`, (6) `BeanPostProcessor.postProcessAfterInitialization()`, (7) Bean is ready. Understanding this chain is critical for debugging initialization order issues.",
      "**Bean Scopes:** `singleton` (default): one instance per ApplicationContext — shared across all injection points. `prototype`: new instance every time the bean is requested from the container (Spring does NOT manage prototype bean destruction — you must clean up yourself). `request`: one per HTTP request (web only). `session`: one per HTTP session (web only). `application`: one per `ServletContext` (rare).",
      "**Scope Interaction Pitfall:** Injecting a `prototype` or `request`-scoped bean into a `singleton` always returns the same instance (captured at singleton creation time). Fix this by injecting `ObjectProvider<RequestScopedBean>` or `@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)` on the shorter-lived bean, which creates a proxy that delegates to the correct instance per scope.",
      "**@ConfigurationProperties** is the type-safe way to bind external config to a Java record. Instead of scattering `@Value`, group related settings and bind a whole prefix at once. Spring Boot performs relaxed binding: `gateway-url` in YAML maps to `gatewayUrl` in Java. It supports `Duration` (e.g., `30s`, `5m`), `DataSize` (e.g., `10MB`), lists, maps, and nested objects. Add `@Validated` with Jakarta constraints (`@NotBlank`, `@Min`, etc.) for startup validation — the app fails fast if config is invalid.",
      "**@Value vs @ConfigurationProperties:** `@Value(\"${app.timeout}\")` injects a single property and supports SpEL expressions. `@ConfigurationProperties` binds an entire prefix hierarchy at once, supports type-safe access, IDE auto-completion via `spring-boot-configuration-processor`, and validation. Rule of thumb: use `@Value` for one-off values; use `@ConfigurationProperties` for groups of related config.",
      "**Custom Beans via @Bean:** When you need to configure a third-party library class (which you can't annotate with `@Service` since you don't own the source code), use a `@Configuration` class with `@Bean` methods. The method name becomes the bean name by default. Use `@Bean(name = \"customName\")` to override. Spring calls `@Bean` methods in **full mode** (with CGLIB proxying) — calling one `@Bean` method from another returns the singleton, not a new instance.",
      "**Conditional Beans:** `@ConditionalOnProperty(name = \"feature.x\", havingValue = \"true\")` creates the bean only if the property is set. `@ConditionalOnMissingBean(SomeService.class)` creates a default only when no other bean of that type exists — this is how auto-configuration provides sensible defaults that you can override.",
    ],
    code: `// === Bean Lifecycle & Configuration ===

// 1. Lifecycle Hooks
@Component
public class CacheWarmer {
    @PostConstruct
    public void init() { System.out.println("Loading hot data into cache..."); }
    @PreDestroy
    public void cleanup() { System.out.println("Flushing cache before shutdown..."); }
}

// 2. @ConfigurationProperties — Type-Safe Config
// application.yml:
// app:
//   payment:
//     gateway-url: https://api.stripe.com/v1
//     timeout: 30s
//     retry-count: 3

@ConfigurationProperties(prefix = "app.payment")
@Validated
public record PaymentProperties(
    @NotBlank String gatewayUrl, Duration timeout, int retryCount
) {}

// 3. Injecting it
@Service
public class PaymentService {
    private final PaymentProperties props;
    public PaymentService(PaymentProperties props) { this.props = props; }
    public void charge(BigDecimal amount) {
        System.out.println("Calling " + props.gatewayUrl() + " timeout=" + props.timeout());
    }
}

// 4. Custom @Bean for Third-Party Libraries
@Configuration
public class HttpClientConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("https://api.example.com")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}

// 5. Prototype Scope
@Component @Scope("prototype")
public class RequestTracer {
    private final String traceId = UUID.randomUUID().toString();
}`,
    practice: "Create a @ConfigurationProperties class binding 'app.notification' with from-email, smtp-host, smtp-port, and enabled. Add validation.",
    solution: `// @ConfigurationProperties(prefix = "app.notification")
// @Validated
// public record NotificationProperties(
//     @NotBlank String fromEmail, @NotBlank String smtpHost,
//     @Min(1) @Max(65535) int smtpPort, boolean enabled
// ) {}
// Inject into a service and check props.enabled() before sending.`
  },
  {
    time: "Hour 5",
    title: "Spring Data JPA & Hibernate Foundations",
    concept: [
      "**JPA (Jakarta Persistence API)** is a spec for ORM in Java. **Hibernate** is the default implementation in Spring Boot. You define Java entity classes that map to database tables, and Hibernate generates SQL. JPA is defined under the `jakarta.persistence` package (migrated from `javax.persistence` in Jakarta EE 9). Hibernate implements the JPA spec but also provides extensions like `@Formula`, `@NaturalId`, and `@BatchSize` that go beyond the standard.",
      "**Entities & Table Mapping:** Annotate a class with `@Entity` and `@Table`. `@Id` marks the primary key, `@GeneratedValue(strategy = GenerationType.IDENTITY)` lets the DB auto-increment it. Other strategies: `SEQUENCE` (uses a DB sequence — preferred for PostgreSQL for batch insert performance), `TABLE` (portable but slow), and `AUTO` (provider picks). Always use `@Column` to explicitly define constraints: `nullable`, `length`, `unique`, and `updatable` — don't rely on Hibernate defaults.",
      "**Entity Lifecycle States:** Every JPA entity is in one of four states: **New/Transient** (not yet persisted, no ID), **Managed** (attached to the persistence context, changes auto-tracked), **Detached** (was managed but context is closed), **Removed** (scheduled for deletion). Understanding these states is key to avoiding `LazyInitializationException` and unexpected UPDATE queries.",
      "**Spring Data JPA Repositories:** Extend `JpaRepository<Entity, IdType>` for full CRUD — `save()`, `findById()`, `findAll()`, `deleteById()`, `count()`, `existsById()`. Declare **derived query methods** by naming convention: `findByEmailAndStatus(String email, Status status)` — Spring parses the method name and generates SQL. Keywords include `And`, `Or`, `Between`, `LessThan`, `GreaterThan`, `Like`, `In`, `OrderBy`, `Not`, `IsNull`, `Containing`.",
      "**@Query and JPQL:** For complex queries, use `@Query` with JPQL (operates on entity classes/fields, not table/column names) or native SQL (`nativeQuery = true`). JPQL supports `JOIN FETCH` for eager loading, `DISTINCT` for deduplication, and named parameters (`:name`) or positional parameters (`?1`). For write operations, combine `@Query` with `@Modifying` and `@Transactional`.",
      "**Projections:** For performance, avoid loading entire entities when you only need 2-3 fields. Use **interface projections** (Spring creates a proxy implementing your interface with getters), **class-based projections** (DTOs in `@Query` constructors: `SELECT new com.app.dto.UserSummary(u.id, u.name) FROM User u`), or **dynamic projections** where the return type is a generic `<T>` parameter.",
    ],
    code: `// === Spring Data JPA Foundations ===

// 1. Entity Definition
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private int age;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = Instant.now(); }

    // Constructors, getters, setters...
    public User() {}
    public User(String name, String email, int age) {
        this.name = name; this.email = email; this.age = age;
    }
}

// 2. Repository Interface — Full CRUD for Free
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByAgeGreaterThanEqual(int minAge);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.name LIKE %:keyword%")
    List<User> searchByName(@Param("keyword") String keyword);

    @Query(value = "SELECT * FROM users WHERE created_at > :since", nativeQuery = true)
    List<User> findRecentUsers(@Param("since") Instant since);
}

// 3. Service Using the Repository
@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) { this.userRepository = userRepository; }

    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getAge(), user.getCreatedAt());
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new DuplicateResourceException("Email already registered");
        User saved = userRepository.save(new User(req.name(), req.email(), req.age()));
        return new UserResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getAge(), saved.getCreatedAt());
    }
}`,
    practice: "Write a derived query method that finds users by partial email domain (e.g., 'gmail.com') sorted by name ascending, then write the equivalent using @Query JPQL.",
    solution: `// Approach 1: Derived Query Method
// List<User> findByEmailContainingOrderByNameAsc(String domain);
// Approach 2: JPQL
// @Query("SELECT u FROM User u WHERE u.email LIKE %:domain% ORDER BY u.name ASC")
// List<User> findByEmailDomain(@Param("domain") String domain);`
  },
  {
    time: "Hour 6",
    title: "PostgreSQL Integration & Flyway Migrations",
    concept: [
      "**HikariCP:** Spring Boot auto-configures a HikariCP connection pool. You provide `spring.datasource.url`, `username`, and `password`. HikariCP is the fastest Java connection pool and the default. It maintains a pool of reusable database connections, avoiding the overhead of opening/closing connections for every query. Key tuning parameters: `maximum-pool-size` (max concurrent connections — typically 10-20 for most apps), `minimum-idle` (connections kept ready), `connection-timeout` (how long to wait for a connection before throwing), and `max-lifetime` (max age of a connection before recycling — should be less than your DB's timeout).",
      "**Why Flyway?** Using `ddl-auto=update` is dangerous in production — Hibernate might alter or drop columns unexpectedly, and there's no audit trail. **Flyway** manages schema changes via versioned SQL scripts (e.g., `V1__create_users.sql`). Each runs exactly once, tracked in `flyway_schema_history`. Scripts are immutable — once applied, never modify them; create a new version instead. Naming convention: `V{version}__{description}.sql` (double underscore separating version from description).",
      "**Flyway Lifecycle:** On startup, Flyway: (1) checks `flyway_schema_history` for applied migrations, (2) compares against scripts in `classpath:db/migration`, (3) applies any new scripts in version order, (4) validates checksums of already-applied scripts (fails if someone modified a past migration). For existing databases, use `baseline-on-migrate: true` to establish a starting point.",
      "**Docker Compose for PostgreSQL:** Run PostgreSQL in Docker for local dev. Spring Boot 3.1+ supports Docker Compose integration — add `spring-boot-docker-compose` starter to auto-start your `compose.yml` when the app boots.  Always include a `healthcheck` in your Docker Compose so dependent services wait until PostgreSQL is fully accepting connections.",
      "**Best Practices:** Always set HikariCP `maximum-pool-size`, `connection-timeout`. Use `spring.jpa.open-in-view=false` to prevent lazy-loading anti-patterns — with `open-in-view=true` (the default!), a database connection is held for the entire HTTP request, even during view rendering. This silently enables lazy-loading in templates/controllers, masks N+1 issues, and wastes connections. Set it to `false` and handle all data loading explicitly in the service layer.",
      "**Environment-Specific Config:** Use `spring.datasource.url` for local dev, but in production pass credentials via environment variables (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_PASSWORD`) or integrate with a secrets manager (AWS Secrets Manager, HashiCorp Vault). Never commit production passwords to `application.yml`.",
    ],
    code: `// === PostgreSQL + Flyway Production Setup ===

// 1. Maven Dependencies
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-data-jpa</artifactId>
// </dependency>
// <dependency>
//     <groupId>org.postgresql</groupId>
//     <artifactId>postgresql</artifactId>
//     <scope>runtime</scope>
// </dependency>
// <dependency>
//     <groupId>org.flywaydb</groupId>
//     <artifactId>flyway-database-postgresql</artifactId>
// </dependency>

// 2. application.yml
// spring:
//   datasource:
//     url: jdbc:postgresql://localhost:5432/myapp
//     username: myapp_user
//     password: secret
//     hikari:
//       maximum-pool-size: 20
//       minimum-idle: 5
//       connection-timeout: 30000
//   jpa:
//     hibernate:
//       ddl-auto: validate     # Flyway manages schema
//     open-in-view: false      # CRITICAL
//     show-sql: true
//   flyway:
//     enabled: true
//     locations: classpath:db/migration

// 3. Flyway Migration Scripts (src/main/resources/db/migration/)

// V1__create_users_table.sql
// CREATE TABLE users (
//     id BIGSERIAL PRIMARY KEY,
//     name VARCHAR(100) NOT NULL,
//     email VARCHAR(255) NOT NULL UNIQUE,
//     age INTEGER NOT NULL CHECK (age >= 0),
//     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_users_email ON users(email);

// V2__create_orders_table.sql
// CREATE TABLE orders (
//     id BIGSERIAL PRIMARY KEY,
//     user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     product VARCHAR(255) NOT NULL,
//     amount DECIMAL(10,2) NOT NULL,
//     status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
//     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );

// 4. Docker Compose for Local Dev
// services:
//   postgres:
//     image: postgres:17
//     environment:
//       POSTGRES_DB: myapp
//       POSTGRES_USER: myapp_user
//       POSTGRES_PASSWORD: secret
//     ports:
//       - "5432:5432"
//     volumes:
//       - pgdata:/var/lib/postgresql/data
//     healthcheck:
//       test: ["CMD-SHELL", "pg_isready -U myapp_user -d myapp"]
//       interval: 10s
// volumes:
//   pgdata:`,
    practice: "Write Flyway migrations V3__add_email_verified.sql (boolean column, default false) and V4__seed_admin.sql (insert admin user).",
    solution: `// V3__add_email_verified.sql
// ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

// V4__seed_admin.sql
// INSERT INTO users (name, email, age, email_verified, created_at)
// VALUES ('Admin', 'admin@example.com', 30, TRUE, NOW())
// ON CONFLICT (email) DO NOTHING;`
  },
  {
    time: "Hour 7",
    title: "JPA Relationships & Advanced Queries",
    concept: [
      "**Entity Relationships** mirror SQL foreign keys in object form. `@OneToMany` and `@ManyToOne` are the most common. The 'Many' side owns the foreign key column. Always define the owning side first (`@ManyToOne`) and then the inverse (`@OneToMany(mappedBy = \"...\")`).",
      "**Cascade Types:** `CascadeType.PERSIST` — saving the parent auto-saves children. `CascadeType.MERGE` — updating the parent auto-updates children. `CascadeType.REMOVE` — deleting the parent deletes children. `CascadeType.ALL` — all of the above plus `REFRESH` and `DETACH`. Use `orphanRemoval = true` to delete child entities that are removed from the parent's collection.",
      "**Fetch Strategies:** `FetchType.LAZY` (default for `@OneToMany`/`@ManyToMany`) — loads the association only when accessed. `FetchType.EAGER` (default for `@ManyToOne`/`@OneToOne`) — loads immediately with the parent. **Always use LAZY** and explicitly load when needed via `JOIN FETCH` or `@EntityGraph`. Eager fetching causes unexpected performance issues as your data grows.",
      "**The N+1 Problem:** Loading 100 users with orders fires 1+100 queries (1 for users, then 1 per user to load their orders). This is the most common JPA performance killer. Fix with: (1) `@EntityGraph(attributePaths = {\"orders\"})` — declarative, applied to repository methods. (2) `JOIN FETCH` in JPQL — `SELECT u FROM User u LEFT JOIN FETCH u.orders`. (3) `@BatchSize(size = 50)` on the collection — Hibernate batches lazy loads into groups.",
      "**Pagination & Sorting:** Pass a `Pageable` argument to any query method and Spring returns a `Page<T>` with content, total elements, total pages, and navigation metadata. Create `Pageable` instances with `PageRequest.of(page, size, Sort.by(\"createdAt\").descending())`. Use `Slice<T>` instead of `Page<T>` when you don't need total count (saves an extra `COUNT(*)` query).",
      "**Specifications (Dynamic Queries):** For search endpoints with optional filters (e.g., filter by name AND/OR status AND/OR date range), use `JpaSpecificationExecutor<T>` and programmatically compose `Predicate` objects. Each specification is a lambda returning a `Predicate`. Compose with `.and()`, `.or()`, `.where()`. This avoids writing dozens of query method variants for every filter combination.",
    ],
    code: `// === JPA Relationships & Advanced Querying ===

// 1. Entity Relationships
@Entity @Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String product;
    @Column(nullable = false) private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

public enum OrderStatus { PENDING, PROCESSING, COMPLETED, CANCELLED }

// In User entity — inverse side:
// @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
// private List<Order> orders = new ArrayList<>();

// 2. Fixing N+1 with @EntityGraph
public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = {"orders"})
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.age > :minAge")
    List<User> findUsersWithOrdersByAge(@Param("minAge") int minAge);
}

// 3. Pagination
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}

// 4. Specifications — Dynamic Query Builder
public class OrderSpecifications {
    public static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }
    public static Specification<Order> amountGreaterThan(BigDecimal min) {
        return (root, query, cb) -> min == null ? null : cb.greaterThanOrEqualTo(root.get("amount"), min);
    }
    public static Specification<Order> belongsToUser(Long userId) {
        return (root, query, cb) -> userId == null ? null : cb.equal(root.get("user").get("id"), userId);
    }
}
// Usage: orderRepository.findAll(Specification.where(hasStatus(s)).and(amountGreaterThan(min)), pageable);`,
    practice: "Create a @ManyToMany between User and Role with a join table. Write a repository method to find users by role name using @EntityGraph.",
    solution: `// @ManyToMany(fetch = FetchType.LAZY)
// @JoinTable(name = "user_roles",
//     joinColumns = @JoinColumn(name = "user_id"),
//     inverseJoinColumns = @JoinColumn(name = "role_id"))
// private Set<Role> roles = new HashSet<>();

// @EntityGraph(attributePaths = {"roles"})
// @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
// List<User> findByRoleName(@Param("roleName") String roleName);`
  },
  {
    time: "Hour 8",
    title: "Transactions, Auditing & Validation",
    concept: [
      "**@Transactional** wraps a method in a database transaction. If an exception is thrown, it rolls back. By default only rolls back on unchecked exceptions (`RuntimeException` and its subclasses). Add `rollbackFor = Exception.class` to include checked exceptions. **Critical gotcha:** `@Transactional` uses AOP proxies — it only works when the method is called from *outside* the class. If `methodA()` calls `methodB()` within the same class, `methodB()`'s `@Transactional` annotation is ignored (self-invocation bypasses the proxy).",
      "**Propagation:** `REQUIRED` (default): joins an existing transaction or creates one. `REQUIRES_NEW`: suspends the current transaction and creates a brand new one — useful for audit logs that must persist even if the main operation fails. `MANDATORY`: throws an exception if no existing transaction. `SUPPORTS`: participates in a transaction if one exists, otherwise runs non-transactionally. `NOT_SUPPORTED`: always runs non-transactionally, suspending any existing transaction. `NEVER`: throws if a transaction exists.",
      "**Isolation Levels:** `READ_COMMITTED` (PostgreSQL default): each query sees data committed before the query started. `REPEATABLE_READ`: all queries within the transaction see the same snapshot. `SERIALIZABLE`: strongest isolation, executes transactions as if they ran sequentially. Higher isolation = fewer anomalies but more contention. PostgreSQL defaults to `READ_COMMITTED`, which is correct for most applications.",
      "**JPA Auditing:** Use `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy` with `@EntityListeners(AuditingEntityListener.class)` for automatic timestamps. Enable with `@EnableJpaAuditing`. For `@CreatedBy`/`@LastModifiedBy`, provide an `AuditorAware<String>` bean that returns the current user (usually from `SecurityContextHolder`). Extend a `BaseEntity` with these fields so every entity inherits auditing automatically.",
      "**Bean Validation (Jakarta Validation):** Annotations like `@NotBlank`, `@Email`, `@Min`, `@Max`, `@Size`, `@Pattern`, `@Positive`, `@PastOrPresent` validate incoming DTOs before they reach your business logic. Use `@Valid` on controller method parameters to trigger validation automatically. Validation errors throw `MethodArgumentNotValidException`, which you handle in your `@ControllerAdvice` to return structured error responses. You can also create **custom validators** by implementing `ConstraintValidator<AnnotationType, FieldType>` for domain-specific rules.",
      "**@Transactional(readOnly = true):** Marks a transaction as read-only. Hibernate disables dirty-checking (no snapshot comparison on flush), the JDBC driver may route to read replicas, and PostgreSQL optimizes the transaction internally. Always annotate read-only service methods with `@Transactional(readOnly = true)` for performance. For a class with mostly reads, annotate the class with `@Transactional(readOnly = true)` and override individual write methods with `@Transactional`.",
    ],
    code: `// === Transactions, Auditing & Validation ===

// 1. @Transactional with Propagation
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;

    @Transactional(rollbackFor = Exception.class)
    public Order placeOrder(Long userId, String product, BigDecimal amount) {
        Order order = new Order();
        order.setProduct(product); order.setAmount(amount);
        Order saved = orderRepository.save(order);
        auditLogService.log("ORDER_PLACED", "Order #" + saved.getId());
        return saved;
    }
}

@Service
public class AuditLogService {
    // REQUIRES_NEW: persists even if caller rolls back
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String details) {
        auditLogRepository.save(new AuditLog(action, details, Instant.now()));
    }
}

// 2. JPA Auditing — Automatic Timestamps
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @CreatedDate @Column(name = "created_at", updatable = false) private Instant createdAt;
    @LastModifiedDate @Column(name = "updated_at") private Instant updatedAt;
    @CreatedBy @Column(name = "created_by", updatable = false) private String createdBy;
}

// Enable: @Configuration @EnableJpaAuditing
// public class JpaConfig {
//     @Bean public AuditorAware<String> auditorProvider() {
//         return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
//             .map(Authentication::getName);
//     }
// }

// 3. Bean Validation
public record CreateOrderRequest(
    @NotBlank @Size(min = 2, max = 200) String product,
    @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal amount,
    @NotNull @Positive Long userId
) {}`,
    practice: "Explain the difference between @Transactional(readOnly = true) and regular @Transactional.",
    solution: `// readOnly=true:
// 1. Hibernate skips dirty-checking (no snapshot comparison on flush)
// 2. PostgreSQL driver may route to read replicas
// Performance boost: Loading 10,000 entities for a dashboard without readOnly
// means Hibernate snapshots all 10k objects for comparison — massive overhead.
// With readOnly, that entire dirty-check loop is bypassed.`
  },
  {
    time: "Hour 9",
    title: "Spring Security & Keycloak OAuth2 Resource Server",
    concept: [
      "**Spring Security** intercepts every HTTP request through a chain of **Filters** before it hits your controller. The `SecurityFilterChain` bean defines which URLs need authentication and how tokens are validated. The filter chain includes: `CorsFilter` (CORS), `CsrfFilter` (CSRF protection), `AuthorizationFilter` (URL-level authorization), and `BearerTokenAuthenticationFilter` (JWT extraction and validation). You can add custom filters at specific positions in this chain.",
      "**OAuth2 Resource Server:** Adding `spring-boot-starter-oauth2-resource-server` tells Spring to expect a `Bearer` JWT in the `Authorization` header. Configure `issuer-uri` to your Keycloak realm. The flow: (1) Client sends `Authorization: Bearer <jwt>` header, (2) Spring extracts the token, (3) Fetches the JWKS (JSON Web Key Set) from `{issuer-uri}/protocol/openid-connect/certs`, (4) Validates the token signature, expiry, and issuer, (5) Creates an `Authentication` object with the token's claims.",
      "**JWT Validation Details:** Spring validates: (1) **Signature** — using RSA/EC public keys from the JWKS endpoint. (2) **Expiry** (`exp` claim) — rejects expired tokens. (3) **Issuer** (`iss` claim) — must match the configured `issuer-uri`. (4) **Not Before** (`nbf` claim) — token must be valid for current time. The JWKS is cached and refreshed periodically (configurable via `spring.security.oauth2.resourceserver.jwt.jwk-set-cache-lifespan`).",
      "**Keycloak Role Mapping:** Keycloak puts roles under `realm_access.roles` in the JWT payload. Spring Security defaults to reading `scope` for authorities. You must write a custom `JwtAuthenticationConverter` that extracts Keycloak's realm roles and maps them to Spring `GrantedAuthority` objects prefixed with `ROLE_`. Without this converter, `hasRole('ADMIN')` checks will always fail even if the JWT contains the correct roles.",
      "**Stateless Sessions:** JWTs are self-contained — all identity and authorization data is inside the token. The server doesn't need sessions. Set `SessionCreationPolicy.STATELESS` and disable CSRF (since we don't use cookies for auth). This means: (1) No session cookies, (2) No server-side session storage, (3) Any API instance can validate any token — horizontal scaling is trivial, (4) Token revocation requires additional infrastructure (token blacklists or short expiry + refresh tokens).",
      "**Security Debugging:** Enable `logging.level.org.springframework.security=DEBUG` to see the full filter chain execution, which filters pass/reject, and why authentication fails. This is invaluable when diagnosing 401/403 errors. Also check `SecurityContextHolder.getContext().getAuthentication()` in your code to see the current authenticated principal.",
    ],
    code: `// === Spring Boot + Keycloak OAuth2 Resource Server ===

// 1. Dependencies: spring-boot-starter-security + spring-boot-starter-oauth2-resource-server

// 2. application.yml
// spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:8080/realms/company-realm

// 3. Keycloak Role Converter
@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
    @Override
    @SuppressWarnings("unchecked")
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return Collections.emptyList();
        List<String> roles = (List<String>) realmAccess.get("roles");
        if (roles == null) return Collections.emptyList();
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
}

// 4. SecurityFilterChain
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {
    private final KeycloakRoleConverter keycloakRoleConverter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);

        http
            .cors(cors -> cors.configurationSource(corsSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}`,
    practice: "Extend the KeycloakRoleConverter to also extract roles from resource_access.<client_id>.roles and merge them with realm roles.",
    solution: `// Add to convert() method:
// Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
// if (resourceAccess != null) {
//     resourceAccess.values().forEach(clientObj -> {
//         Map<String, Object> clientMap = (Map<String, Object>) clientObj;
//         List<String> clientRoles = (List<String>) clientMap.get("roles");
//         if (clientRoles != null) allRoles.addAll(clientRoles);
//     });
// }`
  },
  {
    time: "Hour 10",
    title: "Securing Endpoints, CORS & Method Security",
    concept: [
      "**@PreAuthorize** enables fine-grained access control on individual methods using SpEL (Spring Expression Language). Common patterns: `hasRole('ADMIN')`, `hasAnyRole('USER','MANAGER')`, `#userId == authentication.name` (owner check), `@securityBean.customCheck(authentication, #id)` (delegate to a custom bean). SpEL expressions can access: `authentication` (the current user), `#paramName` (method parameters via `@P` or debug info), and any Spring bean via `@beanName`.",
      "**@PreAuthorize vs @PostAuthorize:** `@PreAuthorize` runs BEFORE the method executes — if the check fails, the method body never runs. `@PostAuthorize` runs AFTER the method returns and can access the return value via `returnObject`. Example: `@PostAuthorize(\"returnObject.createdBy == authentication.name\")` ensures users can only see their own data. Use `@PostAuthorize` sparingly — the work is already done even if authorization fails.",
      "**@EnableMethodSecurity** must be placed on your `@Configuration` class to activate `@PreAuthorize`, `@PostAuthorize`, and `@Secured` annotations throughout your application's beans. Without this annotation, `@PreAuthorize` is silently ignored. In Spring Security 6+, `@EnableMethodSecurity` uses proxy-based AOP by default. Set `prePostEnabled = true` (default) for `@PreAuthorize`/`@PostAuthorize`, `securedEnabled = true` for `@Secured`, and `jsr250Enabled = true` for `@RolesAllowed`.",
      "**CORS (Cross-Origin Resource Sharing)** is critical for frontend-backend architecture. Without it, the browser blocks cross-origin requests (e.g., React on `localhost:3000` calling API on `localhost:8081`). In Spring Security, CORS is processed BEFORE authentication — if CORS fails, the request is rejected before reaching the security filter. The browser sends a **preflight** `OPTIONS` request first; your CORS config must respond to it. Configure `allowedOrigins` (never use `*` in production with credentials), `allowedMethods`, `allowedHeaders`, and `allowCredentials`.",
      "**Audit Logging in Controllers:** By injecting `JwtAuthenticationToken` into controller methods, you can extract the user's identity (`sub` claim), email (`email` claim), preferred username, and roles directly from the validated JWT — no database lookup required for basic identity information. This enables audit trails, logging which user performed which operation, without additional infrastructure.",
      "**Custom Security Beans:** For complex authorization logic (e.g., checking resource ownership), create a `@Component` and reference it in `@PreAuthorize` via `@beanName.methodName(...)`. Spring injects the authentication and method parameters automatically. This keeps your security logic testable, reusable, and out of your business service layer.",
    ],
    code: `// === Method Security & Audit Logging ===

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    // Any authenticated user views their own orders
    @GetMapping("/my")
    public List<OrderResponse> getMyOrders(JwtAuthenticationToken auth) {
        return orderService.findByUserId(auth.getName());
    }

    // Admin only
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderService.findAll(pageable);
    }

    // Admin OR resource owner
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Create with audit trail from JWT claims
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest req, JwtAuthenticationToken auth) {
        Jwt jwt = (Jwt) auth.getCredentials();
        System.out.println("Order by: " + jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.status(201).body(orderService.create(req, auth.getName()));
    }
}

// Custom Security Bean
@Component("orderSecurity")
public class OrderSecurity {
    private final OrderRepository orderRepository;
    public boolean isOwner(Authentication auth, Long orderId) {
        return orderRepository.findById(orderId)
                .map(o -> o.getCreatedBy().equals(auth.getName())).orElse(false);
    }
}`,
    practice: "Write @PreAuthorize allowing access only if user is owner OR ADMIN OR (MANAGER in same department via JWT claim).",
    solution: `// @PreAuthorize("#userId == authentication.name or hasRole('ADMIN') " +
//     "or (hasRole('MANAGER') and @deptCheck.sameDept(authentication, #userId))")
// public UserProfile getProfile(@PathVariable String userId) { ... }

// @Component("deptCheck")
// public class DepartmentCheck {
//     public boolean sameDept(Authentication auth, String targetUserId) {
//         Jwt jwt = ((JwtAuthenticationToken) auth).getToken();
//         return userService.getDepartment(targetUserId)
//             .equals(jwt.getClaimAsString("department"));
//     }
// }`
  },
  {
    time: "Hour 11",
    title: "Testing: Unit, Integration & Testcontainers",
    concept: [
      "**Testing Pyramid:** Unit tests (fast, isolated, mock dependencies) form the base — they test individual classes in isolation. Integration tests (`@SpringBootTest`) load the full ApplicationContext and test real wiring between components. End-to-end tests hit the actual database and external services. Aim for ~70% unit, ~20% integration, ~10% E2E. Spring Boot provides excellent tooling for all three layers.",
      "**@WebMvcTest** slices the context to only load the web layer (controllers, filters, exception handlers, converters). Combined with `MockMvc`, you can test HTTP request/response cycles without starting a real server. Dependencies are mocked with `@MockitoBean` (Spring Boot 3.4+, replaces `@MockBean`). Only beans relevant to the web layer are created, making tests fast. Use `@WebMvcTest(UserController.class)` to scope to a specific controller.",
      "**@DataJpaTest** slices the context to only JPA components (entities, repositories, `EntityManager`). By default, it uses an embedded H2 database and rolls back after each test via `@Transactional`. For PostgreSQL-specific tests (e.g., native queries, stored procedures), use **Testcontainers** instead of H2. `@DataJpaTest` also auto-configures Flyway/Liquibase if present.",
      "**Testcontainers** spins up real Docker containers (PostgreSQL, Redis, Kafka, Elasticsearch) during tests. With `@ServiceConnection` (Spring Boot 3.1+), Spring auto-configures the datasource to point to the temporary container — zero manual property configuration. The container starts fresh for each test class, ensuring isolation. Declare the container as `static` to share it across test methods within the same class.",
      "**Test Isolation & Best Practices:** Use `@Sql` to seed test data before each test. Use `@DirtiesContext` when a test modifies the ApplicationContext (expensive — avoid when possible). For security testing, use `@WithMockUser(roles = \"ADMIN\")` or `@WithJwt` (from spring-security-test) to simulate authenticated users without a real Keycloak. Name tests descriptively: `methodName_shouldExpectedBehavior_whenCondition()`.",
      "**AssertJ & MockMvc Assertions:** AssertJ provides fluent assertions: `assertThat(result).isNotNull().extracting(User::getName).isEqualTo(\"Alice\")`. MockMvc assertions verify HTTP responses: `status().isOk()`, `jsonPath(\"$.name\").value(\"Bob\")`, `content().contentType(\"application/json\")`, `header().string(\"Location\", ...)`. Combine both for comprehensive testing.",
    ],
    code: `// === Testing Strategies ===

// 1. Unit Test with Mockito
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void findById_returnsUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User("Alice", "a@t.com", 25)));
        UserResponse result = userService.findById(1L);
        assertThat(result.name()).isEqualTo("Alice");
        verify(userRepository).findById(1L);
    }

    @Test
    void findById_throwsWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

// 2. Controller Test with MockMvc
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private UserService userService;

    @Test
    void getUser_returns200() throws Exception {
        when(userService.findById(1L)).thenReturn(new UserResponse(1L, "Bob", "b@t.com", 30, Instant.now()));
        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bob"));
    }
}

// 3. Integration Test with Testcontainers + PostgreSQL
@SpringBootTest
@Testcontainers
class UserRepositoryIntegrationTest {
    @Container
    @ServiceConnection  // Auto-configures datasource!
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired private UserRepository userRepository;

    @Test
    void shouldSaveAndRetrieve() {
        User saved = userRepository.save(new User("Charlie", "c@t.com", 28));
        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.findByEmail("c@t.com")).isPresent();
    }
}`,
    practice: "Write a @WebMvcTest verifying DELETE /api/v1/users/99 returns 404 when user doesn't exist.",
    solution: `// @Test
// void deleteUser_returns404() throws Exception {
//     doThrow(new ResourceNotFoundException("User", 99L)).when(userService).delete(99L);
//     mockMvc.perform(delete("/api/v1/users/99"))
//             .andExpect(status().isNotFound())
//             .andExpect(jsonPath("$.message").value("User with id 99 not found"));
// }`
  },
  {
    time: "Hour 12",
    title: "Production Setup: Actuator, Docker & Docker Compose",
    concept: [
      "**Spring Boot Actuator** provides production-ready endpoints for monitoring and management: `/actuator/health` (liveness/readiness for Kubernetes), `/actuator/metrics` (JVM memory, CPU, HTTP request counts, custom metrics), `/actuator/info` (build info, git commit), `/actuator/env` (configuration dump), `/actuator/loggers` (change log levels at runtime without restart), and `/actuator/prometheus` (Prometheus-format metrics for Grafana dashboards). Control exposure with `management.endpoints.web.exposure.include`.",
      "**Actuator Security:** By default, only `/actuator/health` is exposed. In production, never expose `/actuator/env` or `/actuator/configprops` publicly — they reveal secrets. Either restrict via Spring Security (`requestMatchers(\"/actuator/**\").hasRole(\"OPS\")`) or use a separate management port (`management.server.port=9090`) that's not internet-facing. `show-details: when_authorized` requires authentication to see health check details.",
      "**Multi-Stage Dockerfile:** Build the JAR inside a Maven/Gradle container (stage 1), then copy only the JAR into a minimal JRE image (stage 2). This keeps the production image small (~200MB instead of 1GB) and eliminates build tools from the runtime attack surface. Use `eclipse-temurin:21-jre-alpine` as the runtime base. Cache `mvn dependency:go-offline` in a separate layer so dependency downloads are cached across builds.",
      "**Docker Compose for Full Stack:** Orchestrate Spring Boot + PostgreSQL + Keycloak in a single `docker-compose.yml`. Use `depends_on` with health checks (`condition: service_healthy`) to ensure PostgreSQL is ready before Spring Boot connects. Use environment variables for all config — never bake secrets into the Docker image. Map `SPRING_*` env vars (e.g., `SPRING_DATASOURCE_URL`) to override any Spring property.",
      "**Health Checks & Graceful Shutdown:** Configure Actuator health groups for Kubernetes probes: `/actuator/health/liveness` (is the JVM alive?) and `/actuator/health/readiness` (is the app ready to serve traffic?). Enable with `management.endpoint.health.probes.enabled=true`. For graceful shutdown, set `server.shutdown=graceful` so in-flight requests complete before the container stops. Bound the wait with `spring.lifecycle.timeout-per-shutdown-phase=30s`.",
      "**Custom Health Indicators:** Implement `HealthIndicator` to add custom health checks — e.g., verify connectivity to a downstream API, check disk space, or validate license status. Return `Health.up().withDetail(\"key\", \"value\").build()` or `Health.down().withException(ex).build()`. Custom indicators automatically appear in `/actuator/health` and contribute to the aggregated health status.",
      "**Production Checklist:** (1) Set `spring.jpa.open-in-view=false`. (2) Configure HikariCP pool sizes. (3) Enable Actuator health probes. (4) Use Flyway for schema management. (5) Externalize all secrets via env vars or secrets manager. (6) Enable graceful shutdown. (7) Use multi-stage Docker builds. (8) Set appropriate log levels (`INFO` for production, `DEBUG` for troubleshooting). (9) Monitor with Prometheus + Grafana. (10) Add `@Transactional(readOnly=true)` to read operations.",
    ],
    code: `// === Production Docker Compose ===

// 1. Actuator Config (application.yml)
// management:
//   endpoints.web.exposure.include: health, info, metrics, prometheus
//   endpoint.health:
//     show-details: when_authorized
//     probes.enabled: true
// server:
//   shutdown: graceful
// spring.lifecycle.timeout-per-shutdown-phase: 30s

// 2. Multi-Stage Dockerfile
// FROM maven:3.9-eclipse-temurin-21-alpine AS build
// WORKDIR /app
// COPY pom.xml .
// RUN mvn dependency:go-offline
// COPY src ./src
// RUN mvn package -DskipTests
//
// FROM eclipse-temurin:21-jre-alpine
// WORKDIR /app
// COPY --from=build /app/target/*.jar app.jar
// EXPOSE 8081
// ENTRYPOINT ["java", "-jar", "app.jar"]

// 3. docker-compose.yml
// services:
//   postgres:
//     image: postgres:17
//     environment:
//       POSTGRES_DB: myapp
//       POSTGRES_USER: myapp_user
//       POSTGRES_PASSWORD: secret
//     volumes: [pgdata:/var/lib/postgresql/data]
//     healthcheck:
//       test: ["CMD-SHELL", "pg_isready -U myapp_user -d myapp"]
//       interval: 10s
//     networks: [app-net]
//
//   keycloak:
//     image: quay.io/keycloak/keycloak:latest
//     command: start-dev
//     environment:
//       KEYCLOAK_ADMIN: admin
//       KEYCLOAK_ADMIN_PASSWORD: admin
//       KC_DB: postgres
//       KC_DB_URL: jdbc:postgresql://postgres:5432/myapp
//       KC_DB_USERNAME: myapp_user
//       KC_DB_PASSWORD: secret
//     ports: ["8080:8080"]
//     depends_on:
//       postgres: { condition: service_healthy }
//     networks: [app-net]
//
//   api:
//     build: { context: ., dockerfile: Dockerfile }
//     environment:
//       SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/myapp
//       SPRING_DATASOURCE_USERNAME: myapp_user
//       SPRING_DATASOURCE_PASSWORD: secret
//       SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://keycloak:8080/realms/company-realm
//     ports: ["8081:8081"]
//     depends_on:
//       postgres: { condition: service_healthy }
//       keycloak: { condition: service_started }
//     networks: [app-net]
//
// volumes: { pgdata: }
// networks: { app-net: }`,
    practice: "Your app takes 30s to start. During startup, Kubernetes routes traffic causing 503s. How do you fix this with Actuator probes?",
    solution: `// Enable probes: management.endpoint.health.probes.enabled: true
// livenessProbe:  /actuator/health/liveness  -> UP once JVM starts
// readinessProbe: /actuator/health/readiness -> UP only when fully ready
//
// Kubernetes only routes traffic to pods with Ready status.
// During 30s startup, readiness returns DOWN -> no traffic routed.
// Liveness stays UP -> K8s doesn't restart during normal startup.`
  },
];
