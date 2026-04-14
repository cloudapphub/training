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
      "## Step 1: What Is a Bean?",

      "**A Bean** is simply a Java object that Spring creates, configures, and manages for you. When you annotate a class with `@Component`, `@Service`, `@Repository`, or `@Controller`, Spring's component scanning discovers it at startup and registers it as a bean in the **ApplicationContext** (the IoC container). You can also define beans explicitly using `@Bean` methods in `@Configuration` classes — this is how you configure third-party library objects that you don't own the source code for.",

      "**Bean Names:** Every bean has a name. By default, it's the class name in camelCase: `PaymentService` → `paymentService`. Override with `@Component(\"myCustomName\")` or `@Bean(name = \"myCustomName\")`. Bean names must be unique within an ApplicationContext — duplicates cause startup failures.",

      "## Step 2: The Complete Bean Lifecycle — 7 Phases",

      "**Phase 1 — Instantiation:** Spring calls the constructor. For constructor injection, all dependencies are resolved and passed as constructor arguments at this point. If a required dependency is missing, Spring throws `UnsatisfiedDependencyException` and the app fails to start.",

      "**Phase 2 — Dependency Injection:** For setter injection or field injection (not recommended), dependencies are injected after construction. Spring resolves `@Autowired` fields and setters, looks up beans by type (or by `@Qualifier` name), and injects them.",

      "**Phase 3 — BeanPostProcessor.postProcessBeforeInitialization():** All registered `BeanPostProcessor` beans get a chance to modify the bean BEFORE initialization. This is how Spring implements `@Autowired` (via `AutowiredAnnotationBeanPostProcessor`) and `@Value` injection. Custom `BeanPostProcessors` can add logging, validation, or dynamic proxies at this stage.",

      "**Phase 4 — Initialization Callbacks:** Three mechanisms execute in order: (1) `@PostConstruct` methods — the recommended approach, clean and simple. (2) `InitializingBean.afterPropertiesSet()` — interface-based, tightly couples to Spring. (3) `@Bean(initMethod = \"init\")` — XML-era, rarely used. Use `@PostConstruct` for cache warming, connection validation, background task scheduling, or any setup that requires all dependencies to be injected first.",

      "**Phase 5 — BeanPostProcessor.postProcessAfterInitialization():** Post-processors run again AFTER initialization. This is where Spring creates **AOP proxies** — wrapping your bean in a proxy that adds cross-cutting behavior like `@Transactional` (transaction management), `@Async` (async execution), `@Cacheable` (method result caching), and `@PreAuthorize` (security checks). The object you inject is often a proxy, not your original class.",

      "**Phase 6 — Bean Ready:** The bean is fully initialized, proxied (if needed), and available for injection into other beans. For singletons, this happens once at startup and the bean lives for the entire application lifecycle.",

      "**Phase 7 — Destruction:** On `ApplicationContext.close()` (app shutdown, SIGTERM): (1) `@PreDestroy` methods run — use for cleanup: close connections, flush caches, cancel schedulers. (2) `DisposableBean.destroy()` — interface-based alternative. (3) `@Bean(destroyMethod = \"close\")` — Spring auto-detects `close()` and `shutdown()` methods. **Important:** Prototype beans are NOT destroyed by Spring — you must manage their lifecycle yourself.",

      "## Step 3: Bean Scopes Explained",

      "**Singleton Scope (default):** One instance per ApplicationContext, shared across all injection points. Created eagerly at startup (unless `@Lazy`). Thread-safe concern: if your singleton holds mutable state, concurrent requests can cause race conditions. Rule: keep singletons stateless or use thread-safe collections.",

      "**Prototype Scope:** A new instance every time the bean is requested from the container. NOT created at startup — only when first injected or explicitly requested via `applicationContext.getBean()`. Spring creates it, injects dependencies, calls `@PostConstruct`, then hands it off. **Spring does NOT track prototype beans after creation** — no `@PreDestroy`, no lifecycle management. Use for stateful, short-lived objects like request tracers or report builders.",

      "**Web Scopes (require `spring-boot-starter-web`):** `request` — one instance per HTTP request, destroyed when the request completes. `session` — one per HTTP session, destroyed on session timeout. `application` — one per `ServletContext` (essentially a singleton but tied to the web layer). These are implemented internally using ThreadLocal + proxy patterns.",

      "## Step 4: The Scope Injection Pitfall — And How to Fix It",

      "**The Problem:** If you inject a `prototype`-scoped bean into a `singleton`, the singleton captures one instance of the prototype at construction time and reuses it forever. Every call to the singleton uses the SAME prototype instance — defeating the entire purpose of `prototype` scope. The same issue occurs with `request`-scoped beans injected into singletons.",

      "**Fix 1 — ObjectProvider (Recommended):** Inject `ObjectProvider<MyPrototype>` instead of `MyPrototype` directly. Call `provider.getObject()` each time you need a new instance. This is clean, type-safe, and doesn't require any annotations on the prototype class. Example: `public MyService(ObjectProvider<RequestTracer> tracerProvider) { ... }` then `tracerProvider.getObject()` in each method.",

      "**Fix 2 — Scoped Proxy:** Add `@Scope(value = \"prototype\", proxyMode = ScopedProxyMode.TARGET_CLASS)` on the prototype bean. Spring creates a CGLIB proxy that delegates to a new instance per invocation. The singleton injects the proxy, unaware that the underlying target changes. For interfaces, use `ScopedProxyMode.INTERFACES` instead.",

      "## Step 5: @ConfigurationProperties — Type-Safe External Config",

      "**Why @ConfigurationProperties?** Instead of scattering `@Value(\"${app.payment.gateway-url}\")` annotations across your codebase, group all related config under one prefix and bind it to a Java Record. Benefits: (1) Type safety — Spring validates types at startup (e.g., `Duration`, `int`, `boolean`). (2) IDE auto-completion — add `spring-boot-configuration-processor` to your build for metadata generation. (3) Centralized validation — annotate with `@Validated` + Jakarta constraints. (4) Immutability — records are immutable by design.",

      "**Relaxed Binding:** Spring Boot maps YAML/properties keys to Java fields using relaxed binding. All of these resolve to the same field: `gateway-url` (kebab-case, recommended in YAML), `gatewayUrl` (camelCase, in Java), `GATEWAY_URL` (SCREAMING_SNAKE_CASE, in env vars), `gateway_url` (snake_case). This means `SPRING_DATASOURCE_URL` env var maps to `spring.datasource.url` in YAML.",

      "**Supported Types:** `String`, `int`, `long`, `boolean`, `Duration` (`30s`, `5m`, `2h`), `DataSize` (`10MB`, `1GB`), `List<String>`, `Map<String, String>`, nested records, `Optional<String>`, enums, `InetAddress`, `File`, `Path`. Spring automatically converts YAML values to these types.",

      "## Step 6: @Value — When and When NOT to Use",

      "**@Value(\"${property.key}\")** injects a single property value. Supports SpEL: `@Value(\"#{2 * T(Math).PI}\")`. Supports defaults: `@Value(\"${app.timeout:30s}\")`. Use for simple, standalone values that don't belong to a config group. **Avoid** for groups of related properties — use `@ConfigurationProperties` instead.",

      "**@Value Limitations:** No relaxed binding (must match exactly). No IDE auto-completion. No validation support. No metadata generation. If you have 5+ `@Value` annotations in a class, refactor to `@ConfigurationProperties`.",

      "## Step 7: Custom @Bean Methods — Configuring Third-Party Libraries",

      "**When to Use @Bean:** You can't annotate classes you don't own (e.g., `RestClient`, `ObjectMapper`, `DataSource`) with `@Service`. Instead, create a `@Configuration` class and define `@Bean` methods that construct and return instances. Spring calls these methods once (for singletons), caches the result, and injects it wherever needed.",

      "**CGLIB Proxying (Full Mode):** `@Configuration` classes are proxied by CGLIB. If `beanA()` calls `beanB()` within the same config class, the call is intercepted by the proxy and returns the existing singleton — NOT a new instance. This ensures beans are truly singletons. `@Configuration(proxyBeanMethods = false)` (lite mode) disables this — useful for performance but inter-bean references create new instances each time.",

      "## Step 8: Conditional Bean Creation",

      "**@ConditionalOnProperty:** `@ConditionalOnProperty(name = \"feature.cache.enabled\", havingValue = \"true\")` — creates the bean only if the property equals the specified value. Use `matchIfMissing = true` to create the bean when the property is absent (default-ON behavior).",

      "**@ConditionalOnMissingBean:** `@ConditionalOnMissingBean(CacheService.class)` — creates a default implementation only if the user hasn't provided their own. This is the backbone of auto-configuration: Spring Boot provides sensible defaults that you override by simply defining your own bean of the same type.",

      "**@ConditionalOnClass:** `@ConditionalOnClass(name = \"io.lettuce.core.RedisClient\")` — creates the bean only if the class is on the classpath. Auto-config uses this to conditionally create Redis, Kafka, or MongoDB beans based on whether the corresponding libraries are present.",

      "## Step 9: BeanPostProcessor — Spring's Extension Point",

      "**BeanPostProcessor** is a powerful interface that lets you intercept and modify beans during creation. Every `@Transactional`, `@Async`, `@Cacheable`, and `@Scheduled` annotation works because of BeanPostProcessors that wrap your beans in proxies. Custom BeanPostProcessors can: add logging to all repositories, validate that services have required annotations, dynamically register metrics, or add performance monitoring to specific bean types.",

      "## Step 10: @Lazy — Deferring Bean Creation",

      "**@Lazy** defers bean creation until the bean is first accessed, instead of eagerly at startup. Use on beans with expensive initialization (e.g., connecting to a remote service). On a `@Bean` method or class: creates a proxy at startup, initializes on first use. On a constructor parameter: `public MyService(@Lazy HeavyDependency dep)` — the dependency is proxied and created on first method call. Warning: `@Lazy` can mask startup failures that would otherwise surface immediately.",
    ],
    code: `// === Complete Bean Lifecycle & Configuration ===

// ============================================================
// STEP 1: Lifecycle Hooks — @PostConstruct & @PreDestroy
// ============================================================
@Component
public class CacheWarmer {

    private final ProductRepository productRepository;

    public CacheWarmer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void warmCache() {
        // Runs AFTER all dependencies are injected
        // Perfect for: cache warming, connection validation, initial data load
        List<Product> hotProducts = productRepository.findTop100ByOrderByViewsDesc();
        CacheManager.preload(hotProducts);
        System.out.println("Cache warmed with " + hotProducts.size() + " products");
    }

    @PreDestroy
    public void flushCache() {
        // Runs on app shutdown (SIGTERM, ApplicationContext.close())
        // Perfect for: flushing caches, closing connections, canceling schedulers
        CacheManager.flush();
        System.out.println("Cache flushed before shutdown");
    }
}

// ============================================================
// STEP 2: @ConfigurationProperties — Type-Safe Config Binding
// ============================================================
// application.yml:
// app:
//   payment:
//     gateway-url: https://api.stripe.com/v1
//     timeout: 30s               # Binds to java.time.Duration
//     retry-count: 3             # Binds to int
//     allowed-currencies:        # Binds to List<String>
//       - USD
//       - EUR
//       - GBP
//     rate-limits:               # Binds to Map<String, Integer>
//       default: 100
//       premium: 1000

@ConfigurationProperties(prefix = "app.payment")
@Validated   // Enables Jakarta Bean Validation on startup
public record PaymentProperties(
    @NotBlank String gatewayUrl,
    Duration timeout,                            // "30s" → Duration.ofSeconds(30)
    @Min(1) @Max(10) int retryCount,
    List<String> allowedCurrencies,              // YAML list → Java List
    Map<String, Integer> rateLimits              // YAML map → Java Map
) {}

// Enable config properties scanning (in main class or @Configuration):
// @EnableConfigurationProperties(PaymentProperties.class)

// ============================================================
// STEP 3: Injecting @ConfigurationProperties
// ============================================================
@Service
public class PaymentService {
    private final PaymentProperties props;

    // Constructor injection — props is immutable
    public PaymentService(PaymentProperties props) {
        this.props = props;
    }

    public void charge(BigDecimal amount, String currency) {
        if (!props.allowedCurrencies().contains(currency)) {
            throw new IllegalArgumentException("Currency not supported: " + currency);
        }
        System.out.println("Calling " + props.gatewayUrl()
            + " timeout=" + props.timeout()
            + " retries=" + props.retryCount());
    }
}

// ============================================================
// STEP 4: Custom @Bean for Third-Party Libraries
// ============================================================
@Configuration
public class HttpClientConfig {

    @Bean
    public RestClient restClient(PaymentProperties props) {
        // @Bean method receives other beans as parameters (auto-injected)
        return RestClient.builder()
                .baseUrl(props.gatewayUrl())
                .defaultHeader("Accept", "application/json")
                .defaultHeader("X-Api-Version", "2024-01")
                .build();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
    }
}

// ============================================================
// STEP 5: Bean Scopes — Singleton vs Prototype
// ============================================================
// Singleton (default) — ONE instance, shared everywhere
@Component
public class OrderService {
    // All requests share this instance — keep stateless!
    private final OrderRepository orderRepository;
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }
}

// Prototype — NEW instance every time
@Component
@Scope("prototype")
public class RequestTracer {
    private final String traceId = UUID.randomUUID().toString();
    private final Instant startedAt = Instant.now();
    public String getTraceId() { return traceId; }
}

// ============================================================
// STEP 6: Fixing the Scope Injection Pitfall
// ============================================================
@Service
public class AuditService {
    // WRONG: This captures ONE prototype instance forever
    // private final RequestTracer tracer;

    // CORRECT: ObjectProvider creates a new instance each call
    private final ObjectProvider<RequestTracer> tracerProvider;

    public AuditService(ObjectProvider<RequestTracer> tracerProvider) {
        this.tracerProvider = tracerProvider;
    }

    public void logAction(String action) {
        RequestTracer tracer = tracerProvider.getObject(); // New instance!
        System.out.println("[" + tracer.getTraceId() + "] " + action);
    }
}

// ============================================================
// STEP 7: Conditional Bean Creation
// ============================================================
@Configuration
public class CacheConfig {

    @Bean
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
    public CacheService redisCacheService() {
        return new RedisCacheService();
    }

    @Bean
    @ConditionalOnMissingBean(CacheService.class)  // Default fallback
    public CacheService inMemoryCacheService() {
        return new InMemoryCacheService();
    }
}`,
    practice: "You have a singleton ReportService that needs a unique RequestContext for each HTTP request. RequestContext is @Scope(\"request\"). If you inject it directly, what happens? Write code showing both the broken version and the fix using ObjectProvider.",
    solution: `// BROKEN — singleton captures one RequestContext instance at startup:
// @Service
// public class ReportService {
//     private final RequestContext ctx;  // Always the SAME instance!
//     public ReportService(RequestContext ctx) { this.ctx = ctx; }
// }

// FIXED — ObjectProvider resolves a new instance per request:
// @Service
// public class ReportService {
//     private final ObjectProvider<RequestContext> ctxProvider;
//     public ReportService(ObjectProvider<RequestContext> ctxProvider) {
//         this.ctxProvider = ctxProvider;
//     }
//     public Report generate() {
//         RequestContext ctx = ctxProvider.getObject(); // Correct scope!
//         return new Report(ctx.getUserId(), ctx.getTimestamp());
//     }
// }`
  },
  {
    time: "Hour 5",
    title: "Spring Data JPA & Hibernate Foundations",
    concept: [
      "## Step 1: What Is ORM and Why JPA?",

      "**Object-Relational Mapping (ORM)** bridges the gap between Java objects and relational database tables. Without ORM, you write raw SQL, manually map `ResultSet` rows to Java objects, handle type conversions, and manage connections — tedious and error-prone. ORM automates this: you define Java classes (entities), and the framework generates SQL `INSERT`, `SELECT`, `UPDATE`, `DELETE` statements automatically.",

      "**JPA (Jakarta Persistence API)** is a *specification* — it defines annotations (`@Entity`, `@Id`, `@Column`) and interfaces (`EntityManager`, `Query`) but contains no implementation. **Hibernate** is the default *implementation* of JPA in Spring Boot. Think of JPA like the JDBC `Driver` interface and Hibernate like the PostgreSQL `Driver` implementation. You code against JPA annotations, and Hibernate does the actual SQL generation and execution.",

      "**JPA vs Hibernate Extensions:** JPA standard annotations (`jakarta.persistence.*`) are portable — you can swap Hibernate for EclipseLink. Hibernate extensions (`org.hibernate.annotations.*`) add features JPA doesn't cover: `@NaturalId` (business key lookup), `@Formula` (derived column from SQL expression), `@BatchSize` (batch lazy loading), `@SQLDelete` (soft delete), `@Where` (default filters). Use JPA annotations when possible; use Hibernate extensions when you need the extra power.",

      "## Step 2: Entity Mapping — From Class to Table",

      "**@Entity** marks a class as a JPA entity. Requirements: (1) Must have a no-arg constructor (can be `protected`). (2) Must not be `final` (Hibernate creates proxy subclasses for lazy loading). (3) Must have at least one `@Id` field. (4) Fields cannot be `final` (Hibernate sets them via reflection). The class name maps to the table name by default — `User` → `user` table.",

      "**@Table(name = \"users\")** explicitly sets the table name. Always use this to avoid surprises (e.g., `User` is a reserved word in some databases). Additional attributes: `schema`, `uniqueConstraints` (composite unique keys), `indexes` (database indexes for performance).",

      "**@Id and @GeneratedValue:** `@Id` marks the primary key field. `@GeneratedValue` tells Hibernate how to generate IDs. Strategies: (1) `IDENTITY` — uses the database's auto-increment (`SERIAL` in PostgreSQL, `AUTO_INCREMENT` in MySQL). Simple but prevents JDBC batch inserts because Hibernate must execute each INSERT immediately to get the generated ID. (2) `SEQUENCE` — uses a database sequence (`CREATE SEQUENCE`). Preferred for PostgreSQL — Hibernate pre-allocates IDs (`allocationSize = 50`) enabling batch inserts. (3) `TABLE` — uses a separate table to track IDs. Portable but slow due to row-level locking. (4) `AUTO` — Hibernate picks based on the database dialect.",

      "**@Column — Explicit Constraints:** `@Column(nullable = false, length = 100, unique = true, updatable = false)`. `nullable = false` → generates `NOT NULL` constraint. `length = 100` → `VARCHAR(100)`. `unique = true` → `UNIQUE` constraint. `updatable = false` → prevents Hibernate from including this column in UPDATE statements (e.g., `createdAt`). `columnDefinition = \"TEXT\"` → use exact SQL type. Always define `@Column` explicitly — Hibernate's defaults (nullable, VARCHAR(255)) are often wrong for production.",

      "**@Enumerated:** Map Java enums to database columns. `@Enumerated(EnumType.STRING)` stores the enum name as a string (`ACTIVE`, `INACTIVE`) — **always use this**. `@Enumerated(EnumType.ORDINAL)` stores the enum's position (0, 1, 2) — dangerous because reordering the enum silently corrupts data.",

      "## Step 3: Entity Lifecycle States — The Persistence Context",

      "**The Persistence Context** (also called the **First-Level Cache**) is a HashMap-like structure that Hibernate maintains per transaction. It maps entity ID → entity instance. Every entity exists in one of four states relative to this context:",

      "**State 1 — New/Transient:** The entity was created with `new User()` but has not been persisted. It has no ID. The persistence context doesn't know about it. Calling `repository.save(user)` transitions it to Managed.",

      "**State 2 — Managed:** The entity is tracked by the persistence context. Any changes to its fields are *automatically detected* and synchronized to the database when the transaction commits — this is called **dirty checking**. You do NOT need to call `save()` again after modifying a managed entity. Example: `User user = repository.findById(1L).get(); user.setName(\"Updated\");` — Hibernate sees the name changed at flush time and generates `UPDATE users SET name = 'Updated' WHERE id = 1`.",

      "**State 3 — Detached:** The entity was managed but the persistence context closed (e.g., the `@Transactional` method returned). The entity still has an ID and data, but Hibernate no longer tracks it. Modifying a detached entity does nothing until you re-attach it via `repository.save(detachedUser)` (which calls `EntityManager.merge()`). Accessing a lazy-loaded collection on a detached entity throws `LazyInitializationException`.",

      "**State 4 — Removed:** The entity is scheduled for deletion. After `repository.delete(user)`, the entity is marked Removed. On transaction commit, Hibernate generates `DELETE FROM users WHERE id = ?`.",

      "## Step 4: Dirty Checking & Flushing — How Hibernate Detects Changes",

      "**Dirty Checking:** When an entity enters the Managed state, Hibernate takes a snapshot of all its field values. At flush time (transaction commit or before a query), Hibernate compares the current field values against the snapshot. If anything changed, it generates an `UPDATE` statement. This means you never call `save()` on an entity you loaded within the same transaction — changes are detected automatically.",

      "**Flush Timing:** Hibernate flushes (syncs changes to the database) at: (1) Transaction commit. (2) Before any JPQL/native query (to ensure the query sees the latest data). (3) Explicitly via `entityManager.flush()`. The flush mode can be set to `AUTO` (default) or `COMMIT` (only on commit, skips pre-query flush — better performance but stale query results possible).",

      "**Performance Implication:** For read-only operations, dirty checking is pure overhead — Hibernate snapshots every loaded entity and compares all fields at flush time. Use `@Transactional(readOnly = true)` to disable dirty checking, reducing CPU and memory usage for read-heavy services.",

      "## Step 5: Spring Data JPA Repository Hierarchy",

      "**Repository Hierarchy:** `Repository<T, ID>` (marker interface) → `CrudRepository<T, ID>` (basic CRUD: `save`, `findById`, `delete`, `count`) → `ListCrudRepository<T, ID>` (returns `List` instead of `Iterable`) → `PagingAndSortingRepository<T, ID>` (adds `findAll(Pageable)`) → `JpaRepository<T, ID>` (adds `flush()`, `saveAndFlush()`, `deleteInBatch()`, `getById()`). Always extend `JpaRepository` — it includes everything.",

      "**How Spring Generates Implementations:** You write an interface, Spring generates the implementation at startup using **JDK dynamic proxies**. The `SimpleJpaRepository` class provides the default implementation for all CRUD methods. Spring's `JpaRepositoryFactoryBean` scans for interfaces extending `Repository` and creates proxy beans. This is why you never write `class UserRepositoryImpl implements UserRepository`.",

      "## Step 6: Derived Query Methods — SQL from Method Names",

      "**How It Works:** Spring parses your method name using a set of keywords and generates JPQL. Method: `findByEmailAndStatus(String email, Status status)` → JPQL: `SELECT u FROM User u WHERE u.email = ?1 AND u.status = ?2`. Spring matches method name prefixes (`findBy`, `countBy`, `deleteBy`, `existsBy`) and property expressions.",

      "**Available Keywords:** `And`, `Or` — logical operators. `Between`, `LessThan`, `LessThanEqual`, `GreaterThan`, `GreaterThanEqual` — comparisons. `IsNull`, `IsNotNull` — null checks. `Like`, `NotLike`, `Containing`, `StartingWith`, `EndingWith` — string matching. `In`, `NotIn` — collection membership. `True`, `False` — boolean checks. `OrderBy...Asc/Desc` — sorting. `Top5`, `First10` — limiting results. `Distinct` — deduplication.",

      "**When Derived Queries Break Down:** Method names like `findByUserProfileAddressCityNameContainingAndStatusNotAndCreatedAtAfterOrderByLastNameAsc` are unreadable. Rule of thumb: if the method name exceeds ~3 conditions, switch to `@Query` with JPQL.",

      "## Step 7: @Query — JPQL and Native SQL",

      "**JPQL (Jakarta Persistence Query Language):** Operates on entity classes and fields, NOT table names and columns. `SELECT u FROM User u WHERE u.email = :email` — here `User` is the entity class name and `email` is the Java field name. Hibernate translates this to the correct SQL based on your `@Table` and `@Column` annotations. JPQL supports: `SELECT`, `WHERE`, `JOIN`, `LEFT JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`, `DISTINCT`, `CASE WHEN`, subqueries, and aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).",

      "**Named vs Positional Parameters:** Named: `@Query(\"SELECT u FROM User u WHERE u.email = :email\")` with `@Param(\"email\")`. Positional: `@Query(\"SELECT u FROM User u WHERE u.email = ?1\")`. Named parameters are more readable and resistant to refactoring errors.",

      "**Native SQL:** `@Query(value = \"SELECT * FROM users WHERE created_at > :since\", nativeQuery = true)`. Use when you need database-specific features: PostgreSQL `jsonb` operators, window functions (`ROW_NUMBER()`, `RANK()`), CTEs (`WITH`), full-text search (`to_tsvector`). Downside: not portable across databases.",

      "**@Modifying + @Transactional:** For `UPDATE` and `DELETE` queries, add `@Modifying` to tell Spring this is not a SELECT. Add `@Modifying(clearAutomatically = true)` to clear the persistence context after the update — otherwise, cached entities in the context may have stale data. Always pair with `@Transactional`.",

      "## Step 8: Projections — Loading Only What You Need",

      "**Why Projections Matter:** Loading a full `User` entity with 20 fields when you only need `id` and `name` wastes memory, bandwidth, and CPU (Hibernate snapshots all 20 fields for dirty checking). Projections let you load partial data.",

      "**Interface Projection:** Define an interface with getter methods: `interface UserSummary { String getName(); String getEmail(); }`. Use as return type: `List<UserSummary> findByStatus(Status status)`. Spring generates a proxy that maps only the specified columns. SQL generated: `SELECT name, email FROM users WHERE status = ?`.",

      "**Class-Based (DTO) Projection:** Use a record/class directly in JPQL: `@Query(\"SELECT new com.app.dto.UserSummary(u.id, u.name) FROM User u\")`. The constructor must match exactly. Can also use Java Records: `record UserSummary(Long id, String name) {}`.",

      "**Dynamic Projection:** Use a generic return type: `<T> List<T> findByStatus(Status status, Class<T> type)`. Call with different projections: `repo.findByStatus(ACTIVE, UserSummary.class)` or `repo.findByStatus(ACTIVE, User.class)` for full entity.",

      "## Step 9: @PrePersist, @PreUpdate — Entity Callbacks",

      "**Entity Callbacks** are lifecycle methods that Hibernate calls automatically at specific points: `@PrePersist` — before INSERT (set `createdAt`). `@PostPersist` — after INSERT. `@PreUpdate` — before UPDATE (set `updatedAt`). `@PostUpdate` — after UPDATE. `@PreRemove` — before DELETE. `@PostLoad` — after SELECT. These are useful for audit fields, validation, or computed fields. For shared audit logic, use `@MappedSuperclass` with a `BaseEntity`.",

      "## Step 10: Common Pitfalls & Best Practices",

      "**Pitfall 1 — LazyInitializationException:** Accessing a `@OneToMany` collection on a detached entity (outside `@Transactional`). Fix: load the collection eagerly with `JOIN FETCH` in the query, or use `@EntityGraph`.",

      "**Pitfall 2 — No-Arg Constructor:** JPA requires a no-arg constructor. If you add a parameterized constructor, you must also add a `protected` no-arg constructor. Hibernate uses it to instantiate entities via reflection.",

      "**Pitfall 3 — equals() and hashCode():** Default `Object.equals()` compares references. Two `User` objects loaded in different sessions with the same ID are not `equals()`. Implement `equals`/`hashCode` based on the business key (e.g., `email`) or the `@Id` field (but handle transient entities carefully since their ID is `null` before persist).",

      "**Best Practices:** (1) Use `@Transactional(readOnly = true)` on read methods. (2) Always define `@Column` constraints explicitly. (3) Use `SEQUENCE` generation strategy for PostgreSQL. (4) Use DTOs for API responses — never expose entities directly. (5) Enable SQL logging in dev: `spring.jpa.show-sql=true` + `spring.jpa.properties.hibernate.format_sql=true`. (6) Use `spring.jpa.open-in-view=false` in production.",
    ],
    code: `// === Complete Spring Data JPA & Hibernate Setup ===

// ============================================================
// STEP 1: Entity Definition with Full Annotations
// ============================================================
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_status", columnList = "status")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "users_id_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private int age;

    @Enumerated(EnumType.STRING)    // Store as "ACTIVE", not 0
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Entity callbacks — called automatically by Hibernate
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Required no-arg constructor (can be protected)
    protected User() {}

    public User(String name, String email, int age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }

    // Getters and setters...
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public enum Status { ACTIVE, INACTIVE, SUSPENDED }
}

// ============================================================
// STEP 2: Repository Interface — Full CRUD + Custom Queries
// ============================================================
public interface UserRepository extends JpaRepository<User, Long> {

    // Derived queries — Spring generates SQL from method name
    Optional<User> findByEmail(String email);
    List<User> findByAgeGreaterThanEqual(int minAge);
    List<User> findByStatusAndAgeBetween(User.Status status, int minAge, int maxAge);
    boolean existsByEmail(String email);
    long countByStatus(User.Status status);
    List<User> findTop5ByOrderByCreatedAtDesc();

    // JPQL — operates on entity fields, not table columns
    @Query("SELECT u FROM User u WHERE u.name LIKE %:keyword%")
    List<User> searchByName(@Param("keyword") String keyword);

    // JPQL with JOIN FETCH (prevents N+1 for relationships)
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);

    // Native SQL — for database-specific features
    @Query(value = "SELECT * FROM users WHERE created_at > :since", nativeQuery = true)
    List<User> findRecentUsers(@Param("since") Instant since);

    // Bulk UPDATE — @Modifying required for UPDATE/DELETE queries
    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.status = :newStatus WHERE u.status = :oldStatus")
    int bulkUpdateStatus(@Param("oldStatus") User.Status oldStatus,
                         @Param("newStatus") User.Status newStatus);

    // Interface Projection — loads only specified fields
    List<UserSummary> findByStatus(User.Status status);
}

// ============================================================
// STEP 3: Interface Projection (loads fewer columns)
// ============================================================
public interface UserSummary {
    Long getId();
    String getName();
    String getEmail();
    // SQL generated: SELECT id, name, email FROM users WHERE status = ?
}

// ============================================================
// STEP 4: Service Layer with Transactional Management
// ============================================================
@Service
@Transactional(readOnly = true)    // Default: read-only (no dirty checking)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Read operation — inherits @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    // Write operation — overrides with @Transactional (read-write)
    @Transactional
    public UserResponse create(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateResourceException("Email already registered");
        }
        User user = new User(req.name(), req.email(), req.age());
        User saved = userRepository.save(user);  // Transitions to Managed state
        return toResponse(saved);
    }

    // Dirty checking in action — no save() needed!
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        // Entity is Managed — Hibernate detects these changes automatically
        user.setName(req.name());
        user.setEmail(req.email());
        // No repository.save() needed! Hibernate generates UPDATE on commit.
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(), user.getName(), user.getEmail(),
            user.getAge(), user.getStatus(), user.getCreatedAt()
        );
    }
}`,
    practice: "You have a User entity with 20 fields. Your API's `/api/users` list endpoint only needs id, name, and email. Write: (1) An interface projection, (2) A class-based DTO projection using @Query, and (3) A dynamic projection method that can return either. Explain why projections improve performance.",
    solution: `// 1. Interface Projection:
// public interface UserListView {
//     Long getId();
//     String getName();
//     String getEmail();
// }
// List<UserListView> findAllBy(); // Spring selects only id, name, email

// 2. Class-Based DTO Projection:
// public record UserListDto(Long id, String name, String email) {}
// @Query("SELECT new com.app.dto.UserListDto(u.id, u.name, u.email) FROM User u")
// List<UserListDto> findAllAsDto();

// 3. Dynamic Projection:
// <T> List<T> findAllBy(Class<T> type);
// repo.findAllBy(UserListView.class);  // Returns interface projection
// repo.findAllBy(User.class);           // Returns full entity

// Performance: Projections reduce (1) network bandwidth (fewer bytes from DB),
// (2) memory (smaller objects), (3) CPU (no dirty-checking snapshots for 20 fields),
// (4) SQL complexity (SELECT 3 cols vs 20 cols + joins for eager relations).`
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
      "## Step 1: Understanding OAuth2 & OpenID Connect Fundamentals",

      "**OAuth2** is an authorization framework that lets a client (frontend app) access resources on behalf of a user without sharing the user's password. **OpenID Connect (OIDC)** is an identity layer on top of OAuth2 that adds authentication (proving *who* the user is). The key actors: (1) **Resource Owner** = the end user. (2) **Client** = your React/Angular frontend. (3) **Authorization Server** = Keycloak (issues tokens). (4) **Resource Server** = your Spring Boot API (validates tokens and serves data).",

      "**Token Types in OAuth2:** (1) **Access Token (JWT)** — short-lived (5-15 min), sent with every API request in the `Authorization: Bearer <token>` header. Contains user identity, roles, and expiry. (2) **Refresh Token** — long-lived (hours/days), used by the client to get a new access token when the current one expires, without asking the user to log in again. (3) **ID Token** — OIDC-specific, contains user profile info (name, email), used by the frontend only, never sent to the API.",

      "**The OAuth2 Authorization Code Flow (with PKCE):** This is the recommended flow for SPAs and mobile apps. Step-by-step: (1) User clicks 'Login' → frontend redirects to Keycloak's `/auth` endpoint with a `code_challenge`. (2) User enters credentials on Keycloak's login page. (3) Keycloak redirects back to the frontend with an `authorization_code`. (4) Frontend exchanges the code + `code_verifier` for tokens at Keycloak's `/token` endpoint. (5) Frontend stores the access token in memory (never localStorage!) and sends it with every API call. (6) When the access token expires, the frontend uses the refresh token to get a new one silently.",

      "## Step 2: Anatomy of a JWT Token",

      "**JWT Structure:** A JWT has three Base64URL-encoded parts separated by dots: `header.payload.signature`. (1) **Header** — specifies the algorithm (`RS256`) and token type (`JWT`). (2) **Payload** — contains claims (key-value pairs) like `sub` (user ID), `iss` (issuer URL), `exp` (expiry timestamp), `realm_access.roles` (Keycloak roles), `email`, `preferred_username`. (3) **Signature** — created by Keycloak using its private RSA key. The Resource Server verifies it using Keycloak's public key from the JWKS endpoint.",

      "**Decoded JWT Example from Keycloak:** The payload looks like: `{ \"sub\": \"f47ac10b-58cc-4372-a567-0e02b2c3d479\", \"iss\": \"http://keycloak:8080/realms/company-realm\", \"exp\": 1713100800, \"iat\": 1713097200, \"preferred_username\": \"john.doe\", \"email\": \"john@company.com\", \"realm_access\": { \"roles\": [\"USER\", \"MANAGER\"] }, \"resource_access\": { \"my-api\": { \"roles\": [\"order-admin\"] } }, \"scope\": \"openid profile email\" }`. Notice: roles are nested under `realm_access`, NOT at the top level — this is why Spring Security needs a custom converter.",

      "**Why RS256 (Asymmetric) Matters:** Keycloak signs tokens with a **private key** (kept secret on Keycloak). Spring Boot verifies tokens using the **public key** (fetched from the JWKS endpoint). This means your Spring Boot API never needs Keycloak's private key — it only needs the public key. Even if an attacker intercepts the public key, they cannot forge tokens because they don't have the private key.",

      "## Step 3: Spring Security Filter Chain — Request Lifecycle",

      "**How a Request Flows Through Spring Security:** Every HTTP request passes through a chain of ~15 filters in a specific order BEFORE reaching your `@RestController`. Here is the critical path: (1) `CorsFilter` — handles CORS preflight `OPTIONS` requests and adds CORS headers. If the origin isn't allowed, the request is rejected here. (2) `CsrfFilter` — checks CSRF tokens (disabled in stateless JWT setups). (3) `BearerTokenAuthenticationFilter` — extracts the JWT from the `Authorization: Bearer <token>` header. If no header is present, the request continues as anonymous. (4) `JwtDecoder` — validates the token's signature (using JWKS public keys), expiry, issuer, and structure. If validation fails, throws `InvalidBearerTokenException` → 401 response. (5) `JwtAuthenticationConverter` + your custom `KeycloakRoleConverter` — extracts roles from the JWT payload and creates `GrantedAuthority` objects. (6) `AuthorizationFilter` — checks if the authenticated user has the required role/authority for the URL pattern. If not, throws `AccessDeniedException` → 403 response. (7) If all filters pass, the request reaches your controller with a populated `SecurityContext`.",

      "**Key Insight — 401 vs 403:** A **401 Unauthorized** means 'I don't know who you are' — no token was provided, or the token is invalid/expired. A **403 Forbidden** means 'I know who you are, but you don't have permission' — token is valid but lacks the required role. Understanding this distinction is critical for debugging security issues.",

      "## Step 4: Setting Up Keycloak (Authorization Server)",

      "**Keycloak Setup — Step by Step:** (1) **Start Keycloak** via Docker: `docker run -d --name keycloak -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev`. (2) **Create a Realm:** Open `http://localhost:8080/admin`, log in as `admin/admin`, click 'Create realm' → name it `company-realm`. A realm is a tenant — it isolates users, roles, and clients. (3) **Create a Client:** In the realm → Clients → Create → Client ID: `my-spa-app`, Client type: `OpenID Connect`, Root URL: `http://localhost:3000`. Set 'Client authentication' = OFF (public client for SPAs), 'Standard flow' = ON, 'Direct access grants' = ON (for testing with curl). (4) **Create Roles:** Realm roles → Create: `USER`, `ADMIN`, `MANAGER`. (5) **Create Users:** Users → Create → username: `john`, set password, assign roles `USER` + `MANAGER`. Create another: `admin_user` with role `ADMIN`.",

      "**Testing Token Acquisition with curl:** After setup, get a token: `curl -X POST 'http://localhost:8080/realms/company-realm/protocol/openid-connect/token' -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=password&client_id=my-spa-app&username=john&password=secret'`. The response contains `access_token`, `refresh_token`, `expires_in`, and `token_type`. Decode the access token at jwt.io to inspect its claims.",

      "## Step 5: Spring Boot as a Resource Server — Dependencies & Configuration",

      "**Maven Dependencies:** You need exactly two starters: `spring-boot-starter-security` (core Spring Security) and `spring-boot-starter-oauth2-resource-server` (JWT validation). The resource server starter pulls in `spring-security-oauth2-jose` which provides the `JwtDecoder`, `NimbusJwtDecoder`, and RSA key handling. With just these two dependencies and one YAML property (`issuer-uri`), Spring Boot auto-configures a fully functional JWT-validating security layer.",

      "**application.yml Configuration Explained:** The critical property is `spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:8080/realms/company-realm`. When the app starts, Spring fetches `{issuer-uri}/.well-known/openid-configuration` — this returns the JWKS URI, token endpoint, supported grants, and more. Spring then fetches the JWKS (public keys) from `{issuer-uri}/protocol/openid-connect/certs` and caches them. If Keycloak rotates keys, Spring automatically refreshes the JWKS cache.",

      "## Step 6: The SecurityFilterChain Bean — Line-by-Line Walkthrough",

      "**@Configuration + @EnableWebSecurity:** `@Configuration` marks this as a Spring config class. `@EnableWebSecurity` activates Spring Security's web protection and imports the security filter chain infrastructure. `@EnableMethodSecurity` turns on method-level annotations like `@PreAuthorize` (covered in Hour 10).",

      "**Building the SecurityFilterChain:** The `filterChain(HttpSecurity http)` method defines your security rules using a fluent DSL. Each method call configures one aspect: `.cors()` — configures CORS. `.csrf()` — disables CSRF (safe because we don't use cookies for auth). `.sessionManagement()` — sets stateless mode (no server-side sessions). `.authorizeHttpRequests()` — defines URL-level access rules. `.oauth2ResourceServer()` — configures JWT validation with your custom role converter. **Order matters in `authorizeHttpRequests()`** — rules are evaluated top-to-bottom. More specific rules must come before `anyRequest().authenticated()`.",

      "## Step 7: Keycloak Role Converter — Bridging the Gap",

      "**Why a Custom Converter is Required:** Keycloak stores roles in a nested JSON structure: `{ \"realm_access\": { \"roles\": [\"USER\", \"ADMIN\"] } }`. Spring Security's default `JwtGrantedAuthoritiesConverter` reads the `scope` claim and creates authorities like `SCOPE_openid`, `SCOPE_profile`. It completely ignores `realm_access`. Without a custom converter, `hasRole('ADMIN')` always returns false — your users are authenticated but never authorized. This is the #1 integration pitfall when combining Spring Boot + Keycloak.",

      "**How the Converter Works:** Your `KeycloakRoleConverter` implements `Converter<Jwt, Collection<GrantedAuthority>>`. It: (1) Extracts the `realm_access` claim as a `Map`. (2) Gets the `roles` array from that map. (3) Maps each role string to a `SimpleGrantedAuthority` with `ROLE_` prefix. (4) Returns the collection. Spring Security requires the `ROLE_` prefix for `hasRole()` checks — `hasRole('ADMIN')` internally checks for authority `ROLE_ADMIN`.",

      "**Realm Roles vs Client Roles:** Keycloak supports two role scopes: **Realm roles** (`realm_access.roles`) apply across all clients in the realm. **Client roles** (`resource_access.<client-id>.roles`) are specific to a single client. Best practice: use realm roles for broad access (USER, ADMIN) and client roles for fine-grained, service-specific permissions (ORDER_WRITE, REPORT_VIEW). Your converter should extract both.",

      "## Step 8: CORS Configuration for Frontend Integration",

      "**Why CORS Exists:** Browsers enforce the Same-Origin Policy — a React app on `localhost:3000` cannot make API calls to `localhost:8081` without explicit permission. CORS headers tell the browser 'Yes, this origin is allowed.' Without proper CORS config, your frontend gets `Access-Control-Allow-Origin` errors even though the API works fine in Postman/curl.",

      "**CORS + Spring Security Order:** CORS is processed BEFORE authentication. If the browser sends a preflight `OPTIONS` request, Spring Security must respond with CORS headers WITHOUT requiring a JWT. If CORS is misconfigured, the `OPTIONS` request gets a 401 (no token sent for preflight), and the browser never sends the actual request. Define CORS via a `CorsConfigurationSource` bean, NOT via `@CrossOrigin` annotations on controllers — the bean approach integrates with the security filter chain correctly.",

      "## Step 9: Stateless Architecture & Token Revocation",

      "**Stateless Benefits:** (1) **Horizontal scaling** — any server instance can validate any token using the cached JWKS (no sticky sessions). (2) **No session storage** — reduces memory usage. (3) **Simpler load balancing** — round-robin works perfectly. (4) **Microservice friendly** — tokens flow through multiple services, each validating independently.",

      "**Token Revocation Strategies:** Since JWTs are self-contained, the server cannot invalidate them after issuance. Strategies: (1) **Short expiry** (5-15 min) — limits the damage window. Use refresh tokens to renew seamlessly. (2) **Token blacklist** — store revoked token IDs (the `jti` claim) in Redis; check on every request. Adds latency but provides instant revocation. (3) **Keycloak session logout** — call Keycloak's admin API to invalidate all tokens for a user. New token requests fail, but existing tokens remain valid until expiry.",

      "## Step 10: Security Debugging & Common Pitfalls",

      "**Debugging 401/403 Errors — Checklist:** (1) Enable debug logging: `logging.level.org.springframework.security=DEBUG`. (2) Is the `Authorization` header present? Check browser DevTools → Network tab. (3) Is the token expired? Decode at jwt.io. (4) Does `issuer-uri` in YAML match the `iss` claim in the token exactly (including protocol and port)? (5) Is Keycloak reachable from Spring Boot? (hostname differs inside Docker vs host). (6) Are roles in `realm_access.roles` and is your converter extracting them? (7) Did you add `@EnableMethodSecurity` for `@PreAuthorize` to work?",

      "**Common Pitfalls:** (1) **Docker networking:** Keycloak's issuer URL inside Docker is `http://keycloak:8080/realms/...` but the browser uses `http://localhost:8080/realms/...`. The `iss` claim must match `issuer-uri` exactly — mismatch causes 401. Solution: use `KC_HOSTNAME_URL` or configure `JwtDecoder` to accept both. (2) **Token serialization:** Keycloak tokens can be >2KB. The `Authorization` header has no size limit in HTTP, but some proxies (nginx) default to 4KB/8KB for headers. (3) **Clock skew:** If your server's clock is off by more than a few seconds, token expiry validation fails. Spring Boot allows 60s skew by default.",
    ],
    code: `// === Complete Spring Boot + Keycloak OAuth2 Resource Server Setup ===

// ============================================================
// STEP 1: Maven Dependencies (pom.xml)
// ============================================================
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-security</artifactId>
// </dependency>
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
// </dependency>

// ============================================================
// STEP 2: application.yml — Resource Server Config
// ============================================================
// spring:
//   security:
//     oauth2:
//       resourceserver:
//         jwt:
//           issuer-uri: http://localhost:8080/realms/company-realm
//           # Spring fetches JWKS from: {issuer-uri}/protocol/openid-connect/certs
//           # Spring fetches metadata from: {issuer-uri}/.well-known/openid-configuration
//
// server:
//   port: 8081
//
// logging:
//   level:
//     org.springframework.security: DEBUG   # Enable for troubleshooting

// ============================================================
// STEP 3: Keycloak Role Converter
// Maps Keycloak's realm_access.roles → Spring GrantedAuthority
// ============================================================
@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    @SuppressWarnings("unchecked")
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // 1. Extract REALM roles: realm_access.roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            List<String> realmRoles = (List<String>) realmAccess.get("roles");
            if (realmRoles != null) {
                realmRoles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .forEach(authorities::add);
            }
        }

        // 2. Extract CLIENT roles: resource_access.<client-id>.roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            resourceAccess.forEach((clientId, clientData) -> {
                Map<String, Object> clientMap = (Map<String, Object>) clientData;
                List<String> clientRoles = (List<String>) clientMap.get("roles");
                if (clientRoles != null) {
                    clientRoles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .forEach(authorities::add);
                }
            });
        }

        return authorities;
    }
}

// ============================================================
// STEP 4: Security Configuration — The SecurityFilterChain
// ============================================================
@Configuration
@EnableWebSecurity       // Activates Spring Security's web protection
@EnableMethodSecurity    // Enables @PreAuthorize, @PostAuthorize, @Secured
public class SecurityConfig {

    private final KeycloakRoleConverter keycloakRoleConverter;

    // Constructor injection of the role converter
    public SecurityConfig(KeycloakRoleConverter keycloakRoleConverter) {
        this.keycloakRoleConverter = keycloakRoleConverter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // Wire the Keycloak converter into Spring's JWT processing
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);

        http
            // 1. CORS — must be first (preflight OPTIONS has no JWT)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. Disable CSRF — not needed for stateless JWT auth
            .csrf(csrf -> csrf.disable())

            // 3. Stateless sessions — no server-side session storage
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. URL-level authorization rules (evaluated top-to-bottom)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "MANAGER")
                .anyRequest().authenticated()   // Everything else requires valid JWT
            )

            // 5. Configure as OAuth2 Resource Server with JWT
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
            );

        return http.build();
    }

    // ============================================================
    // STEP 5: CORS Configuration for Frontend Integration
    // ============================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed frontend origins (never use "*" with credentials)
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",    // React dev server
            "http://localhost:4200",    // Angular dev server
            "https://app.company.com"  // Production frontend
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allowed request headers
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));

        // Expose response headers to the browser
        config.setExposedHeaders(List.of("X-Total-Count", "Link"));

        // Allow cookies/auth headers (required for some OAuth flows)
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour (reduces OPTIONS requests)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}

// ============================================================
// STEP 6: Accessing JWT Claims in Controllers
// ============================================================
@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    @GetMapping("/me")
    public Map<String, Object> getMyProfile(JwtAuthenticationToken auth) {
        Jwt jwt = auth.getToken();
        return Map.of(
            "userId",   jwt.getSubject(),                              // sub claim
            "username", jwt.getClaimAsString("preferred_username"),     // Keycloak username
            "email",    jwt.getClaimAsString("email"),                  // Keycloak email
            "roles",    auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .toList(),
            "tokenExp", jwt.getExpiresAt()                             // Token expiry
        );
    }
}

// ============================================================
// STEP 7: Keycloak Docker Compose (for local dev)
// ============================================================
// services:
//   keycloak:
//     image: quay.io/keycloak/keycloak:latest
//     command: start-dev
//     environment:
//       KEYCLOAK_ADMIN: admin
//       KEYCLOAK_ADMIN_PASSWORD: admin
//     ports:
//       - "8080:8080"
//
// After starting:
// 1. Open http://localhost:8080/admin
// 2. Create realm: company-realm
// 3. Create client: my-spa-app (public, Standard Flow + PKCE)
// 4. Create realm roles: USER, ADMIN, MANAGER
// 5. Create users and assign roles
// 6. Test: curl -X POST http://localhost:8080/realms/company-realm/protocol/openid-connect/token \\
//      -d "grant_type=password&client_id=my-spa-app&username=john&password=secret"`,
    practice: "Your frontend is on http://localhost:3000 and your API is on http://localhost:8081. The frontend gets a CORS error when calling the API. Walk through the exact sequence of HTTP requests (preflight + actual) and identify what must be configured in both Spring Security and Keycloak.",
    solution: `// 1. Browser sends preflight: OPTIONS http://localhost:8081/api/v1/users
//    Headers: Origin: http://localhost:3000, Access-Control-Request-Method: GET,
//             Access-Control-Request-Headers: Authorization, Content-Type
//
// 2. Spring Security CorsFilter intercepts (BEFORE authentication).
//    CorsConfigurationSource checks if http://localhost:3000 is in allowedOrigins.
//    If YES → responds with:
//      Access-Control-Allow-Origin: http://localhost:3000
//      Access-Control-Allow-Methods: GET, POST, PUT, DELETE
//      Access-Control-Allow-Headers: Authorization, Content-Type
//      Access-Control-Max-Age: 3600
//    Status: 200 OK (no body)
//
// 3. Browser validates the preflight response.
//    If headers match → sends actual request:
//    GET http://localhost:8081/api/v1/users
//    Headers: Authorization: Bearer eyJhbGciOi..., Origin: http://localhost:3000
//
// 4. BearerTokenAuthenticationFilter extracts JWT.
// 5. JwtDecoder validates signature, expiry, issuer.
// 6. KeycloakRoleConverter extracts roles from realm_access.
// 7. AuthorizationFilter checks if user has required role.
// 8. Controller returns response with CORS headers.
//
// Common fix: Ensure CorsConfigurationSource bean exists (not just @CrossOrigin).
// In Keycloak: Client → Web Origins → add http://localhost:3000`
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
