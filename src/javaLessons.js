export const javaLessons = [
  {
    time: "Hour 1",
    title: "Java Fundamentals — JVM, Syntax, Data Types & Control Flow",
    concept: [
      "**Java** is a statically-typed, compiled, object-oriented language that runs on the Java Virtual Machine (JVM). Write once, run anywhere — your `.java` source compiles to `.class` bytecode, which the JVM executes on any platform. Java 21+ (LTS) is the current production standard with modern features like records, sealed classes, pattern matching, and virtual threads.",
      "**JVM Architecture:** Source code → `javac` compiler → bytecode → JVM (ClassLoader → Bytecode Verifier → JIT Compiler → Native code). The JVM manages memory via the **heap** (objects), **stack** (method frames, local variables), and **metaspace** (class metadata). Garbage Collection (GC) automatically reclaims unused heap memory — you never call `free()` in Java.",
      "**Primitive types** (8 total): `byte` (8-bit), `short` (16-bit), `int` (32-bit), `long` (64-bit), `float` (32-bit), `double` (64-bit), `char` (16-bit Unicode), `boolean`. Primitives live on the stack and are passed by value. Their wrapper classes (`Integer`, `Double`, etc.) are objects on the heap and support `null`. Autoboxing converts between them automatically.",
      "**Variables & Constants:** `var` (type inference since Java 10) lets the compiler infer the type: `var name = \"Alice\";`. Constants use `final`: `final int MAX = 100;`. Java is strongly typed — once declared, a variable's type cannot change. Naming: camelCase for variables/methods, PascalCase for classes, UPPER_SNAKE for constants.",
      "**Control flow:** `if/else if/else`, `switch` (traditional and enhanced with arrows `case \"A\" -> ...`), `for`, `for-each` (`for (var item : list)`), `while`, `do-while`, `break`, `continue`. The enhanced switch (Java 14+) supports expressions: `String result = switch(day) { case MON -> \"Start\"; default -> \"Other\"; };`",
      "**Strings** are immutable objects. `String s = \"hello\"` uses the string pool (shared). `new String(\"hello\")` creates a new heap object. Key methods: `length()`, `charAt()`, `substring()`, `contains()`, `equals()` (NOT `==` for content comparison), `toLowerCase()`, `split()`, `trim()`, `strip()`. **StringBuilder** for mutable/efficient concatenation in loops. **Text blocks** (Java 15+): triple-quoted multi-line strings.",
    ],
    code: `// === Java Fundamentals ===

// 1. Hello World — every Java program needs a class + main method
public class HelloJava {
    public static void main(String[] args) {
        System.out.println("Hello, Java 21!");
    }
}

// 2. Primitive Types & Wrappers
int count = 42;                      // 32-bit integer
long bigNumber = 9_000_000_000L;     // underscore for readability
double price = 19.99;
boolean active = true;
char grade = 'A';

// Autoboxing: primitive ↔ wrapper
Integer boxed = count;               // int → Integer (autoboxing)
int unboxed = boxed;                 // Integer → int (unboxing)

// 3. Type Inference with var (Java 10+)
var name = "Alice";                  // inferred as String
var items = List.of("a", "b", "c"); // inferred as List<String>
// var x;  // ERROR — var requires an initializer

// 4. Strings — immutable, use equals() not ==
String s1 = "hello";
String s2 = "hello";
System.out.println(s1 == s2);       // true (same pool reference)
System.out.println(s1.equals(s2));  // true (content comparison) ← USE THIS

String s3 = new String("hello");
System.out.println(s1 == s3);       // false (different objects)
System.out.println(s1.equals(s3));  // true

// StringBuilder for efficient concatenation
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append("item").append(i).append(", ");
}
String result = sb.toString();

// Text Blocks (Java 15+) — multi-line strings
String json = """
        {
            "name": "Alice",
            "age": 30,
            "active": true
        }
        """;

// 5. Enhanced Switch Expression (Java 14+)
String dayType = switch (dayOfWeek) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "Weekday";
    case SATURDAY, SUNDAY -> "Weekend";
};

// 6. Control Flow
for (var item : List.of("A", "B", "C")) {
    System.out.println(item);
}

// Pattern matching in switch (Java 21+)
static String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0  -> "Positive int: " + i;
        case Integer i             -> "Non-positive int: " + i;
        case String s              -> "String of length " + s.length();
        case null                  -> "null";
        default                    -> "Unknown: " + obj.getClass();
    };
}`,
    practice: "Write a program that takes a list of mixed-type objects (integers, strings, doubles) and uses a pattern-matching switch to classify each one, printing its type and value. Use StringBuilder for the output.",
    solution: `import java.util.List;

public class TypeClassifier {
    public static void main(String[] args) {
        var items = List.of(42, "Hello", 3.14, 100, "World", 2.718);
        var sb = new StringBuilder();

        for (var item : items) {
            String desc = switch (item) {
                case Integer i  -> "Integer: " + i;
                case String s   -> "String: \\"" + s + "\\" (len=" + s.length() + ")";
                case Double d   -> "Double: " + String.format("%.2f", d);
                default         -> "Unknown: " + item;
            };
            sb.append(desc).append("\\n");
        }
        System.out.print(sb);
    }
}`,
  },
  {
    time: "Hour 2",
    title: "OOP — Classes, Objects, Encapsulation & Constructors",
    concept: [
      "**Object-Oriented Programming** is Java's foundation. Everything lives inside a class. A class is a blueprint; an object is an instance of that blueprint. Java supports: **Encapsulation** (data hiding), **Inheritance** (code reuse), **Polymorphism** (many forms), and **Abstraction** (hiding complexity).",
      "**Encapsulation** means bundling data (fields) with the methods that operate on that data, and restricting direct access. Mark fields `private`, expose them via `public` getter/setter methods. This protects invariants — you control how data is read and modified. Access modifiers: `private` (class only), `default` (package), `protected` (package + subclasses), `public` (everywhere).",
      "**Constructors** initialize objects. They have the same name as the class and no return type. Use `this(...)` to chain constructors. If you define no constructor, Java provides a default no-arg one. Best practice: validate inputs in constructors and make objects valid from creation. Use `this.field = field` when parameter names shadow fields.",
      "**The `static` keyword:** `static` fields belong to the class, not instances — shared across all objects. `static` methods can be called without an instance: `Math.sqrt(16)`. Use static for utility methods and constants. Static methods cannot access instance fields or `this`. **Static initializer blocks** run once when the class is loaded.",
      "**Records** (Java 16+) are immutable data carriers. `record Point(int x, int y) {}` auto-generates: constructor, getters (`x()`, `y()`), `equals()`, `hashCode()`, and `toString()`. Use records instead of boilerplate POJOs. You can add custom methods and validate in a compact constructor: `record Age(int value) { Age { if (value < 0) throw new IllegalArgumentException(); } }`.",
      "**The `final` keyword:** `final` variable = constant (can't reassign). `final` method = can't override. `final` class = can't extend (e.g., `String`, `Integer`). Combine `private final` fields with constructor initialization for immutable objects — the gold standard for thread-safe, predictable code.",
    ],
    code: `// === OOP: Classes, Encapsulation & Records ===

// 1. Encapsulated Class with Validation
public class BankAccount {
    private final String accountId;
    private String owner;
    private double balance;

    // Constructor with validation
    public BankAccount(String accountId, String owner, double initialBalance) {
        if (accountId == null || accountId.isBlank())
            throw new IllegalArgumentException("Account ID required");
        if (initialBalance < 0)
            throw new IllegalArgumentException("Balance cannot be negative");
        this.accountId = accountId;
        this.owner = owner;
        this.balance = initialBalance;
    }

    // Overloaded constructor (chaining with this)
    public BankAccount(String accountId, String owner) {
        this(accountId, owner, 0.0);
    }

    // Business methods with encapsulated logic
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;
    }

    public void withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        if (amount > balance) throw new IllegalStateException("Insufficient funds");
        this.balance -= amount;
    }

    // Getters (no setter for accountId — immutable)
    public String getAccountId() { return accountId; }
    public String getOwner() { return owner; }
    public double getBalance() { return balance; }

    @Override
    public String toString() {
        return "BankAccount[id=%s, owner=%s, balance=%.2f]"
            .formatted(accountId, owner, balance);
    }
}

// 2. Records — immutable data carriers (Java 16+)
public record Money(double amount, String currency) {
    // Compact constructor for validation
    public Money {
        if (amount < 0) throw new IllegalArgumentException("Negative amount");
        if (currency == null || currency.length() != 3)
            throw new IllegalArgumentException("Currency must be 3-letter code");
        currency = currency.toUpperCase(); // normalize
    }

    // Custom method
    public Money add(Money other) {
        if (!this.currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
        return new Money(this.amount + other.amount, this.currency);
    }
}

// Usage:
// var price = new Money(29.99, "usd");  // auto-uppercased to "USD"
// var tax = new Money(2.40, "USD");
// var total = price.add(tax);           // Money[amount=32.39, currency=USD]
// total.amount()  → 32.39              // auto-generated getter

// 3. Static Members
public class AppConfig {
    private static final String VERSION = "2.1.0";
    private static int instanceCount = 0;

    public AppConfig() { instanceCount++; }

    public static String getVersion() { return VERSION; }
    public static int getInstanceCount() { return instanceCount; }
}`,
    practice: "Create an Employee record with name, department, and salary. Add a compact constructor that validates salary > 0 and trims the name. Add a method raise(double percent) that returns a new Employee with the increased salary. Create a regular class EmployeeRegistry that tracks employees in a private list with add, findByDepartment, and averageSalary methods.",
    solution: `import java.util.*;

public record Employee(String name, String department, double salary) {
    public Employee {
        if (salary <= 0) throw new IllegalArgumentException("Salary must be positive");
        name = name.strip();
        department = department.strip();
    }

    public Employee raise(double percent) {
        return new Employee(name, department, salary * (1 + percent / 100));
    }
}

class EmployeeRegistry {
    private final List<Employee> employees = new ArrayList<>();

    public void add(Employee emp) {
        employees.add(Objects.requireNonNull(emp));
    }

    public List<Employee> findByDepartment(String dept) {
        return employees.stream()
            .filter(e -> e.department().equalsIgnoreCase(dept))
            .toList();
    }

    public double averageSalary() {
        return employees.stream()
            .mapToDouble(Employee::salary)
            .average()
            .orElse(0.0);
    }
}`,
  },
  {
    time: "Hour 3",
    title: "Inheritance, Polymorphism, Interfaces & Sealed Classes",
    concept: [
      "**Inheritance** lets a subclass extend a superclass, inheriting its fields and methods. Use `extends` for classes (single inheritance only) and `implements` for interfaces (multiple allowed). The subclass can override methods to provide specialized behavior. Call the parent constructor with `super(...)` and parent methods with `super.method()`.",
      "**Polymorphism** means a superclass reference can point to a subclass object: `Animal a = new Dog()`. The actual method called depends on the runtime type, not the declared type. This enables writing flexible code — a method accepting `List<Shape>` works with circles, rectangles, triangles without knowing the specific type.",
      "**Abstract classes** can't be instantiated. They define a contract with abstract methods (no body) plus concrete methods (with body). Use when subclasses share common implementation but differ in specifics. `abstract class Shape { abstract double area(); String describe() { return \"Shape: area=\" + area(); } }`",
      "**Interfaces** define contracts without implementation (pre-Java 8) or with default/static methods (Java 8+). A class `implements` an interface and must provide all abstract methods. Interfaces enable multiple inheritance of behavior. Key built-in interfaces: `Comparable<T>`, `Iterable<T>`, `Serializable`, `Runnable`, `Function<T,R>`.",
      "**Sealed classes** (Java 17+) restrict which classes can extend them: `sealed class Shape permits Circle, Rectangle {}`. Each permitted subclass must be `final`, `sealed`, or `non-sealed`. This gives exhaustive type hierarchies — the compiler knows ALL possible subtypes, enabling complete pattern matching in switch statements.",
      "**`instanceof` with pattern matching** (Java 16+): `if (obj instanceof String s) { use(s); }` — combines type check and cast in one step. No more explicit casting! Works in switch expressions too: `case Circle c -> c.radius()`. This eliminates the verbose `if (x instanceof Foo) { Foo f = (Foo) x; ... }` pattern.",
    ],
    code: `// === Inheritance, Interfaces & Sealed Classes ===

// 1. Sealed Class Hierarchy (Java 17+)
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
}

public record Circle(double radius) implements Shape {
    public Circle { if (radius <= 0) throw new IllegalArgumentException(); }
    @Override public double area() { return Math.PI * radius * radius; }
    @Override public double perimeter() { return 2 * Math.PI * radius; }
}

public record Rectangle(double width, double height) implements Shape {
    public Rectangle { if (width <= 0 || height <= 0) throw new IllegalArgumentException(); }
    @Override public double area() { return width * height; }
    @Override public double perimeter() { return 2 * (width + height); }
}

public record Triangle(double a, double b, double c) implements Shape {
    public Triangle { if (a <= 0 || b <= 0 || c <= 0) throw new IllegalArgumentException(); }
    @Override public double area() {
        double s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }
    @Override public double perimeter() { return a + b + c; }
}

// Exhaustive pattern matching — compiler knows all subtypes
public static String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle with radius " + c.radius();
        case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
        case Triangle t  -> "Triangle with sides " + t.a() + "," + t.b() + "," + t.c();
        // No default needed! Sealed = exhaustive
    };
}

// 2. Abstract Class + Inheritance
public abstract class Animal {
    private final String name;

    protected Animal(String name) { this.name = name; }

    public String getName() { return name; }
    public abstract String speak();  // subclasses MUST implement

    // Concrete method shared by all
    @Override
    public String toString() {
        return name + " says: " + speak();
    }
}

public class Dog extends Animal {
    public Dog(String name) { super(name); }
    @Override public String speak() { return "Woof!"; }
    public void fetch() { System.out.println(getName() + " fetches the ball!"); }
}

public class Cat extends Animal {
    public Cat(String name) { super(name); }
    @Override public String speak() { return "Meow!"; }
}

// 3. Polymorphism in action
List<Animal> animals = List.of(new Dog("Rex"), new Cat("Whiskers"), new Dog("Buddy"));
for (Animal a : animals) {
    System.out.println(a);  // calls correct speak() based on runtime type
    if (a instanceof Dog d) {
        d.fetch();  // pattern matching instanceof (Java 16+)
    }
}

// 4. Interface with Default Methods
public interface Loggable {
    String getId();

    default String toLogString() {
        return "[%s] %s".formatted(
            java.time.LocalDateTime.now(), getId()
        );
    }

    static Loggable of(String id) {
        return () -> id;  // lambda implementing functional interface
    }
}`,
    practice: "Design a sealed interface Payment with three implementations: CreditCard(number, amount), BankTransfer(iban, amount), and CryptoPayment(walletAddress, amount, coin). Write a process(Payment p) method using pattern matching switch that returns a processing message specific to each type.",
    solution: `public sealed interface Payment permits CreditCard, BankTransfer, CryptoPayment {
    double amount();
}

public record CreditCard(String number, double amount) implements Payment {
    public CreditCard { number = number.replaceAll("\\\\s", ""); }
    public String lastFour() { return number.substring(number.length() - 4); }
}

public record BankTransfer(String iban, double amount) implements Payment {}

public record CryptoPayment(String walletAddress, double amount, String coin)
    implements Payment {}

class PaymentProcessor {
    public static String process(Payment payment) {
        return switch (payment) {
            case CreditCard cc ->
                "Charging card ending in " + cc.lastFour() +
                " for $" + String.format("%.2f", cc.amount());
            case BankTransfer bt ->
                "Transferring $" + String.format("%.2f", bt.amount()) +
                " to IBAN " + bt.iban();
            case CryptoPayment cp ->
                "Sending " + String.format("%.4f", cp.amount()) +
                " " + cp.coin() + " to " + cp.walletAddress();
        };
    }
}`,
  },
  {
    time: "Hour 4",
    title: "Generics, Enums & Annotations",
    concept: [
      "**Generics** enable type-safe, reusable code. Instead of using raw `Object` and casting, declare type parameters: `class Box<T> { T value; }`. Usage: `Box<String> b = new Box<>();`. The compiler enforces type safety at compile time — no `ClassCastException` at runtime. Generics are erased at runtime (type erasure) — they exist only at compile time.",
      "**Bounded type parameters** restrict what types are allowed. `<T extends Comparable<T>>` means T must implement Comparable. `<T extends Number>` means T must be a Number subclass. Use `extends` for both classes and interfaces in bounds. Multiple bounds: `<T extends Serializable & Comparable<T>>`.",
      "**Wildcards** handle unknown types: `?` (any type), `? extends Number` (Number or subclass — read-only), `? super Integer` (Integer or superclass — write-only). PECS rule: **Producer Extends, Consumer Super**. `List<? extends Number>` = read numbers. `List<? super Integer>` = add integers.",
      "**Enums** are classes with a fixed set of instances. Each enum constant is a singleton. Enums can have fields, constructors, and methods: `enum Status { ACTIVE(\"Active\"), INACTIVE(\"Inactive\"); private final String label; ... }`. Use enums for type-safe constants instead of int/String constants. Enums implement `Comparable` and `Serializable` automatically.",
      "**Annotations** are metadata attached to code. Common built-in: `@Override` (compiler checks method overrides), `@Deprecated` (marks outdated API), `@SuppressWarnings`, `@FunctionalInterface` (marks single abstract method interfaces). Annotations power frameworks: `@Autowired` (Spring), `@Entity` (JPA), `@Test` (JUnit).",
      "**Generic methods** can have their own type parameters independent of the class: `public static <T extends Comparable<T>> T max(T a, T b)`. Diamond operator `<>` infers types: `Map<String, List<Integer>> map = new HashMap<>();`. Java 21 allows generics on records and sealed classes too.",
    ],
    code: `// === Generics, Enums & Annotations ===

// 1. Generic Class with Bounded Type
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A first()  { return first; }
    public B second() { return second; }

    // Generic method with its own type parameter
    public <C> Pair<A, C> mapSecond(java.util.function.Function<B, C> fn) {
        return new Pair<>(first, fn.apply(second));
    }

    @Override
    public String toString() {
        return "(%s, %s)".formatted(first, second);
    }
}

// 2. Bounded Generics — ensure type has compareTo
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
// max("apple", "banana") → "banana"
// max(10, 20)             → 20

// 3. Wildcards & PECS
public static double sumOfList(List<? extends Number> list) {
    // ? extends Number = PRODUCER (read-only)
    double sum = 0;
    for (Number n : list) sum += n.doubleValue();
    return sum;
}
// Works with List<Integer>, List<Double>, List<Long>, etc.

public static void addIntegers(List<? super Integer> list) {
    // ? super Integer = CONSUMER (write-only)
    list.add(1);
    list.add(2);
}

// 4. Enum with Fields and Methods
public enum HttpStatus {
    OK(200, "OK"),
    NOT_FOUND(404, "Not Found"),
    INTERNAL_ERROR(500, "Internal Server Error"),
    BAD_REQUEST(400, "Bad Request"),
    UNAUTHORIZED(401, "Unauthorized");

    private final int code;
    private final String message;

    HttpStatus(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int code()    { return code; }
    public String message() { return message; }

    public boolean isError() { return code >= 400; }

    // Reverse lookup by code
    public static HttpStatus fromCode(int code) {
        for (var status : values()) {
            if (status.code == code) return status;
        }
        throw new IllegalArgumentException("Unknown HTTP code: " + code);
    }
}

// Usage:
// HttpStatus status = HttpStatus.fromCode(404);
// status.isError()  → true
// status.message()  → "Not Found"

// 5. Custom Annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Cacheable {
    int ttlSeconds() default 300;
    String key() default "";
}

// Usage:
// @Cacheable(ttlSeconds = 600, key = "users")
// public List<User> getUsers() { ... }`,
    practice: "Create a generic Result<T> class that represents either a success (holding a value of type T) or a failure (holding an error message). Add methods isSuccess(), getValue(), getError(), map(Function), and a static factory of() and error(). Then use it to wrap a parseInt operation.",
    solution: `import java.util.function.Function;

public class Result<T> {
    private final T value;
    private final String error;
    private final boolean success;

    private Result(T value, String error, boolean success) {
        this.value = value;
        this.error = error;
        this.success = success;
    }

    public static <T> Result<T> of(T value) {
        return new Result<>(value, null, true);
    }

    public static <T> Result<T> error(String msg) {
        return new Result<>(null, msg, false);
    }

    public boolean isSuccess() { return success; }
    public T getValue()        { return value; }
    public String getError()   { return error; }

    public <R> Result<R> map(Function<T, R> fn) {
        if (!success) return Result.error(error);
        try {
            return Result.of(fn.apply(value));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @Override
    public String toString() {
        return success ? "Success(" + value + ")" : "Error(" + error + ")";
    }
}

// Usage:
// Result<Integer> r1 = safeParse("42");   → Success(42)
// Result<Integer> r2 = safeParse("abc");  → Error(...)
// r1.map(n -> n * 2) → Success(84)
static Result<Integer> safeParse(String s) {
    try { return Result.of(Integer.parseInt(s)); }
    catch (NumberFormatException e) { return Result.error("Not a number: " + s); }
}`,
  },
  {
    time: "Hour 5",
    title: "Collections Framework — List, Set, Map & Queue",
    concept: [
      "**The Collections Framework** provides data structure implementations through interfaces and classes. Core interfaces: `Collection` (root), `List` (ordered, duplicates allowed), `Set` (no duplicates), `Queue` (FIFO), `Deque` (double-ended), `Map` (key-value pairs). Always program to the interface: `List<String> list = new ArrayList<>();`.",
      "**List implementations:** `ArrayList` — backed by array, O(1) random access, O(n) insert/delete in middle. Best for: read-heavy workloads. `LinkedList` — doubly linked, O(1) insert/delete at ends, O(n) random access. Best for: queue operations. Immutable lists: `List.of(\"a\", \"b\")` and `List.copyOf(mutableList)`.",
      "**Set implementations:** `HashSet` — O(1) add/remove/contains, no order guarantee. `LinkedHashSet` — maintains insertion order. `TreeSet` — sorted order (implements `NavigableSet`), O(log n) operations, requires `Comparable` elements or a `Comparator`. `EnumSet` — ultra-fast bit-vector set for enum types.",
      "**Map implementations:** `HashMap` — O(1) get/put, no order. `LinkedHashMap` — insertion order (or access-order for LRU caches). `TreeMap` — sorted by key, O(log n). `ConcurrentHashMap` — thread-safe without full locking. Key methods: `put`, `get`, `getOrDefault`, `putIfAbsent`, `computeIfAbsent`, `merge`, `forEach`, `entrySet`.",
      "**Queue & Deque:** `ArrayDeque` — the go-to implementation for both stack and queue (faster than `Stack` and `LinkedList`). Stack operations: `push()`, `pop()`, `peek()`. Queue operations: `offer()`, `poll()`, `peek()`. `PriorityQueue` — elements come out in natural/comparator order, backed by a heap.",
      "**Utility methods:** `Collections.unmodifiableList()`, `Collections.sort()`, `Collections.reverse()`, `Collections.frequency()`. `Arrays.asList()` returns a fixed-size list backed by the array. Use `new ArrayList<>(Arrays.asList(...))` for a mutable copy. Java 9+ factory methods: `List.of()`, `Set.of()`, `Map.of()`, `Map.entry()`.",
    ],
    code: `import java.util.*;

// === Collections Framework ===

// 1. List — ordered, allows duplicates
List<String> fruits = new ArrayList<>(List.of("apple", "banana", "cherry"));
fruits.add("date");
fruits.add(1, "avocado");        // insert at index 1
fruits.remove("banana");
String first = fruits.get(0);    // "apple"
boolean has = fruits.contains("cherry"); // true

// Immutable list (cannot add/remove)
List<String> frozen = List.of("x", "y", "z");
// frozen.add("w");  // throws UnsupportedOperationException

// 2. Set — unique elements
Set<String> tags = new HashSet<>(Set.of("java", "spring", "docker"));
tags.add("java");  // no duplicate — ignored
tags.add("kubernetes");
System.out.println(tags.size());  // 4

// Sorted set
TreeSet<Integer> sorted = new TreeSet<>(List.of(5, 1, 3, 2, 4));
System.out.println(sorted);       // [1, 2, 3, 4, 5]
System.out.println(sorted.first()); // 1
System.out.println(sorted.headSet(3)); // [1, 2]

// 3. Map — key-value pairs
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);
scores.put("Charlie", 92);

int aliceScore = scores.getOrDefault("Alice", 0); // 95
scores.putIfAbsent("Bob", 100);  // Bob already exists, no change

// computeIfAbsent — great for caching / grouping
Map<String, List<String>> groups = new HashMap<>();
groups.computeIfAbsent("fruits", k -> new ArrayList<>()).add("apple");
groups.computeIfAbsent("fruits", k -> new ArrayList<>()).add("banana");
// {fruits=[apple, banana]}

// Iterate a map
scores.forEach((name, score) ->
    System.out.println(name + " → " + score)
);

// Map.of() — immutable map (Java 9+)
var config = Map.of("host", "localhost", "port", "8080");

// 4. Queue & Stack (use ArrayDeque)
Deque<String> stack = new ArrayDeque<>();
stack.push("first");
stack.push("second");
stack.push("third");
System.out.println(stack.pop());   // "third" (LIFO)

Queue<String> queue = new ArrayDeque<>();
queue.offer("first");
queue.offer("second");
System.out.println(queue.poll());  // "first" (FIFO)

// PriorityQueue — min-heap by default
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.addAll(List.of(5, 1, 3));
System.out.println(pq.poll());    // 1 (smallest first)

// 5. Sorting
List<String> names = new ArrayList<>(List.of("Charlie", "Alice", "Bob"));
Collections.sort(names);          // natural order
names.sort(Comparator.reverseOrder()); // reverse
names.sort(Comparator.comparingInt(String::length)); // by length`,
    practice: "Build a word frequency counter: given a sentence, count occurrences of each word (case-insensitive), then return the top 3 most frequent words as a List of Map.Entry<String, Integer> sorted by count descending.",
    solution: `import java.util.*;
import java.util.stream.*;

public class WordCounter {
    public static List<Map.Entry<String, Integer>> topWords(String text, int n) {
        Map<String, Integer> freq = new HashMap<>();
        for (String word : text.toLowerCase().split("\\\\W+")) {
            if (!word.isBlank()) {
                freq.merge(word, 1, Integer::sum);
            }
        }
        return freq.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(n)
            .toList();
    }

    public static void main(String[] args) {
        String text = "the cat sat on the mat the cat ate the rat";
        var top3 = topWords(text, 3);
        top3.forEach(e ->
            System.out.println(e.getKey() + " → " + e.getValue()));
        // the → 4, cat → 2, sat → 1 (or ate/on/mat/rat)
    }
}`,
  },
  {
    time: "Hour 6",
    title: "Streams API — Filter, Map, Reduce & Collectors",
    concept: [
      "**Streams** (java.util.stream) provide a functional, declarative way to process collections. A stream pipeline has: (1) **Source** (collection, array, generator), (2) **Intermediate operations** (lazy — filter, map, sorted, distinct, flatMap), (3) **Terminal operation** (triggers execution — collect, forEach, reduce, count, findFirst). Streams are single-use: once consumed, create a new one.",
      "**Key intermediate operations:** `filter(Predicate)` — keep elements matching condition. `map(Function)` — transform each element. `flatMap(Function)` — flatten nested collections. `sorted()` / `sorted(Comparator)` — order elements. `distinct()` — remove duplicates. `peek(Consumer)` — debug without modifying. `limit(n)` / `skip(n)` — pagination.",
      "**Terminal operations:** `collect(Collectors.toList())` — gather into a list. `toList()` (Java 16+) — shorthand immutable list. `forEach(Consumer)` — side effects. `reduce(identity, BinaryOperator)` — aggregate into single value. `count()`, `min()`, `max()` — aggregations. `findFirst()`, `findAny()` — return Optional. `anyMatch()`, `allMatch()`, `noneMatch()` — boolean tests.",
      "**Collectors** are powerful terminal operations. `Collectors.groupingBy(classifier)` — group elements by key (like SQL GROUP BY). `Collectors.partitioningBy(predicate)` — split into true/false groups. `Collectors.joining(\", \")` — concatenate strings. `Collectors.counting()`, `Collectors.summarizingInt()` — statistics. `Collectors.toMap(keyFn, valueFn)` — collect into a map.",
      "**Primitive streams** (`IntStream`, `LongStream`, `DoubleStream`) avoid autoboxing overhead. Convert with `mapToInt()`, `mapToDouble()`. Special methods: `sum()`, `average()`, `range(1, 10)`, `rangeClosed(1, 10)`. `IntStream.range(0, 10).forEach(...)` replaces traditional for loops in functional code.",
      "**Parallel streams** split work across CPU cores: `list.parallelStream()` or `stream.parallel()`. Use for CPU-intensive operations on large datasets (>10k elements). Avoid for I/O-bound work, small collections, or when order matters. Parallel streams use the common ForkJoinPool. Ensure operations are stateless, non-interfering, and associative.",
    ],
    code: `import java.util.*;
import java.util.stream.*;

// === Streams API ===

record Product(String name, String category, double price, boolean inStock) {}

List<Product> products = List.of(
    new Product("Laptop", "Electronics", 999.99, true),
    new Product("Mouse", "Electronics", 29.99, true),
    new Product("Book", "Education", 19.99, true),
    new Product("Desk", "Furniture", 299.99, false),
    new Product("Chair", "Furniture", 199.99, true),
    new Product("Phone", "Electronics", 699.99, true),
    new Product("Pen", "Education", 2.99, true)
);

// 1. Filter + Map + Sort + Collect
List<String> expensiveElectronics = products.stream()
    .filter(p -> p.category().equals("Electronics"))
    .filter(Product::inStock)
    .filter(p -> p.price() > 100)
    .sorted(Comparator.comparingDouble(Product::price).reversed())
    .map(Product::name)
    .toList();  // [Laptop, Phone]

// 2. Reduce — aggregate to single value
double totalValue = products.stream()
    .filter(Product::inStock)
    .mapToDouble(Product::price)
    .sum();  // 1952.94

// Custom reduce
Optional<Product> mostExpensive = products.stream()
    .filter(Product::inStock)
    .reduce((a, b) -> a.price() > b.price() ? a : b);

// 3. groupingBy — like SQL GROUP BY
Map<String, List<Product>> byCategory = products.stream()
    .collect(Collectors.groupingBy(Product::category));
// {Electronics=[Laptop, Mouse, Phone], Education=[Book, Pen], ...}

// Group + count
Map<String, Long> countByCategory = products.stream()
    .collect(Collectors.groupingBy(Product::category, Collectors.counting()));

// Group + average price
Map<String, Double> avgPriceByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::category,
        Collectors.averagingDouble(Product::price)
    ));

// 4. partitioningBy — split into true/false
Map<Boolean, List<Product>> partitioned = products.stream()
    .collect(Collectors.partitioningBy(Product::inStock));
List<Product> inStock = partitioned.get(true);
List<Product> outOfStock = partitioned.get(false);

// 5. flatMap — flatten nested collections
List<List<String>> nested = List.of(
    List.of("a", "b"), List.of("c", "d"), List.of("e")
);
List<String> flat = nested.stream()
    .flatMap(Collection::stream)
    .toList();  // [a, b, c, d, e]

// 6. IntStream for ranges and numeric operations
int sumOfSquares = IntStream.rangeClosed(1, 10)
    .map(n -> n * n)
    .sum();  // 385

// 7. Collectors.toMap
Map<String, Double> priceByName = products.stream()
    .collect(Collectors.toMap(Product::name, Product::price));

// 8. joining — concatenate strings
String productList = products.stream()
    .map(Product::name)
    .collect(Collectors.joining(", ", "[", "]"));
// [Laptop, Mouse, Book, Desk, Chair, Phone, Pen]`,
    practice: "Given a list of Order records (id, customer, items: List<String>, total), write stream pipelines to: (1) Find top 3 customers by total spend. (2) Collect all unique items across all orders. (3) Group orders by customer and compute their average order value.",
    solution: `import java.util.*;
import java.util.stream.*;

record Order(String id, String customer, List<String> items, double total) {}

class OrderAnalytics {
    static List<String> topCustomers(List<Order> orders, int n) {
        return orders.stream()
            .collect(Collectors.groupingBy(
                Order::customer,
                Collectors.summingDouble(Order::total)
            ))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .limit(n)
            .map(Map.Entry::getKey)
            .toList();
    }

    static Set<String> allUniqueItems(List<Order> orders) {
        return orders.stream()
            .flatMap(o -> o.items().stream())
            .collect(Collectors.toSet());
    }

    static Map<String, Double> avgOrderValueByCustomer(List<Order> orders) {
        return orders.stream()
            .collect(Collectors.groupingBy(
                Order::customer,
                Collectors.averagingDouble(Order::total)
            ));
    }
}`,
  },
  {
    time: "Hour 7",
    title: "Exception Handling & Optional",
    concept: [
      "**Exceptions** handle errors that disrupt normal program flow. Java's hierarchy: `Throwable` → `Error` (JVM problems, don't catch) and `Exception` → `RuntimeException` (unchecked) and checked exceptions. Checked exceptions MUST be caught or declared (`throws`). Unchecked exceptions (NullPointerException, IllegalArgumentException) don't require explicit handling.",
      "**try-catch-finally:** `try { riskyCode(); } catch (IOException e) { handleError(e); } finally { cleanup(); }`. The `finally` block ALWAYS runs. Multi-catch: `catch (IOException | SQLException e)`. **try-with-resources** (Java 7+): `try (var in = new FileInputStream(f)) { ... }` — automatically closes AutoCloseable resources, eliminating resource leaks.",
      "**Custom exceptions** should extend `RuntimeException` (unchecked, for programming errors) or `Exception` (checked, for recoverable conditions). Include: descriptive message, cause chain, custom fields. Pattern: `throw new OrderNotFoundException(\"Order %s not found\".formatted(id));`. Never catch `Exception` or `Throwable` generically — be specific.",
      "**Best practices:** (1) Catch specific exceptions, not generic. (2) Don't use exceptions for flow control. (3) Always include context in messages. (4) Log and rethrow or wrap — don't swallow. (5) Use unchecked exceptions for programming errors (bad input). (6) Use checked exceptions for recoverable I/O failures. (7) Always close resources with try-with-resources.",
      "**Optional<T>** (Java 8+) represents a value that may or may not be present — replaces `null`. Create: `Optional.of(value)`, `Optional.ofNullable(maybeNull)`, `Optional.empty()`. Chain: `opt.map(fn)`, `opt.flatMap(fn)`, `opt.filter(pred)`. Extract: `opt.orElse(default)`, `opt.orElseGet(supplier)`, `opt.orElseThrow()`. NEVER call `opt.get()` without checking — use `orElse*` methods.",
      "**Optional anti-patterns:** Don't use Optional as method parameters — use overloading instead. Don't use Optional for fields — it's not Serializable. Don't use `isPresent() + get()` — use `ifPresent()`, `map()`, `orElse()`. Optional is for RETURN TYPES to signal 'this might not have a result.' Stream's `findFirst()`, `reduce()`, `max()`, `min()` all return Optional.",
    ],
    code: `// === Exception Handling & Optional ===

// 1. Custom Exception Hierarchy
public class AppException extends RuntimeException {
    private final String errorCode;

    public AppException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

public class NotFoundException extends AppException {
    public NotFoundException(String entity, Object id) {
        super("%s with id '%s' not found".formatted(entity, id), "NOT_FOUND");
    }
}

public class ValidationException extends AppException {
    private final Map<String, String> fieldErrors;

    public ValidationException(Map<String, String> errors) {
        super("Validation failed: " + errors, "VALIDATION_ERROR");
        this.fieldErrors = Map.copyOf(errors);
    }

    public Map<String, String> getFieldErrors() { return fieldErrors; }
}

// 2. try-with-resources (auto-close)
public static List<String> readLines(Path file) throws IOException {
    try (var reader = Files.newBufferedReader(file)) {
        return reader.lines().toList();
    }
    // reader is automatically closed, even if exception occurs
}

// 3. Practical exception handling pattern
public class UserService {
    private final Map<String, User> db = new HashMap<>();

    public User findById(String id) {
        return Optional.ofNullable(db.get(id))
            .orElseThrow(() -> new NotFoundException("User", id));
    }

    public User create(String name, String email) {
        var errors = new HashMap<String, String>();
        if (name == null || name.isBlank()) errors.put("name", "required");
        if (email == null || !email.contains("@")) errors.put("email", "invalid");
        if (!errors.isEmpty()) throw new ValidationException(errors);

        var user = new User(UUID.randomUUID().toString(), name, email);
        db.put(user.id(), user);
        return user;
    }
}

// 4. Optional — the right way
public class OrderService {
    public Optional<Order> findOrder(String id) {
        // Returns Optional instead of null
        return Optional.ofNullable(orderRepository.get(id));
    }

    public String getOrderSummary(String id) {
        return findOrder(id)
            .map(o -> "Order %s: $%.2f".formatted(o.id(), o.total()))
            .orElse("Order not found");
    }

    public double getOrderTotal(String id) {
        return findOrder(id)
            .map(Order::total)
            .orElseThrow(() -> new NotFoundException("Order", id));
    }

    // Chaining Optionals
    public Optional<String> getCustomerEmail(String orderId) {
        return findOrder(orderId)
            .map(Order::customerId)         // Optional<String>
            .flatMap(this::findCustomer)     // Optional<Customer>
            .map(Customer::email);           // Optional<String>
    }
}

// 5. DON'T do this with Optional:
// if (opt.isPresent()) { return opt.get(); }  // BAD
// return opt.orElse(defaultValue);             // GOOD

// Optional as stream source (Java 9+)
Optional<String> maybeVal = Optional.of("hello");
List<String> list = maybeVal.stream().toList(); // ["hello"] or []`,
    practice: "Build a ConfigLoader class that reads key-value config from a Map<String, String>. Methods: getString(key) returns Optional<String>, getInt(key) returns Optional<Integer> (parsing safely), getRequired(key) throws ConfigMissingException. All parsing errors should produce descriptive custom exceptions.",
    solution: `import java.util.*;

class ConfigMissingException extends RuntimeException {
    public ConfigMissingException(String key) {
        super("Required config key missing: " + key);
    }
}

class ConfigParseException extends RuntimeException {
    public ConfigParseException(String key, String value, String type) {
        super("Cannot parse config '%s'='%s' as %s".formatted(key, value, type));
    }
}

public class ConfigLoader {
    private final Map<String, String> config;

    public ConfigLoader(Map<String, String> config) {
        this.config = Map.copyOf(config);
    }

    public Optional<String> getString(String key) {
        return Optional.ofNullable(config.get(key))
            .filter(v -> !v.isBlank());
    }

    public Optional<Integer> getInt(String key) {
        return getString(key).map(v -> {
            try { return Integer.parseInt(v); }
            catch (NumberFormatException e) {
                throw new ConfigParseException(key, v, "Integer");
            }
        });
    }

    public String getRequired(String key) {
        return getString(key)
            .orElseThrow(() -> new ConfigMissingException(key));
    }

    public int getIntOrDefault(String key, int defaultValue) {
        return getInt(key).orElse(defaultValue);
    }
}`,
  },
  {
    time: "Hour 8",
    title: "Functional Programming — Lambdas, Method References & Functional Interfaces",
    concept: [
      "**Lambda expressions** (Java 8+) are concise anonymous functions: `(parameters) -> expression` or `(parameters) -> { statements; }`. They implement functional interfaces (interfaces with exactly one abstract method). Examples: `Comparator<String> byLength = (a, b) -> a.length() - b.length();` or `Runnable task = () -> System.out.println(\"Running\");`.",
      "**Core functional interfaces** in `java.util.function`: `Function<T,R>` — takes T, returns R. `Predicate<T>` — takes T, returns boolean. `Consumer<T>` — takes T, returns void. `Supplier<T>` — takes nothing, returns T. `BiFunction<T,U,R>`, `BiPredicate<T,U>`, `BiConsumer<T,U>` — two-argument versions. `UnaryOperator<T>` = `Function<T,T>`, `BinaryOperator<T>` = `BiFunction<T,T,T>`.",
      "**Method references** are shorthand for lambdas that just call an existing method: `String::toUpperCase` (instance method), `Integer::parseInt` (static method), `System.out::println` (bound instance), `ArrayList::new` (constructor reference). Use when the lambda body is just a single method call: `.map(s -> s.toUpperCase())` → `.map(String::toUpperCase)`.",
      "**Function composition** chains functions together: `Function<A,B>.andThen(Function<B,C>)` = A→C. `Function<A,B>.compose(Function<C,A>)` = C→B. `Predicate.and()`, `Predicate.or()`, `Predicate.negate()`. Build complex behavior from simple building blocks: `var isAdult = ((Predicate<Person>) p -> p.age() >= 18).and(p -> p.hasId());`.",
      "**Effectively final variables:** Lambdas can capture local variables but only if they are effectively final (never reassigned after initialization). This ensures thread safety. If you need mutation, use `AtomicInteger`, a single-element array, or restructure your logic to avoid mutation.",
      "**The `@FunctionalInterface` annotation** tells the compiler to enforce the single-abstract-method rule. All standard functional interfaces have it. Your custom ones should too: `@FunctionalInterface interface Validator<T> { boolean validate(T value); }`. SAM (Single Abstract Method) conversion lets you pass lambdas wherever a functional interface is expected.",
    ],
    code: `import java.util.function.*;
import java.util.*;

// === Functional Programming ===

// 1. Core Functional Interfaces in Action
Function<String, Integer> strLen = String::length;
Predicate<String> isNotBlank = s -> !s.isBlank();
Consumer<String> printer = System.out::println;
Supplier<List<String>> listFactory = ArrayList::new;
UnaryOperator<String> upper = String::toUpperCase;
BinaryOperator<Integer> add = Integer::sum;

// 2. Method References (4 kinds)
// Static method:    Integer::parseInt        (s) -> Integer.parseInt(s)
// Instance method:  String::toUpperCase      (s) -> s.toUpperCase()
// Bound instance:   System.out::println      (s) -> System.out.println(s)
// Constructor:      ArrayList::new           ()  -> new ArrayList<>()

List<String> words = List.of("hello", "world", "java");
words.stream().map(String::toUpperCase).forEach(System.out::println);

// 3. Function Composition
Function<String, String> trim = String::strip;
Function<String, String> lower = String::toLowerCase;
Function<String, String> normalize = trim.andThen(lower);
// normalize.apply("  HELLO  ") → "hello"

Predicate<Integer> isPositive = n -> n > 0;
Predicate<Integer> isEven = n -> n % 2 == 0;
Predicate<Integer> isPositiveEven = isPositive.and(isEven);
// isPositiveEven.test(4) → true

// 4. Custom Functional Interfaces
@FunctionalInterface
interface Validator<T> {
    boolean validate(T value);

    default Validator<T> and(Validator<T> other) {
        return value -> this.validate(value) && other.validate(value);
    }

    default Validator<T> or(Validator<T> other) {
        return value -> this.validate(value) || other.validate(value);
    }

    default Validator<T> negate() {
        return value -> !this.validate(value);
    }
}

// Compose validators
Validator<String> notBlank = s -> s != null && !s.isBlank();
Validator<String> minLength = s -> s.length() >= 8;
Validator<String> hasDigit = s -> s.chars().anyMatch(Character::isDigit);

Validator<String> passwordValidator = notBlank
    .and(minLength)
    .and(hasDigit);

// passwordValidator.validate("secret1!")  → true
// passwordValidator.validate("short")     → false

// 5. Higher-Order Functions (return functions)
static <T> Predicate<T> not(Predicate<T> p) {
    return p.negate();
}

static Function<Integer, Integer> multiplier(int factor) {
    return n -> n * factor;  // captures 'factor' (effectively final)
}

var triple = multiplier(3);
var result = triple.apply(5);  // 15

// 6. Comparator as Functional Interface
List<Person> people = /* ... */;
people.sort(
    Comparator.comparing(Person::lastName)
        .thenComparing(Person::firstName)
        .thenComparingInt(Person::age)
        .reversed()
);`,
    practice: "Create a generic Pipeline<T> class that chains transformations. It should support: addStep(UnaryOperator<T>), addFilter(Predicate<T>), and execute(T input) returns Optional<T>. Also write a static factory Pipeline.of(UnaryOperator) to start a pipeline. Test it with a string-cleaning pipeline that trims, lowercases, removes digits, and rejects empty results.",
    solution: `import java.util.*;
import java.util.function.*;

public class Pipeline<T> {
    private final List<UnaryOperator<T>> steps = new ArrayList<>();
    private final List<Predicate<T>> filters = new ArrayList<>();

    public static <T> Pipeline<T> of(UnaryOperator<T> first) {
        var p = new Pipeline<T>();
        p.steps.add(first);
        return p;
    }

    public Pipeline<T> addStep(UnaryOperator<T> step) {
        steps.add(step); return this;
    }

    public Pipeline<T> addFilter(Predicate<T> filter) {
        filters.add(filter); return this;
    }

    public Optional<T> execute(T input) {
        T result = input;
        for (var step : steps) {
            result = step.apply(result);
        }
        for (var filter : filters) {
            if (!filter.test(result)) return Optional.empty();
        }
        return Optional.of(result);
    }
}

// Usage:
// var cleaner = Pipeline.<String>of(String::strip)
//     .addStep(String::toLowerCase)
//     .addStep(s -> s.replaceAll("\\\\d", ""))
//     .addFilter(s -> !s.isBlank());
//
// cleaner.execute("  Hello123  ")  → Optional["hello"]
// cleaner.execute("  123  ")        → Optional.empty`,
  },
  {
    time: "Hour 9",
    title: "Concurrency — Threads, Executors, CompletableFuture & Virtual Threads",
    concept: [
      "**Threads** are the basic unit of concurrency. Create with `new Thread(() -> task()).start()` or implement `Runnable`. Threads share the process's memory — this creates visibility and ordering issues. **Never** use raw threads in production — use `ExecutorService` instead. Key problems: race conditions, deadlocks, thread starvation.",
      "**ExecutorService** manages thread pools: `Executors.newFixedThreadPool(nThreads)` — bounded pool for CPU work. `Executors.newCachedThreadPool()` — elastic pool for short I/O tasks. `Executors.newVirtualThreadPerTaskExecutor()` (Java 21+) — lightweight virtual threads for massive concurrency. Submit tasks with `submit(Callable)` which returns a `Future`.",
      "**Synchronization primitives:** `synchronized` blocks/methods ensure mutual exclusion. `volatile` guarantees visibility across threads. `Lock` (ReentrantLock) provides more control: tryLock, timed lock, interruptible. `AtomicInteger`, `AtomicReference` — lock-free thread-safe mutations. `ConcurrentHashMap` — thread-safe map without global locking. Use `java.util.concurrent` — never roll your own.",
      "**CompletableFuture** (Java 8+) is Java's answer to async/await. Chain async operations: `supplyAsync(() -> fetchData()).thenApply(data -> transform(data)).thenAccept(result -> save(result))`. Combine: `allOf(f1, f2, f3)`, `anyOf(f1, f2)`. Error handling: `exceptionally(e -> fallback)`, `handle((result, error) -> ...)`. Run stages on custom executors to control thread pools.",
      "**Virtual Threads** (Java 21+, Project Loom) are lightweight threads managed by the JVM, not the OS. You can run MILLIONS of virtual threads simultaneously. They're ideal for I/O-bound workloads (HTTP calls, database queries). Syntax: `Thread.ofVirtual().start(task)` or `Executors.newVirtualThreadPerTaskExecutor()`. Virtual threads make blocking I/O scalable — no need for reactive frameworks.",
      "**Structured Concurrency** (Preview, Java 21+) ensures that concurrent subtasks are treated as a unit: if one fails, others are cancelled. Uses `StructuredTaskScope` to manage related tasks. This prevents thread leaks, dangling tasks, and orphaned operations. It's the future of Java concurrency — combining readability with safety.",
    ],
    code: `import java.util.concurrent.*;
import java.util.List;

// === Concurrency ===

// 1. ExecutorService — proper thread management
try (var executor = Executors.newFixedThreadPool(4)) {
    Future<String> future = executor.submit(() -> {
        Thread.sleep(1000); // simulate work
        return "Result from thread: " + Thread.currentThread().getName();
    });
    String result = future.get(); // blocks until done
    System.out.println(result);
}
// Auto-closes the executor (Java 19+ AutoCloseable)

// 2. CompletableFuture — async pipeline
CompletableFuture<String> pipeline = CompletableFuture
    .supplyAsync(() -> fetchUserFromDb("user-42"))     // runs async
    .thenApply(user -> enrichWithPermissions(user))     // transform
    .thenApply(user -> serializeToJson(user))           // transform
    .exceptionally(ex -> "{\\"error\\": \\"" + ex.getMessage() + "\\"}");

String json = pipeline.join(); // non-checked get

// Combine multiple async operations
CompletableFuture<String> userFuture = CompletableFuture
    .supplyAsync(() -> fetchUser(id));
CompletableFuture<List<Order>> ordersFuture = CompletableFuture
    .supplyAsync(() -> fetchOrders(id));
CompletableFuture<Double> balanceFuture = CompletableFuture
    .supplyAsync(() -> fetchBalance(id));

// Wait for all, then combine
CompletableFuture.allOf(userFuture, ordersFuture, balanceFuture)
    .thenRun(() -> {
        var user = userFuture.join();
        var orders = ordersFuture.join();
        var balance = balanceFuture.join();
        System.out.println(user + " has " + orders.size() + " orders");
    });

// 3. Virtual Threads (Java 21+) — millions of threads!
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Launch 100,000 concurrent tasks — no problem!
    List<Future<String>> futures = new java.util.ArrayList<>();
    for (int i = 0; i < 100_000; i++) {
        final int taskId = i;
        futures.add(executor.submit(() -> {
            Thread.sleep(1000); // simulate I/O (HTTP call, DB query)
            return "Task-" + taskId + " on " + Thread.currentThread();
        }));
    }
    // All 100K complete in ~1 second (not 100K seconds)
    System.out.println("Completed: " + futures.size());
}

// Simple virtual thread
Thread.ofVirtual().name("my-vtask").start(() -> {
    System.out.println("Hello from virtual thread!");
});

// 4. Thread-safe collections
ConcurrentHashMap<String, Integer> cache = new ConcurrentHashMap<>();
cache.computeIfAbsent("key", k -> expensiveComputation(k));
cache.merge("counter", 1, Integer::sum); // atomic increment

// 5. Synchronized block (when needed)
class Counter {
    private int count = 0;
    private final Object lock = new Object();

    public void increment() {
        synchronized (lock) { count++; }
    }
    public int get() {
        synchronized (lock) { return count; }
    }
}

// Better: use AtomicInteger
import java.util.concurrent.atomic.AtomicInteger;
AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();   // thread-safe
atomicCount.addAndGet(5);        // thread-safe
atomicCount.compareAndSet(6, 0); // CAS operation`,
    practice: "Build an async PriceFetcher that queries 3 different price sources concurrently using CompletableFuture. Return the lowest price within a 2-second timeout. If any source fails, use the remaining. If all fail, return Optional.empty().",
    solution: `import java.util.concurrent.*;
import java.util.*;

public class PriceFetcher {
    private final ExecutorService executor =
        Executors.newVirtualThreadPerTaskExecutor();

    public Optional<Double> getBestPrice(String product) {
        var sources = List.of(
            fetchPriceAsync(product, "Amazon"),
            fetchPriceAsync(product, "eBay"),
            fetchPriceAsync(product, "Walmart")
        );

        List<Double> prices = sources.stream()
            .map(f -> {
                try { return f.get(2, TimeUnit.SECONDS); }
                catch (Exception e) { return null; }
            })
            .filter(Objects::nonNull)
            .toList();

        return prices.stream().min(Double::compareTo);
    }

    private CompletableFuture<Double> fetchPriceAsync(
            String product, String source) {
        return CompletableFuture.supplyAsync(
            () -> queryPrice(product, source), executor
        );
    }

    private double queryPrice(String product, String source) {
        // Simulate HTTP call
        try { Thread.sleep((long)(Math.random() * 1000)); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return 10.0 + Math.random() * 90;
    }
}`,
  },
  {
    time: "Hour 10",
    title: "I/O, Date/Time API & Modern Java Best Practices",
    concept: [
      "**Java I/O** has two APIs: classic `java.io` (stream-based, blocking) and modern `java.nio` (buffer/channel-based, non-blocking). For files, always use `java.nio.file.Path` and `java.nio.file.Files`. Key methods: `Files.readString(path)`, `Files.writeString(path, content)`, `Files.readAllLines(path)`, `Files.lines(path)` (lazy stream), `Files.walk(dir)` (recursive traversal).",
      "**Path and Files** are the modern file API (Java 7+). Create paths: `Path.of(\"/home/user/file.txt\")` or `Path.of(\"dir\", \"sub\", \"file.txt\")`. Combine: `path.resolve(\"child\")`. Check: `Files.exists(path)`, `Files.isDirectory(path)`. Copy/move: `Files.copy(src, dst, REPLACE_EXISTING)`. All `Files` methods properly handle resource cleanup.",
      "**java.time** (Java 8+) replaces the broken `Date`/`Calendar` classes. Core types: `LocalDate` (date only), `LocalTime` (time only), `LocalDateTime` (both), `ZonedDateTime` (with timezone), `Instant` (UTC timestamp), `Duration` (time-based amount), `Period` (date-based amount). All are immutable and thread-safe. Parse: `LocalDate.parse(\"2024-03-15\")`. Format: `date.format(DateTimeFormatter.ofPattern(\"dd/MM/yyyy\"))`.",
      "**Serialization:** For data exchange, use **JSON** (Jackson or Gson). Jackson: `ObjectMapper mapper = new ObjectMapper(); String json = mapper.writeValueAsString(obj); MyObj obj = mapper.readValue(json, MyObj.class)`. For internal persistence, use Java Serialization sparingly (security risks). **Records** work great with Jackson — auto-detected constructors and getters.",
      "**Modern Java best practices:** (1) Use `var` for local variables when type is obvious. (2) Prefer records over POJOs. (3) Use sealed interfaces for type hierarchies. (4) Use pattern matching switch/instanceof. (5) Prefer immutable collections (`List.of()`). (6) Use Optional for return types. (7) Use Streams over loops. (8) Use try-with-resources. (9) Prefer `String.formatted()` over concatenation. (10) Use virtual threads for I/O.",
      "**JVM tuning essentials:** Set heap size: `-Xms512m -Xmx2g`. Choose GC: `-XX:+UseZGC` (low latency, Java 21 default) or `-XX:+UseG1GC` (balanced). Monitor with: `jconsole`, `jvisualvm`, `jfr` (Java Flight Recorder). Profile memory: use heap dumps + MAT. Production flags: `-XX:+HeapDumpOnOutOfMemoryError`, `-XX:+UseStringDeduplication`. GraalVM native image for serverless: `native-image -jar app.jar`.",
    ],
    code: `import java.nio.file.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.io.*;
import java.util.stream.*;

// === File I/O with java.nio ===

// 1. Read and Write files — simple
String content = Files.readString(Path.of("data.txt"));
Files.writeString(Path.of("output.txt"), "Hello, Java!",
    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

// Read lines into list
List<String> lines = Files.readAllLines(Path.of("data.csv"));

// Lazy line stream (for large files — doesn't load all into memory)
try (Stream<String> stream = Files.lines(Path.of("huge-log.txt"))) {
    long errorCount = stream
        .filter(line -> line.contains("ERROR"))
        .count();
}

// 2. Path operations
Path base = Path.of("/app/data");
Path file = base.resolve("users").resolve("alice.json");
// /app/data/users/alice.json

Path relative = base.relativize(file);  // users/alice.json
String filename = file.getFileName().toString(); // alice.json

// 3. Walk directory tree
try (Stream<Path> tree = Files.walk(Path.of("/app/src"))) {
    List<Path> javaFiles = tree
        .filter(p -> p.toString().endsWith(".java"))
        .toList();
}

// Copy file
Files.copy(Path.of("src.txt"), Path.of("dst.txt"),
    StandardCopyOption.REPLACE_EXISTING);

// === Date/Time API ===

// 4. Core date/time types
LocalDate today = LocalDate.now();                    // 2024-12-15
LocalDate birthday = LocalDate.of(1990, 6, 15);
LocalTime now = LocalTime.now();                       // 14:30:00
LocalDateTime dateTime = LocalDateTime.now();
ZonedDateTime zoned = ZonedDateTime.now(ZoneId.of("America/New_York"));
Instant timestamp = Instant.now();                     // UTC epoch

// Arithmetic (immutable — returns new object)
LocalDate nextWeek = today.plusWeeks(1);
LocalDate lastMonth = today.minusMonths(1);
Period age = Period.between(birthday, today);          // P34Y6M
Duration duration = Duration.ofHours(2).plusMinutes(30);

// Formatting
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy");
String formatted = today.format(fmt);                  // "15 Dec 2024"
LocalDate parsed = LocalDate.parse("15 Dec 2024", fmt);

// 5. Comparing and querying dates
boolean isBefore = birthday.isBefore(today);           // true
boolean isWeekend = today.getDayOfWeek() == DayOfWeek.SATURDAY
    || today.getDayOfWeek() == DayOfWeek.SUNDAY;
long daysBetween = ChronoUnit.DAYS.between(birthday, today);

// === JSON with Jackson ===

// 6. Jackson ObjectMapper (industry standard)
// ObjectMapper mapper = new ObjectMapper();
// mapper.registerModule(new JavaTimeModule()); // for java.time
//
// // Serialize
// record Product(String name, double price, LocalDate created) {}
// var product = new Product("Laptop", 999.99, LocalDate.now());
// String json = mapper.writeValueAsString(product);
// // {"name":"Laptop","price":999.99,"created":"2024-12-15"}
//
// // Deserialize
// Product restored = mapper.readValue(json, Product.class);
//
// // Pretty print
// String pretty = mapper.writerWithDefaultPrettyPrinter()
//     .writeValueAsString(product);

// === Modern Java Checklist ===
// ✅ var for local variables
// ✅ Records for data classes
// ✅ Sealed interfaces for hierarchies
// ✅ Pattern matching switch & instanceof
// ✅ Immutable collections (List.of, Map.of)
// ✅ Optional for return types
// ✅ Streams over loops
// ✅ try-with-resources
// ✅ String.formatted() for templates
// ✅ Virtual threads for I/O concurrency
// ✅ Text blocks for multi-line strings
// ✅ CompletableFuture for async pipelines`,
    practice: "Build a LogAnalyzer that reads a log file line by line (lazy stream), parses timestamps, filters entries from the last 24 hours, groups by log level (INFO, WARN, ERROR), and outputs a summary with counts and the latest entry per level. Use java.time and Streams throughout.",
    solution: `import java.nio.file.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.*;

record LogEntry(LocalDateTime time, String level, String message) {}

public class LogAnalyzer {
    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static void analyze(Path logFile) throws Exception {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        try (Stream<String> lines = Files.lines(logFile)) {
            Map<String, List<LogEntry>> byLevel = lines
                .map(LogAnalyzer::parseLine)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(e -> e.time().isAfter(cutoff))
                .collect(Collectors.groupingBy(LogEntry::level));

            byLevel.forEach((level, entries) -> {
                var latest = entries.stream()
                    .max(Comparator.comparing(LogEntry::time))
                    .map(LogEntry::message).orElse("N/A");
                System.out.printf(
                    "%s: %d entries, latest: %s%n",
                    level, entries.size(), latest
                );
            });
        }
    }

    private static Optional<LogEntry> parseLine(String line) {
        try {
            // Format: "2024-12-15 10:30:00 [INFO] Server started"
            var ts = LocalDateTime.parse(line.substring(0, 19), FMT);
            int lvlStart = line.indexOf('[') + 1;
            int lvlEnd = line.indexOf(']');
            var level = line.substring(lvlStart, lvlEnd);
            var msg = line.substring(lvlEnd + 2);
            return Optional.of(new LogEntry(ts, level, msg));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}`,
  },
  {
    time: "Hour 11",
    title: "HashMap Internals, equals/hashCode Contract & ConcurrentHashMap",
    concept: [
      "**HashMap internals:** A HashMap is an array of 'buckets' (default 16). When you call `put(key, value)`, Java: (1) Computes `key.hashCode()`. (2) Applies a spread function to reduce collisions. (3) Calculates bucket index: `(n-1) & hash`. (4) Stores a Node(hash, key, value, next) in that bucket. If two keys map to the same bucket, they form a linked list (or a red-black tree if chain length exceeds 8).",
      "**Load factor and rehashing:** The default load factor is 0.75 — when 75% of buckets are occupied, HashMap doubles its capacity (rehash). Rehashing is expensive: all entries are redistributed. Initial capacity matters: if you know you'll store 1000 entries, allocate `new HashMap<>(1334)` (1000/0.75) to avoid rehashing. Always size your maps intentionally in performance-critical code.",
      "**The equals/hashCode contract** is CRITICAL: (1) If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` MUST be true. (2) If hashCodes differ, equals MUST return false. (3) If hashCodes are the same, equals CAN return false (collision). Breaking this contract causes lost entries, duplicate keys, and silent data corruption. Records auto-generate correct equals/hashCode.",
      "**Implementing equals correctly:** (1) Check `this == other` (identity). (2) Check `other instanceof MyClass obj` (pattern match). (3) Compare each significant field. For objects: `Objects.equals(a, b)`. For arrays: `Arrays.equals()`. For doubles: `Double.compare()`. Override in BOTH equals AND hashCode. Use `@Override` annotation to catch typos. Never depend on default Object.equals (reference identity) for value objects.",
      "**hashCode best practices:** Use `Objects.hash(field1, field2, ...)` for convenience, or manual computation for performance: `31 * hash + field.hashCode()`. The multiplier 31 is a prime that enables bitwise optimization. Use the same fields in hashCode as in equals. Immutable fields are ideal — mutable hashCodes can 'lose' entries in HashSet/HashMap if the key mutates after insertion.",
      "**ConcurrentHashMap** is the thread-safe alternative to HashMap. It uses segment-level locking (Java 8+: CAS + synchronized on individual buckets) — much faster than `Collections.synchronizedMap()` which locks the entire map. Key atomic methods: `computeIfAbsent()`, `merge()`, `putIfAbsent()`. Use for caches, counters, and shared state. Never iterate and modify a regular HashMap concurrently — use ConcurrentHashMap.",
    ],
    code: `import java.util.*;

// === HashMap Internals ===

// 1. How HashMap stores entries (conceptual view)
// Bucket[0] -> null
// Bucket[1] -> Node("alice", 95) -> Node("bob", 87) -> null  (collision!)
// Bucket[2] -> Node("charlie", 92) -> null
// Bucket[3] -> null
// ...
// Bucket[15] -> Node("dave", 78) -> null

// When chain length > 8, linked list → red-black tree (O(n) → O(log n))

// 2. Correct equals() and hashCode() implementation
public class Employee {
    private final String id;
    private final String name;
    private final String department;

    public Employee(String id, String name, String department) {
        this.id = id;
        this.name = name;
        this.department = department;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                          // Step 1: identity
        if (!(o instanceof Employee emp)) return false;      // Step 2: type check
        return Objects.equals(id, emp.id)                    // Step 3: field compare
            && Objects.equals(name, emp.name)
            && Objects.equals(department, emp.department);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, department);           // Same fields as equals
    }
}

// 3. What happens if you break the contract
var map = new HashMap<Employee, String>();
var emp = new Employee("E001", "Alice", "Engineering");
map.put(emp, "Senior Dev");

// BAD: If equals uses 'id' but hashCode doesn't include 'id':
// map.get(new Employee("E001", "Alice", "Engineering"))
// → could return null! (different bucket due to hashCode mismatch)

// 4. Sizing HashMap for performance
// Bad: rehashes multiple times as it grows
Map<String, Integer> small = new HashMap<>(); // default capacity 16

// Good: pre-sized to avoid rehashing (expected 10,000 entries)
Map<String, Integer> sized = new HashMap<>(13_334); // 10000 / 0.75

// 5. ConcurrentHashMap — thread-safe, high-performance
import java.util.concurrent.ConcurrentHashMap;

ConcurrentHashMap<String, Integer> counters = new ConcurrentHashMap<>();

// Atomic operations — no explicit locking needed
counters.merge("pageViews", 1, Integer::sum);  // increment
counters.computeIfAbsent("cache:user:42", k -> loadFromDb(k));

// Safe concurrent iteration (weakly consistent)
counters.forEach(4, (key, count) -> {  // parallelism threshold = 4
    if (count > 1000) System.out.println(key + " is hot: " + count);
});

// Atomic compute
counters.compute("errors", (key, val) -> (val == null) ? 1 : val + 1);

// 6. LinkedHashMap for LRU Cache
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;

    public LRUCache(int maxSize) {
        super(maxSize, 0.75f, true); // accessOrder = true
        this.maxSize = maxSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize; // evict oldest when over capacity
    }
}
// var cache = new LRUCache<String, User>(100);
// Automatically evicts least-recently-accessed entries

// 7. IdentityHashMap — uses == instead of equals()
IdentityHashMap<String, Integer> idMap = new IdentityHashMap<>();
String a = new String("key");
String b = new String("key");
idMap.put(a, 1);
idMap.put(b, 2);
System.out.println(idMap.size()); // 2! (a != b by reference)

// 8. WeakHashMap — entries removed when keys are GC'd
WeakHashMap<Object, String> weakMap = new WeakHashMap<>();
// Great for caches where you don't want to prevent GC`,
    practice: "Create a custom Money class with amount (double) and currency (String). Implement equals/hashCode correctly. Then demonstrate: (1) Using Money as a HashMap key works correctly. (2) Show what breaks if hashCode is wrong. (3) Build a thread-safe MoneyCounter using ConcurrentHashMap that tracks total amounts per currency from multiple threads.",
    solution: `import java.util.*;
import java.util.concurrent.*;

public class Money {
    private final double amount;
    private final String currency;

    public Money(double amount, String currency) {
        this.amount = amount;
        this.currency = currency.toUpperCase();
    }

    public double amount() { return amount; }
    public String currency() { return currency; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;
        return Double.compare(m.amount, amount) == 0
            && Objects.equals(currency, m.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(Double.hashCode(amount), currency);
    }

    @Override
    public String toString() {
        return "%.2f %s".formatted(amount, currency);
    }
}

// Thread-safe money counter
class MoneyCounter {
    private final ConcurrentHashMap<String, Double> totals = new ConcurrentHashMap<>();

    public void add(Money money) {
        totals.merge(money.currency(), money.amount(), Double::sum);
    }

    public double getTotal(String currency) {
        return totals.getOrDefault(currency.toUpperCase(), 0.0);
    }

    public Map<String, Double> snapshot() {
        return Map.copyOf(totals);
    }
}

// Test:
// var counter = new MoneyCounter();
// Executors.newVirtualThreadPerTaskExecutor().invokeAll(
//     List.of(
//         () -> { counter.add(new Money(100, "USD")); return null; },
//         () -> { counter.add(new Money(200, "USD")); return null; },
//         () -> { counter.add(new Money(50, "EUR")); return null; }
//     )
// );
// counter.getTotal("USD") → 300.0`,
  },
  {
    time: "Hour 12",
    title: "Runnable vs Callable, Locks, Semaphores & Synchronizers",
    concept: [
      "**Runnable vs Callable:** `Runnable` is a task that returns nothing and cannot throw checked exceptions: `() -> doWork()`. `Callable<V>` returns a result and CAN throw checked exceptions: `() -> computeResult()`. Submit Callable to an ExecutorService to get a `Future<V>`: `Future<Integer> f = executor.submit(() -> 42); int val = f.get();`. Use Callable when you need a result; Runnable when you don't.",
      "**Future<V>** represents a pending result. Methods: `get()` blocks until done. `get(timeout, unit)` blocks with timeout. `isDone()` checks completion. `cancel(mayInterrupt)` attempts cancellation. Problem: `get()` is blocking — it defeats the purpose of async. Solution: use **CompletableFuture** for non-blocking chains, or use `invokeAll()` / `invokeAny()` for batch operations.",
      "**ReentrantLock** is an explicit lock that gives more control than `synchronized`: tryLock (non-blocking attempt), timed lock, interruptible lock, and fairness policy. Pattern: `lock.lock(); try { ... } finally { lock.unlock(); }`. ALWAYS unlock in finally — a missed unlock causes deadlock. Use `tryLock()` to avoid indefinite waiting: `if (lock.tryLock(1, TimeUnit.SECONDS)) { try {...} finally { lock.unlock(); } }`.",
      "**ReadWriteLock** allows multiple concurrent readers OR one exclusive writer. `ReadWriteLock rwl = new ReentrantReadWriteLock();`. Readers: `rwl.readLock().lock()` — many threads can read simultaneously. Writers: `rwl.writeLock().lock()` — blocks all readers and other writers. **StampedLock** (Java 8+) adds optimistic reads: `long stamp = lock.tryOptimisticRead();` — no blocking, but must validate after reading.",
      "**Synchronizers** from java.util.concurrent: (1) **CountDownLatch** — one-time barrier, wait for N events: `latch.countDown()`, `latch.await()`. (2) **CyclicBarrier** — reusable, N threads wait for each other: `barrier.await()`. (3) **Semaphore** — rate limiter, controls access to N resources: `sem.acquire()`, `sem.release()`. (4) **Phaser** — flexible, reusable, dynamic participant count.",
      "**ThreadLocal** gives each thread its own independent copy of a variable. Use for: per-thread context (user session, transaction ID), non-thread-safe objects (SimpleDateFormat), avoiding parameter passing through deep call stacks. Pattern: `private static final ThreadLocal<DateFormat> fmt = ThreadLocal.withInitial(() -> new SimpleDateFormat(\"yyyy-MM-dd\"));`. Clean up with `remove()` to prevent memory leaks in thread pools.",
    ],
    code: `import java.util.concurrent.*;
import java.util.concurrent.locks.*;
import java.util.*;

// === Runnable vs Callable ===

// 1. Runnable — no return value, no checked exceptions
Runnable task = () -> System.out.println("Running on: " + Thread.currentThread());

// Callable — returns a value, can throw exceptions
Callable<Integer> computation = () -> {
    Thread.sleep(1000);
    return 42;
};

try (var executor = Executors.newFixedThreadPool(4)) {
    // Submit Runnable
    executor.execute(task);          // fire-and-forget
    Future<?> f1 = executor.submit(task); // returns Future (no value)

    // Submit Callable — get result via Future
    Future<Integer> f2 = executor.submit(computation);
    System.out.println("Result: " + f2.get()); // blocks until done → 42

    // Batch operations
    List<Callable<String>> tasks = List.of(
        () -> fetchFromApi("service-a"),
        () -> fetchFromApi("service-b"),
        () -> fetchFromApi("service-c")
    );
    List<Future<String>> results = executor.invokeAll(tasks); // wait for ALL
    String fastest = executor.invokeAny(tasks);   // return FIRST completed
}

// 2. Future with timeout
Future<String> slow = executor.submit(() -> {
    Thread.sleep(10_000);
    return "done";
});
try {
    String result = slow.get(2, TimeUnit.SECONDS); // timeout after 2s
} catch (TimeoutException e) {
    slow.cancel(true); // cancel the task
    System.out.println("Task timed out, cancelled");
}

// === ReentrantLock ===

// 3. Explicit locking with try-finally
class BankAccount {
    private double balance;
    private final ReentrantLock lock = new ReentrantLock();

    public void transfer(BankAccount to, double amount) {
        // Acquire BOTH locks to prevent deadlock (ordered locking)
        BankAccount first = System.identityHashCode(this) <
            System.identityHashCode(to) ? this : to;
        BankAccount second = first == this ? to : this;

        first.lock.lock();
        try {
            second.lock.lock();
            try {
                if (this.balance >= amount) {
                    this.balance -= amount;
                    to.balance += amount;
                }
            } finally { second.lock.unlock(); }
        } finally { first.lock.unlock(); }
    }

    // Non-blocking tryLock
    public boolean tryWithdraw(double amount) {
        if (lock.tryLock()) {
            try {
                if (balance >= amount) { balance -= amount; return true; }
                return false;
            } finally { lock.unlock(); }
        }
        return false; // couldn't acquire lock
    }
}

// === ReadWriteLock ===

// 4. Many readers, one writer
class ThreadSafeCache<K, V> {
    private final Map<K, V> map = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();

    public V get(K key) {
        rwLock.readLock().lock();          // multiple threads can read
        try { return map.get(key); }
        finally { rwLock.readLock().unlock(); }
    }

    public void put(K key, V value) {
        rwLock.writeLock().lock();         // exclusive access
        try { map.put(key, value); }
        finally { rwLock.writeLock().unlock(); }
    }
}

// === Synchronizers ===

// 5. CountDownLatch — wait for N tasks to complete
CountDownLatch latch = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    executor.submit(() -> {
        doWork();
        latch.countDown(); // signal completion
    });
}
latch.await(); // blocks until count reaches 0
System.out.println("All 3 tasks done!");

// 6. Semaphore — rate limiter (max N concurrent)
Semaphore semaphore = new Semaphore(5); // max 5 concurrent DB connections
void queryDatabase(String sql) throws Exception {
    semaphore.acquire();   // blocks if 5 already active
    try {
        executeQuery(sql);
    } finally {
        semaphore.release(); // release permit
    }
}

// 7. ThreadLocal — per-thread state
private static final ThreadLocal<String> requestId =
    ThreadLocal.withInitial(() -> UUID.randomUUID().toString());

void handleRequest() {
    requestId.set("REQ-" + System.nanoTime());
    try {
        processStep1(); // can access requestId.get() anywhere in this thread
        processStep2();
    } finally {
        requestId.remove(); // CRITICAL: prevent memory leak in thread pools
    }
}`,
    practice: "Build a ConnectionPool class using Semaphore (max 5 connections), ReentrantLock for thread-safe state, and Callable tasks. The pool should: acquire() returns a Connection (blocks if pool is exhausted), release(connection) returns it, and getActiveCount() returns current usage. Test with 10 virtual threads competing for 5 connections.",
    solution: `import java.util.concurrent.*;
import java.util.concurrent.locks.*;
import java.util.*;

record Connection(String id) implements AutoCloseable {
    @Override public void close() { /* cleanup */ }
}

class ConnectionPool {
    private final Queue<Connection> available = new LinkedList<>();
    private final Set<Connection> inUse = new HashSet<>();
    private final Semaphore semaphore;
    private final ReentrantLock lock = new ReentrantLock();

    public ConnectionPool(int maxSize) {
        this.semaphore = new Semaphore(maxSize);
        for (int i = 0; i < maxSize; i++) {
            available.add(new Connection("conn-" + i));
        }
    }

    public Connection acquire() throws InterruptedException {
        semaphore.acquire(); // blocks if all connections in use
        lock.lock();
        try {
            Connection conn = available.poll();
            inUse.add(conn);
            return conn;
        } finally { lock.unlock(); }
    }

    public void release(Connection conn) {
        lock.lock();
        try {
            inUse.remove(conn);
            available.offer(conn);
        } finally { lock.unlock(); }
        semaphore.release();
    }

    public int getActiveCount() {
        lock.lock();
        try { return inUse.size(); }
        finally { lock.unlock(); }
    }
}

// Test: 10 threads, 5 connections
// try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
//     var pool = new ConnectionPool(5);
//     var tasks = IntStream.range(0, 10).mapToObj(i ->
//         (Callable<String>) () -> {
//             var conn = pool.acquire();
//             try {
//                 Thread.sleep(500);
//                 return "Task-" + i + " used " + conn.id();
//             } finally { pool.release(conn); }
//         }
//     ).toList();
//     exec.invokeAll(tasks).forEach(f -> System.out.println(f.get()));
// }`,
  },
  {
    time: "Hour 13",
    title: "Design Patterns — Singleton, Builder, Factory, Strategy & Observer",
    concept: [
      "**Design patterns** are proven solutions to common software design problems. Java's OOP nature makes it a natural fit. The Gang of Four (GoF) categorized them into: **Creational** (Singleton, Builder, Factory, Prototype), **Structural** (Adapter, Decorator, Proxy, Facade), and **Behavioral** (Strategy, Observer, Command, Iterator, Template Method).",
      "**Singleton** ensures only ONE instance of a class exists. Modern Java approach: use an **enum** — `enum Database { INSTANCE; }`. It's thread-safe, serialization-safe, and reflection-proof. The old double-checked locking pattern is error-prone and unnecessary. Spring beans are singletons by default via the IoC container, making this pattern mostly framework-managed now.",
      "**Builder** constructs complex objects step by step. Perfect when a constructor would have many parameters (telescoping constructor anti-pattern). Pattern: `User.builder().name(\"Alice\").email(\"a@b.com\").age(30).build()`. The builder validates invariants in `build()`. In real projects, use **Lombok's @Builder** or **Records** with a mutable builder companion class.",
      "**Factory Method** and **Abstract Factory** decouple object creation from usage. The client code calls `PaymentFactory.create(\"CREDIT_CARD\")` without knowing concrete classes. In Java, this often uses sealed interfaces + a static factory: `sealed interface Shape permits Circle, Rectangle { static Shape of(String type, double... args) { ... } }`. Spring's `@Bean` methods are factory methods.",
      "**Strategy** encapsulates interchangeable algorithms behind an interface. In modern Java, use lambdas: `Function<Order, Double> discountStrategy = order -> order.total() * 0.1;`. Pass different strategies without creating class hierarchies. `Comparator` is THE classic Strategy pattern example — `list.sort(Comparator.comparing(Person::age))`.",
      "**Observer** (pub-sub) notifies multiple subscribers when state changes. Java provides `Flow.Publisher/Subscriber` (Java 9+) for reactive streams. In practice, use event listeners, message queues (Kafka, RabbitMQ), or Spring's `@EventListener`. The **Decorator** pattern wraps objects to add behavior: Java I/O streams are the classic example — `new BufferedReader(new InputStreamReader(new FileInputStream(f)))`.",
    ],
    code: `// === Design Patterns in Modern Java ===

// 1. Singleton — the enum way (thread-safe, serialization-safe)
public enum AppConfig {
    INSTANCE;

    private final Map<String, String> properties = new HashMap<>();

    public void set(String key, String value) { properties.put(key, value); }
    public String get(String key) { return properties.get(key); }
}
// Usage: AppConfig.INSTANCE.get("db.url")

// 2. Builder Pattern — for complex object construction
public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final Duration timeout;

    private HttpRequest(Builder b) {
        this.method = b.method;
        this.url = b.url;
        this.headers = Map.copyOf(b.headers);
        this.body = b.body;
        this.timeout = b.timeout;
    }

    // Immutable getters
    public String method()  { return method; }
    public String url()     { return url; }

    public static Builder builder(String method, String url) {
        return new Builder(method, url);
    }

    public static class Builder {
        private final String method;
        private final String url;
        private final Map<String, String> headers = new HashMap<>();
        private String body;
        private Duration timeout = Duration.ofSeconds(30);

        private Builder(String method, String url) {
            this.method = Objects.requireNonNull(method);
            this.url = Objects.requireNonNull(url);
        }

        public Builder header(String k, String v) { headers.put(k, v); return this; }
        public Builder body(String body)    { this.body = body; return this; }
        public Builder timeout(Duration t)  { this.timeout = t; return this; }

        public HttpRequest build() {
            if (url.isBlank()) throw new IllegalStateException("URL required");
            return new HttpRequest(this);
        }
    }
}
// Usage:
// var req = HttpRequest.builder("POST", "/api/users")
//     .header("Content-Type", "application/json")
//     .body("{\\"name\\": \\"Alice\\"}")
//     .timeout(Duration.ofSeconds(5))
//     .build();

// 3. Factory Pattern — sealed interface + static factory
public sealed interface Notification permits EmailNotif, SmsNotif, PushNotif {
    String send(String recipient, String message);

    // Static factory method
    static Notification of(String channel) {
        return switch (channel.toLowerCase()) {
            case "email" -> new EmailNotif();
            case "sms"   -> new SmsNotif();
            case "push"  -> new PushNotif();
            default -> throw new IllegalArgumentException("Unknown: " + channel);
        };
    }
}
record EmailNotif() implements Notification {
    @Override public String send(String to, String msg) {
        return "Email sent to " + to;
    }
}
record SmsNotif() implements Notification {
    @Override public String send(String to, String msg) {
        return "SMS sent to " + to;
    }
}
record PushNotif() implements Notification {
    @Override public String send(String to, String msg) {
        return "Push sent to " + to;
    }
}

// 4. Strategy Pattern — using lambdas (no class hierarchy needed)
@FunctionalInterface
interface PricingStrategy {
    double calculate(double basePrice, int quantity);
}

class OrderCalculator {
    static final PricingStrategy REGULAR =
        (price, qty) -> price * qty;
    static final PricingStrategy BULK_DISCOUNT =
        (price, qty) -> price * qty * (qty > 100 ? 0.8 : qty > 50 ? 0.9 : 1.0);
    static final PricingStrategy MEMBER =
        (price, qty) -> price * qty * 0.85;

    public double calculate(double price, int qty, PricingStrategy strategy) {
        return strategy.calculate(price, qty);
    }
}
// calc.calculate(10.0, 200, OrderCalculator.BULK_DISCOUNT) → 1600.0

// 5. Observer (Event System)
class EventBus {
    private final Map<String, List<Consumer<Object>>> listeners = new HashMap<>();

    public void subscribe(String event, Consumer<Object> listener) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(listener);
    }

    public void publish(String event, Object data) {
        listeners.getOrDefault(event, List.of())
            .forEach(l -> l.accept(data));
    }
}
// var bus = new EventBus();
// bus.subscribe("user.created", data -> sendWelcomeEmail(data));
// bus.subscribe("user.created", data -> logAuditTrail(data));
// bus.publish("user.created", newUser);

// 6. Decorator Pattern — wrapping behavior
interface Logger {
    void log(String message);
}

class ConsoleLogger implements Logger {
    @Override public void log(String msg) { System.out.println(msg); }
}

class TimestampLogger implements Logger {
    private final Logger delegate;
    TimestampLogger(Logger delegate) { this.delegate = delegate; }
    @Override public void log(String msg) {
        delegate.log("[" + java.time.Instant.now() + "] " + msg);
    }
}

class JsonLogger implements Logger {
    private final Logger delegate;
    JsonLogger(Logger delegate) { this.delegate = delegate; }
    @Override public void log(String msg) {
        delegate.log("{\\"message\\": \\"" + msg + "\\"}");
    }
}
// var logger = new TimestampLogger(new JsonLogger(new ConsoleLogger()));
// logger.log("Hello") → [2024-12-15T10:00:00Z] {"message": "Hello"}`,
    practice: "Build a NotificationService using Factory + Strategy + Builder patterns: Create a NotificationBuilder that builds notifications (email, SMS, push) with optional fields (subject, priority, attachments). Add a DeliveryStrategy interface with implementations for immediate delivery, batched delivery (every N messages), and scheduled delivery. Use a factory to create the right strategy from configuration.",
    solution: `import java.util.*;
import java.time.*;
import java.util.function.*;

record Notification(
    String channel, String recipient, String message,
    String subject, int priority
) {
    static Builder builder(String channel, String recipient) {
        return new Builder(channel, recipient);
    }

    static class Builder {
        private final String channel, recipient;
        private String message = "", subject = "";
        private int priority = 3;

        Builder(String ch, String to) { channel = ch; recipient = to; }
        Builder message(String m)  { message = m; return this; }
        Builder subject(String s)  { subject = s; return this; }
        Builder priority(int p)    { priority = p; return this; }

        Notification build() {
            if (recipient.isBlank()) throw new IllegalStateException("Recipient required");
            return new Notification(channel, recipient, message, subject, priority);
        }
    }
}

interface DeliveryStrategy {
    void deliver(Notification n);

    static DeliveryStrategy immediate() {
        return n -> System.out.println("Sending NOW: " + n);
    }

    static DeliveryStrategy batched(int batchSize) {
        var buffer = new ArrayList<Notification>();
        return n -> {
            buffer.add(n);
            if (buffer.size() >= batchSize) {
                System.out.println("Flushing batch of " + buffer.size());
                buffer.clear();
            }
        };
    }

    static DeliveryStrategy of(String type) {
        return switch (type) {
            case "immediate" -> immediate();
            case "batched"   -> batched(10);
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}`,
  },
  {
    time: "Hour 14",
    title: "Memory Management, Garbage Collection & JVM Internals Deep Dive",
    concept: [
      "**JVM memory areas:** (1) **Heap** — all objects live here, managed by GC. Divided into **Young Generation** (Eden + Survivor spaces) and **Old Generation** (tenured). (2) **Stack** — one per thread, stores method frames, local variables, and partial results. Each method call creates a frame; return pops it. (3) **Metaspace** — stores class metadata (replaced PermGen in Java 8). (4) **Code Cache** — JIT-compiled native code.",
      "**Object lifecycle:** `new Object()` allocates in Eden (Young Gen). Minor GC collects Eden — survivors move to Survivor space. After several minor GCs, long-lived objects promote to Old Gen. Major GC (Full GC) collects Old Gen — this is expensive and causes 'stop-the-world' pauses. Objects without references are eligible for GC — Java uses reachability analysis (GC roots: local vars, static fields, threads).",
      "**Garbage collectors:** (1) **G1GC** (default Java 9-20) — divides heap into regions, prioritizes garbage-first. Good balance of throughput and latency. (2) **ZGC** (default Java 21+) — ultra-low latency (<1ms pauses), handles multi-TB heaps. (3) **Shenandoah** — similar to ZGC, Red Hat. (4) **Serial/Parallel** — for small heaps or batch jobs. Choose `-XX:+UseZGC` for microservices, `-XX:+UseG1GC` for general.",
      "**Memory leaks in Java** happen when objects remain referenced but unused. Common causes: (1) Static collections that grow forever. (2) Unclosed resources (streams, connections). (3) Inner class instances holding outer class references. (4) ThreadLocal not removed in thread pools. (5) Listeners/callbacks never unregistered. (6) String.intern() abuse. Use profilers (VisualVM, JFR) and heap dumps to find leaks.",
      "**JVM tuning flags:** `-Xms512m` (initial heap), `-Xmx2g` (max heap), `-XX:+UseZGC` (GC algorithm), `-XX:MaxGCPauseMillis=200` (G1 target), `-XX:+HeapDumpOnOutOfMemoryError` (critical for prod), `-XX:+PrintGCDetails` (GC logging), `-XX:MetaspaceSize=256m`. For containers: `-XX:+UseContainerSupport` (default on), `-XX:MaxRAMPercentage=75.0` (use 75% of container memory).",
      "**Strong, Soft, Weak, Phantom references:** (1) **Strong** — normal references, prevents GC. (2) **SoftReference** — cleared before OOM, ideal for caches. (3) **WeakReference** — cleared at next GC, used in WeakHashMap. (4) **PhantomReference** — cleared after finalization, for cleanup tracking. Use `SoftReference<byte[]>` for image caches that automatically shrink under memory pressure.",
    ],
    code: `// === JVM Memory & GC Deep Dive ===

// 1. Stack vs Heap — what goes where?
public class MemoryDemo {
    static int classVar = 10;    // Metaspace (class data)

    public void method() {
        int x = 42;              // Stack (primitive local var)
        String name = "Alice";   // Stack (reference) → Heap (String object)
        var list = new ArrayList<>(); // Stack (ref) → Heap (ArrayList object)
        // When method() returns, x and references are popped from stack
        // The objects on heap become eligible for GC if no other refs exist
    }
}

// 2. Object lifecycle visualization
// new User("Alice")
//    → Allocates in Eden (Young Gen)
//    → Survives minor GC → moves to Survivor (S0/S1)
//    → Survives ~15 minor GCs → promoted to Old Gen
//    → When unreachable → collected by Major GC

// 3. Memory leak example — static collection
class LeakyCache {
    // BAD: grows forever, never releases entries
    private static final Map<String, byte[]> cache = new HashMap<>();

    public static void store(String key, byte[] data) {
        cache.put(key, data); // entries never removed!
    }
}

// FIXED: use bounded cache
class BoundedCache {
    private static final int MAX = 1000;
    private static final Map<String, byte[]> cache = new LinkedHashMap<>(MAX, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, byte[]> e) {
            return size() > MAX;
        }
    };
}

// 4. SoftReference for memory-sensitive caches
import java.lang.ref.SoftReference;

class ImageCache {
    private final Map<String, SoftReference<byte[]>> cache = new HashMap<>();

    public void put(String key, byte[] image) {
        cache.put(key, new SoftReference<>(image));
    }

    public Optional<byte[]> get(String key) {
        var ref = cache.get(key);
        if (ref == null) return Optional.empty();
        byte[] data = ref.get(); // may be null if GC cleared it
        if (data == null) {
            cache.remove(key);   // clean up stale entry
            return Optional.empty();
        }
        return Optional.of(data);
    }
}

// 5. try-with-resources prevents resource leaks
// BAD: resource leak if exception occurs
// InputStream in = new FileInputStream("data.txt");
// byte[] data = in.readAllBytes();
// in.close(); // never reached if readAllBytes() throws!

// GOOD: guaranteed cleanup
try (var in = new FileInputStream("data.txt")) {
    byte[] data = in.readAllBytes();
} // in.close() called automatically

// 6. ThreadLocal leak prevention
class RequestContext {
    private static final ThreadLocal<Map<String, Object>> context =
        ThreadLocal.withInitial(HashMap::new);

    public static void set(String key, Object value) {
        context.get().put(key, value);
    }

    public static <T> T get(String key) {
        return (T) context.get().get(key);
    }

    // MUST call in finally block / servlet filter / Spring interceptor
    public static void clear() {
        context.remove(); // prevents leak when thread returns to pool
    }
}

// 7. JVM startup flags for production
// java -Xms1g -Xmx4g \\
//      -XX:+UseZGC \\
//      -XX:+HeapDumpOnOutOfMemoryError \\
//      -XX:HeapDumpPath=/var/dumps/ \\
//      -XX:+UseStringDeduplication \\
//      -XX:MaxRAMPercentage=75.0 \\
//      -jar myapp.jar

// For containers (Docker/K8s):
// java -XX:+UseContainerSupport \\
//      -XX:MaxRAMPercentage=75.0 \\
//      -XX:+UseZGC \\
//      -jar myapp.jar`,
    practice: "Implement a MemoryAwareCache<K,V> that: (1) Uses SoftReferences so the JVM can clear entries under memory pressure. (2) Has a configurable max size with LRU eviction. (3) Tracks cache hit/miss statistics with AtomicLong. (4) Has a cleanup() method that removes entries whose SoftReferences have been cleared.",
    solution: `import java.lang.ref.SoftReference;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

class MemoryAwareCache<K, V> {
    private final Map<K, SoftReference<V>> cache;
    private final int maxSize;
    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();

    public MemoryAwareCache(int maxSize) {
        this.maxSize = maxSize;
        this.cache = new LinkedHashMap<>(maxSize, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, SoftReference<V>> e) {
                return size() > maxSize;
            }
        };
    }

    public synchronized void put(K key, V value) {
        cache.put(key, new SoftReference<>(value));
    }

    public synchronized Optional<V> get(K key) {
        var ref = cache.get(key);
        if (ref == null) { misses.incrementAndGet(); return Optional.empty(); }
        V value = ref.get();
        if (value == null) {
            cache.remove(key);
            misses.incrementAndGet();
            return Optional.empty();
        }
        hits.incrementAndGet();
        return Optional.of(value);
    }

    public synchronized void cleanup() {
        cache.entrySet().removeIf(e -> e.getValue().get() == null);
    }

    public String stats() {
        long h = hits.get(), m = misses.get();
        double ratio = (h + m) > 0 ? (double) h / (h + m) * 100 : 0;
        return "Hits: %d, Misses: %d, Ratio: %.1f%%, Size: %d"
            .formatted(h, m, ratio, cache.size());
    }
}`,
  },
  {
    time: "Hour 15",
    title: "Comparable, Iterable, Reflection, String Internals & Interview Essentials",
    concept: [
      "**Comparable<T> vs Comparator<T>:** `Comparable` defines the **natural ordering** of a class — implement `compareTo()` inside the class itself: `record User(String name) implements Comparable<User> { public int compareTo(User o) { return name.compareTo(o.name); } }`. `Comparator` is an **external** ordering strategy — pass it to sort methods: `users.sort(Comparator.comparing(User::name).reversed())`. Use Comparable for one default order; Comparator for multiple custom orders.",
      "**Iterable<T> and Iterator<T>:** Any class implementing `Iterable<T>` can be used in for-each loops: `for (var item : myCollection)`. You must implement `iterator()` returning an `Iterator<T>` with `hasNext()` and `next()`. Custom iterables let you define how your data structure is traversed. `Spliterator` (Java 8+) adds parallel traversal support for Streams.",
      "**String internals:** Strings are backed by a `byte[]` (Java 9+ Compact Strings — Latin-1 for ASCII, UTF-16 otherwise). The **String pool** stores interned strings — `\"hello\"` literals are pooled, `new String(\"hello\")` is not. `String.intern()` forces pool lookup. String concatenation with `+` in loops creates many throwaway objects — use StringBuilder. `String.formatted()` (Java 15+) replaces `String.format()`.",
      "**Immutability deep dive:** Immutable objects cannot change state after creation. Benefits: thread-safe, safe as HashMap keys, cacheable, simpler to reason about. To make a class immutable: (1) Declare `final class`. (2) All fields `private final`. (3) No setters. (4) Deep-copy mutable fields in constructor AND getters. (5) Records are immutable by default. Java's String, wrapper types, and java.time classes are all immutable.",
      "**Reflection** (`java.lang.reflect`) lets you inspect and modify classes at runtime: `Class<?> cls = Class.forName(\"com.example.User\");`, `cls.getDeclaredFields()`, `cls.getDeclaredMethods()`. Invoke methods: `method.invoke(obj, args)`. Access private fields: `field.setAccessible(true)`. Reflection powers every major framework: Spring (DI), Hibernate (ORM), Jackson (JSON), JUnit (test discovery). Performance cost: 5-50x slower than direct calls.",
      "**Key interview concepts:** (1) `==` vs `equals()` — reference vs content. (2) String pool and immutability. (3) HashMap O(1) average → O(log n) worst case (tree bins). (4) `final` vs `finally` vs `finalize()` (deprecated). (5) Checked vs unchecked exceptions. (6) Fail-fast iterators (ConcurrentModificationException). (7) `transient` keyword — excludes field from serialization. (8) Diamond problem — solved by interfaces with default methods (compilation error if ambiguous).",
    ],
    code: `// === Comparable, Iterable, Reflection & String Internals ===

// 1. Comparable — natural ordering (inside the class)
public record Product(String name, double price)
    implements Comparable<Product> {

    @Override
    public int compareTo(Product other) {
        return Double.compare(this.price, other.price); // by price ascending
    }
}
// Collections.sort(products); // uses natural ordering (by price)

// 2. Comparator — external ordering (multiple strategies)
var byName = Comparator.comparing(Product::name);
var byPriceDesc = Comparator.comparingDouble(Product::price).reversed();
var byNameThenPrice = Comparator.comparing(Product::name)
    .thenComparingDouble(Product::price);

// Null-safe comparator
var nullSafe = Comparator.nullsLast(
    Comparator.comparing(Product::name)
);

List<Product> products = new ArrayList<>(List.of(
    new Product("Mouse", 29.99),
    new Product("Laptop", 999.99),
    new Product("Keyboard", 79.99)
));
products.sort(byPriceDesc); // [Laptop, Keyboard, Mouse]

// 3. Custom Iterable — make your class work in for-each
class NumberRange implements Iterable<Integer> {
    private final int start, end;

    NumberRange(int start, int end) { this.start = start; this.end = end; }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int current = start;

            @Override public boolean hasNext() { return current <= end; }
            @Override public Integer next() {
                if (!hasNext()) throw new java.util.NoSuchElementException();
                return current++;
            }
        };
    }
}
// for (int n : new NumberRange(1, 5)) { System.out.println(n); }
// Prints: 1, 2, 3, 4, 5

// 4. String Internals
String a = "hello";           // from String pool
String b = "hello";           // same pool reference
String c = new String("hello"); // new heap object
String d = c.intern();        // moves to pool → same as a

System.out.println(a == b);   // true  (same pool ref)
System.out.println(a == c);   // false (different objects)
System.out.println(a == d);   // true  (intern returns pool ref)
System.out.println(a.equals(c)); // true (content match)

// String performance: StringBuilder vs concatenation
// BAD — creates new String objects each iteration
String bad = "";
for (int i = 0; i < 10000; i++) bad += i; // O(n^2)

// GOOD — O(n)
var good = new StringBuilder();
for (int i = 0; i < 10000; i++) good.append(i);
String result = good.toString();

// Modern string formatting (Java 15+)
String formatted = "Hello %s, you have %d items".formatted("Alice", 5);

// 5. Immutable class — thread-safe, safe as Map key
public final class Address {
    private final String street;
    private final String city;
    private final List<String> tags; // mutable type!

    public Address(String street, String city, List<String> tags) {
        this.street = street;
        this.city = city;
        this.tags = List.copyOf(tags); // DEFENSIVE COPY — crucial!
    }

    public String street() { return street; }
    public String city()   { return city; }
    public List<String> tags() { return tags; } // already immutable
}

// 6. Reflection — inspect and invoke at runtime
Class<?> cls = String.class;
System.out.println("Methods: " + cls.getDeclaredMethods().length);

// Invoke a private method
var method = cls.getDeclaredMethod("value"); // private byte[] value
method.setAccessible(true);
byte[] internal = (byte[]) method.invoke("hello");

// Create instance dynamically
Class<?> userClass = Class.forName("com.example.User");
Constructor<?> ctor = userClass.getDeclaredConstructor(String.class, int.class);
Object user = ctor.newInstance("Alice", 30);

// Read annotations (how frameworks work)
for (var m : userClass.getDeclaredMethods()) {
    if (m.isAnnotationPresent(Deprecated.class)) {
        System.out.println("Deprecated: " + m.getName());
    }
}

// 7. Fail-fast iterator
var list = new ArrayList<>(List.of("a", "b", "c"));
// BAD: ConcurrentModificationException
// for (String s : list) { if (s.equals("b")) list.remove(s); }

// GOOD: use Iterator.remove()
var it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove();
}

// GOOD: use removeIf (Java 8+)
list.removeIf(s -> s.equals("b"));`,
    practice: "Build a SortedCollection<T extends Comparable<T>> that: (1) Implements Iterable<T> so you can use for-each. (2) Maintains elements in sorted order on insertion. (3) Supports custom Comparator via an overloaded constructor. (4) Has methods: add(T), remove(T), contains(T), size(), and toList(). Use binary search for efficient insertion.",
    solution: `import java.util.*;

public class SortedCollection<T extends Comparable<T>> implements Iterable<T> {
    private final List<T> elements = new ArrayList<>();
    private final Comparator<T> comparator;

    public SortedCollection() {
        this.comparator = Comparator.naturalOrder();
    }

    public SortedCollection(Comparator<T> comparator) {
        this.comparator = Objects.requireNonNull(comparator);
    }

    public void add(T element) {
        int idx = Collections.binarySearch(elements, element, comparator);
        if (idx < 0) idx = -(idx + 1); // insertion point
        elements.add(idx, element);
    }

    public boolean remove(T element) {
        int idx = Collections.binarySearch(elements, element, comparator);
        if (idx >= 0) { elements.remove(idx); return true; }
        return false;
    }

    public boolean contains(T element) {
        return Collections.binarySearch(elements, element, comparator) >= 0;
    }

    public int size() { return elements.size(); }

    public List<T> toList() { return List.copyOf(elements); }

    @Override
    public Iterator<T> iterator() {
        return Collections.unmodifiableList(elements).iterator();
    }

    @Override
    public String toString() { return elements.toString(); }
}

// Usage:
// var sc = new SortedCollection<Integer>();
// sc.add(5); sc.add(1); sc.add(3);
// for (int n : sc) System.out.println(n); // 1, 3, 5
//
// var byLen = new SortedCollection<String>(
//     Comparator.comparingInt(String::length));
// byLen.add("cat"); byLen.add("elephant"); byLen.add("hi");
// byLen.toList() → [hi, cat, elephant]`,
  },
];
