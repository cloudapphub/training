import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft } from "lucide-react";

const lessons = [
  {
    time: "Hour 1",
    title: "Data Structures Deep Dive",
    concept: [
      "Python gives you four workhorse containers, and picking the right one is the single biggest performance and readability win at the mid level. Each has a different trade-off between ordering, mutability, uniqueness, and lookup speed.",
      "**List** is an ordered, mutable sequence backed by a dynamic array. Indexing and appending to the end are O(1), but inserting or deleting from the middle is O(n) because elements shift. Use lists when order matters and you need to grow or modify the collection.",
      "**Tuple** is an ordered, immutable sequence. Because it can't change, it's hashable — meaning you can use tuples as dict keys or set members (lists cannot). Tuples are also slightly faster and use less memory than lists, so they're ideal for fixed records like coordinates or database rows.",
      "**Set** stores unique, unordered items using a hash table. Membership checks (`x in s`) and insertions are O(1) on average, versus O(n) for a list. Use sets whenever you need deduplication or fast 'does this exist?' lookups. Sets also support mathematical operations: union (`|`), intersection (`&`), and difference (`-`).",
      "**Dict** maps hashable keys to values, also backed by a hash table, so lookups, insertions, and deletions are O(1) on average. Since Python 3.7, dicts preserve insertion order. Dicts are the backbone of almost every Python program — think of them as tiny in-memory databases.",
      "**Rule of thumb:** need order + changes → list. Need a fixed record → tuple. Need uniqueness or fast membership → set. Need key-value lookup → dict.",
    ],
    code: `# List: ordered, mutable, allows duplicates
nums = [3, 1, 4, 1, 5, 9]
nums.sort()                 # in-place -> [1, 1, 3, 4, 5, 9]
unique = list(set(nums))    # dedupe via set

# Tuple: immutable, hashable
point = (10, 20)
x, y = point                # unpacking

# Set: O(1) membership + set math
a = {1, 2, 3}
b = {3, 4, 5}
print(a & b)                # {3}  intersection
print(a | b)                # {1,2,3,4,5}  union

# Dict: key -> value
ages = {"alice": 30, "bob": 25}
ages["carol"] = 28
for name, age in ages.items():
    print(name, age)`,
    practice:
      "Given words = ['apple','banana','apple','cherry','banana','apple'], build a dict of word -> count without using collections.Counter.",
    solution: `words = ['apple','banana','apple','cherry','banana','apple']
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts)  # {'apple': 3, 'banana': 2, 'cherry': 1}`,
  },
  {
    time: "Hour 2",
    title: "Comprehensions & Generators",
    concept: [
      "Comprehensions are Python's signature feature for transforming one collection into another in a single readable line. They replace the classic 'create empty list, loop, append' pattern with an expression that reads almost like English: 'give me x squared for each x in range, where x is even.'",
      "The four forms are **list comprehension** `[expr for x in iter if cond]`, **set comprehension** `{expr for x in iter}`, **dict comprehension** `{k: v for ... in ...}`, and **generator expression** `(expr for x in iter)`. The only syntactic difference is brackets vs braces vs parentheses, but the behavior differs significantly.",
      "**Generator expressions are lazy.** Unlike a list comprehension which builds the entire result in memory, a generator produces one item at a time, on demand. This is critical when processing large datasets — `sum(x*x for x in range(10**9))` uses constant memory, while the list-comprehension version would exhaust your RAM.",
      "**When to use which:** reach for a list comprehension when you need to index into the result, iterate multiple times, or the collection is small. Use a generator when you only need to iterate once, especially for large or infinite sequences, or when feeding data into reducers like `sum`, `max`, `any`, or `all`.",
      "**Readability warning:** comprehensions are beautiful up to about two clauses. Once you nest three `for` loops with filters, write a regular loop — your future self will thank you.",
    ],
    code: `# List comprehension
squares = [n*n for n in range(10) if n % 2 == 0]

# Dict comprehension
square_map = {n: n*n for n in range(5)}

# Set comprehension
vowels = {c for c in "hello world" if c in "aeiou"}

# Generator expression (lazy, memory-efficient)
big_sum = sum(n*n for n in range(1_000_000))

# Nested comprehension: flatten a matrix
matrix = [[1,2,3],[4,5,6],[7,8,9]]
flat = [x for row in matrix for x in row]

# Generator vs list memory footprint
import sys
lst = [x for x in range(10_000)]
gen = (x for x in range(10_000))
print(sys.getsizeof(lst), sys.getsizeof(gen))  # huge vs tiny`,
    practice:
      "Build a dict mapping each number 1-20 to 'even' or 'odd' using a single dict comprehension.",
    solution: `parity = {n: ('even' if n % 2 == 0 else 'odd') for n in range(1, 21)}
print(parity)`,
  },
  {
    time: "Hour 3",
    title: "Functions, *args, **kwargs, Lambdas",
    concept: [
      "In Python, functions are **first-class objects**: they can be assigned to variables, passed as arguments, returned from other functions, and stored in data structures. This is what makes decorators, callbacks, and functional patterns possible.",
      "**Positional vs keyword arguments:** when calling a function, positional arguments bind by order, keyword arguments bind by name. Keyword arguments make call sites self-documenting: `create_user('Alice', True, False)` is cryptic, but `create_user(name='Alice', admin=True, archived=False)` reads clearly.",
      "**`*args` collects extra positional arguments into a tuple**, and **`**kwargs` collects extra keyword arguments into a dict**. They let you write flexible wrapper functions that forward arguments to other functions without knowing their signatures — this is how most decorators work.",
      "**Default arguments are evaluated once, at function definition time**, not on every call. This causes a classic Python gotcha: if you use a mutable default like `def f(x, items=[])`, all calls share the *same* list. The fix is to use `None` as the sentinel and create a fresh list inside the function body.",
      "**Lambdas** are small anonymous functions limited to a single expression (no statements, no return keyword — the expression is the return value). They're most useful as throwaway arguments to `sorted`, `map`, `filter`, or `key=` parameters. If you find yourself wanting a multi-line lambda, write a real `def` instead.",
      "**Scope rules (LEGB):** Python resolves names in the order Local → Enclosing → Global → Built-in. Understanding this matters when you start writing closures and decorators.",
    ],
    code: `def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

def summarize(*args, **kwargs):
    print("positional:", args)
    print("keyword:", kwargs)

summarize(1, 2, 3, name="Alice", role="admin")

# Lambda + sorted with key
people = [("Alice", 30), ("Bob", 25), ("Carol", 35)]
by_age = sorted(people, key=lambda p: p[1])

# GOTCHA: mutable default argument
def bad(x, items=[]):      # DON'T do this
    items.append(x)
    return items
print(bad(1), bad(2))      # [1] [1, 2]  — shared!

def good(x, items=None):   # DO this
    if items is None:
        items = []
    items.append(x)
    return items`,
    practice:
      "Write a function `stats(*numbers)` that returns a dict with keys 'min', 'max', 'avg' for any number of positional arguments.",
    solution: `def stats(*numbers):
    if not numbers:
        return {'min': None, 'max': None, 'avg': None}
    return {
        'min': min(numbers),
        'max': max(numbers),
        'avg': sum(numbers) / len(numbers),
    }
print(stats(3, 7, 2, 8, 5))`,
  },
  {
    time: "Hour 4",
    title: "Classes, Dunder Methods, Dataclasses",
    concept: [
      "Classes in Python bundle **state (attributes)** and **behavior (methods)** into reusable blueprints for creating objects. Every method's first parameter is `self`, which refers to the instance the method was called on. `__init__` is the constructor — it runs once when you create an instance and sets up initial attributes.",
      "**Dunder methods** (double-underscore, also called 'magic methods') are how you hook your objects into Python's built-in syntax and functions. Defining `__repr__` controls what `print(obj)` shows, `__eq__` controls `==`, `__lt__` enables sorting, `__add__` makes `+` work, `__len__` enables `len(obj)`, and `__iter__` makes your object usable in for loops. This is called **operator overloading**, and it's how NumPy arrays, Pandas DataFrames, and pathlib.Path objects feel so natural to use.",
      "**Class vs instance attributes:** attributes defined inside `__init__` with `self.x = ...` are per-instance. Attributes defined directly in the class body are shared across all instances — useful for constants, but a subtle bug source if you assign a mutable object there.",
      "**Inheritance and composition:** a subclass inherits attributes and methods from its parent and can override them. Use `super().__init__(...)` to call the parent's constructor. That said, the modern Python advice is 'prefer composition over inheritance' — keep inheritance shallow and reach for helper objects first.",
      "**@dataclass** (from the `dataclasses` module) auto-generates `__init__`, `__repr__`, and `__eq__` from type-annotated class attributes, eliminating the boilerplate for classes that are mostly data containers. You can also set `frozen=True` to make instances immutable (and hashable). For mutable defaults like lists, use `field(default_factory=list)` — the same mutable-default gotcha from functions applies here.",
    ],
    code: `from dataclasses import dataclass, field

class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        return f"Vector({self.x}, {self.y})"
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)
    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)
    def __len__(self):
        return 2

v = Vector(1, 2) + Vector(3, 4)
print(v)            # Vector(4, 6)
print(len(v))       # 2

@dataclass
class Product:
    name: str
    price: float
    tags: list = field(default_factory=list)   # avoid mutable default

p = Product("Book", 12.99, ["education"])
print(p)   # Product(name='Book', price=12.99, tags=['education'])`,
    practice:
      "Create a dataclass `Rectangle` with width and height fields, and add a method `area()` that returns width * height.",
    solution: `from dataclasses import dataclass

@dataclass
class Rectangle:
    width: float
    height: float
    def area(self):
        return self.width * self.height

r = Rectangle(3, 4)
print(r.area())  # 12`,
  },
  {
    time: "Hour 5",
    title: "Errors, Exceptions & Context Managers",
    concept: [
      "Python uses **exceptions** for error handling instead of return codes. When something goes wrong, code raises an exception that propagates up the call stack until some `try`/`except` block catches it — or the program crashes with a traceback.",
      "The full form is `try` / `except` / `else` / `finally`. The `try` block contains risky code; `except` catches specific exception types; `else` runs only if no exception occurred (useful for code that should only run on success but shouldn't itself be protected); `finally` always runs, even on exceptions or early returns, making it perfect for cleanup.",
      "**Always catch specific exceptions**, never bare `except:` or `except Exception:` unless you have a very good reason. Bare excepts swallow bugs, interrupts (Ctrl+C), and system exits, making problems nearly impossible to debug. Catch `ValueError`, `KeyError`, `FileNotFoundError`, etc. — whatever you actually expect.",
      "**EAFP vs LBYL:** Python culture prefers **'Easier to Ask Forgiveness than Permission'** (just try the operation and catch the exception) over **'Look Before You Leap'** (check conditions first). EAFP is often faster and avoids race conditions, especially with file systems.",
      "**Context managers** (the `with` statement) guarantee that setup/teardown code runs in pairs, even if an exception is raised in between. The classic example is `with open(...) as f:` which guarantees the file is closed. Under the hood, a context manager is any object implementing `__enter__` and `__exit__`. The easiest way to build your own is the `@contextmanager` decorator from `contextlib`, which lets you use a generator: everything before `yield` is setup, everything after is teardown.",
      "**Custom exceptions:** define your own by subclassing `Exception`. This lets callers catch domain-specific errors precisely (`except PaymentFailedError`) without accidentally catching unrelated ones.",
    ],
    code: `from contextlib import contextmanager

def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError as e:
        print(f"Error: {e}")
        return None
    except TypeError:
        print("Arguments must be numbers")
        return None
    else:
        print("Success")      # only runs if no exception
        return result
    finally:
        print("Cleanup")      # always runs

# File handling with context manager
with open("data.txt", "w") as f:
    f.write("hello")
# file auto-closed here, even on error

# Custom context manager via generator
@contextmanager
def timer(label):
    import time
    start = time.time()
    yield                                  # user code runs here
    print(f"{label}: {time.time()-start:.3f}s")

with timer("work"):
    sum(range(1_000_000))

# Custom exception
class PaymentError(Exception):
    pass`,
    practice:
      "Write a function `safe_int(s)` that returns int(s) if possible, otherwise returns None — without crashing.",
    solution: `def safe_int(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        return None

print(safe_int("42"))    # 42
print(safe_int("abc"))   # None
print(safe_int(None))    # None`,
  },
  {
    time: "Hour 6",
    title: "Decorators & Closures",
    concept: [
      "A **closure** is a function that 'closes over' variables from the scope it was defined in, even after that outer scope has finished executing. In practical terms: if you define a function inside another function and return it, the inner function keeps access to the outer function's local variables. This is how stateful helpers and factory functions work in Python.",
      "If you need to *reassign* (not just read) an enclosing variable from inside an inner function, use the `nonlocal` keyword. Without it, Python treats the assignment as creating a new local variable and the closure breaks.",
      "A **decorator** is just a function that takes another function as input and returns a new (usually wrapped) function. The `@decorator` syntax above a `def` is syntactic sugar for `func = decorator(func)`. Decorators are the idiomatic Python way to add cross-cutting concerns — logging, timing, caching, authentication, retry logic, input validation — without cluttering the original function's body.",
      "The standard pattern is: define an outer function that accepts `func`, define an inner `wrapper(*args, **kwargs)` that does the extra work and calls `func(*args, **kwargs)`, then return `wrapper`. Use `*args, **kwargs` so your decorator works on any function signature.",
      "**Always use `@functools.wraps(func)` on the wrapper.** Without it, the decorated function's `__name__`, `__doc__`, and other metadata get replaced with `wrapper`'s, which breaks introspection, debuggers, and documentation tools.",
      "**Built-in decorators worth knowing:** `@staticmethod` and `@classmethod` on class methods, `@property` to turn a method into an attribute-like accessor, and `@functools.lru_cache` to memoize a function's results automatically — often the fastest optimization you can make to a recursive function.",
    ],
    code: `from functools import wraps
import time

def timed(func):
    @wraps(func)                          # preserve func.__name__, __doc__
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.4f}s")
        return result
    return wrapper

@timed
def slow_add(a, b):
    """Add two numbers, slowly."""
    time.sleep(0.1)
    return a + b

slow_add(2, 3)
print(slow_add.__name__)   # 'slow_add', not 'wrapper'

# Closure: counter factory
def make_counter():
    count = 0
    def inc():
        nonlocal count     # required to reassign outer variable
        count += 1
        return count
    return inc

c = make_counter()
print(c(), c(), c())       # 1 2 3

# Built-in: memoization for free
from functools import lru_cache
@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)`,
    practice:
      "Write a decorator `@retry` that re-runs a function up to 3 times if it raises an exception, then re-raises on the final failure.",
    solution: `from functools import wraps

def retry(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        last = None
        for attempt in range(3):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last = e
                print(f"attempt {attempt+1} failed: {e}")
        raise last
    return wrapper

@retry
def flaky():
    import random
    if random.random() < 0.7:
        raise ValueError("oops")
    return "ok"`,
  },
  {
    time: "Hour 7",
    title: "Iterators, Generators & itertools",
    concept: [
      "An **iterable** is any object you can loop over with `for` — lists, tuples, strings, dicts, files, and custom classes with `__iter__`. Calling `iter()` on an iterable produces an **iterator**, which is an object with a `__next__()` method that returns one item at a time and raises `StopIteration` when exhausted. The `for` loop is just sugar for this protocol.",
      "**Generators** are the easiest way to build custom iterators. Any function containing `yield` automatically becomes a generator function — calling it doesn't run the body; it returns a generator object. Each call to `next()` runs the function up to the next `yield`, produces that value, and freezes execution. On the next call, it resumes exactly where it left off with all local variables intact. This is how you can write infinite sequences like `fibonacci()` without blowing up memory.",
      "**Generators are lazy and stateful.** They produce values on demand, use constant memory regardless of sequence length, and can only be iterated *once* — after that, they're exhausted. If you need to iterate multiple times, materialize with `list(gen)` or re-create the generator.",
      "The **`itertools`** module is a toolbox of fast, memory-efficient iterator building blocks written in C. The essentials: `chain(a, b, c)` concatenates iterables; `islice(it, start, stop)` slices without loading everything; `combinations(iterable, r)` and `permutations(iterable, r)` for combinatorics; `groupby(iterable, key=...)` groups consecutive equal items (requires sorted input!); `product(a, b)` for Cartesian products; `count()`, `cycle()`, `repeat()` for infinite generators.",
      "**Why this matters:** once you internalize iterators, you stop thinking in terms of 'build a giant list, then process it' and start thinking in terms of 'stream items through a pipeline'. This is more memory-efficient, composable, and often faster.",
    ],
    code: `def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fibonacci()
first_10 = [next(gen) for _ in range(10)]
print(first_10)

# itertools essentials
from itertools import chain, islice, combinations, groupby, product

combined = list(chain([1,2], [3,4], [5]))           # [1,2,3,4,5]
first_5_fib = list(islice(fibonacci(), 5))          # [0,1,1,2,3]
pairs = list(combinations([1,2,3,4], 2))            # [(1,2),(1,3)...]
grid = list(product([1,2], ['a','b']))              # [(1,'a'),(1,'b'),...]

# groupby requires sorted input
data = [("fruit","apple"),("fruit","pear"),("veg","kale")]
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))

# Generators are single-use!
g = (x*x for x in range(3))
print(list(g))    # [0, 1, 4]
print(list(g))    # []  — exhausted`,
    practice:
      "Write a generator `take_every(iterable, n)` that yields every nth item from the iterable.",
    solution: `def take_every(iterable, n):
    for i, item in enumerate(iterable):
        if i % n == 0:
            yield item

print(list(take_every(range(20), 3)))
# [0, 3, 6, 9, 12, 15, 18]`,
  },
  {
    time: "Hour 8",
    title: "Modules, Virtual Envs & Putting It Together",
    concept: [
      "A **module** is just a `.py` file. Any Python file can be imported by another using `import filename` (without the .py). Everything defined at the top level — functions, classes, constants — becomes an attribute of the imported module. A **package** is a folder containing multiple modules and (traditionally) an `__init__.py` file that marks it as importable.",
      "**Import styles:** `import math` (access as `math.sqrt`), `from math import sqrt` (access as `sqrt`), `from math import *` (dump everything — avoid this, it pollutes your namespace and obscures where names come from). Prefer explicit imports for clarity.",
      "The **`if __name__ == '__main__':`** idiom is one of Python's most distinctive patterns. When you run a file directly, Python sets its `__name__` variable to `'__main__'`. When the same file is imported as a module, `__name__` is set to the module's name. This guard lets a file do double duty: importable library *and* runnable script. Put test code, CLI entry points, and demos inside the guard so they don't execute on import.",
      "**Virtual environments** are isolated Python installations, one per project. They prevent dependency conflicts: project A can use `requests 2.28` while project B uses `requests 2.31` without interfering. Create one with `python -m venv .venv`, activate it (`source .venv/bin/activate` on macOS/Linux, `.venv\\Scripts\\activate` on Windows), and any `pip install` only affects that environment. **Always use a virtualenv** — never `pip install` into your system Python.",
      "**Dependency management:** `pip freeze > requirements.txt` captures your current dependencies with exact versions, and `pip install -r requirements.txt` recreates them elsewhere. Modern projects use `pyproject.toml` (PEP 621) instead, often managed by tools like `poetry`, `uv`, or `hatch`.",
      "**Project layout:** for anything beyond a single file, organize code into a package folder, keep tests alongside in a `tests/` directory, put entry-point scripts in a `scripts/` or `bin/` folder, and document dependencies in `requirements.txt` or `pyproject.toml`. Good structure scales; bad structure becomes painful fast.",
    ],
    code: `# file: math_utils.py
def mean(nums):
    return sum(nums) / len(nums)

def variance(nums):
    m = mean(nums)
    return sum((n - m) ** 2 for n in nums) / len(nums)

if __name__ == "__main__":
    # only runs when executed directly, not on import
    sample = [2, 4, 4, 4, 5, 5, 7, 9]
    print("mean:", mean(sample))
    print("variance:", variance(sample))

# file: main.py
# from math_utils import mean, variance

# Terminal workflow:
#   python -m venv .venv
#   source .venv/bin/activate    (Windows: .venv\\Scripts\\activate)
#   pip install requests
#   pip freeze > requirements.txt
#   python main.py
#   deactivate                   (exit the venv)`,
    practice:
      "Build a mini project: a function `word_frequency(text)` that returns the top 3 most common words. Use collections.Counter. Add the `if __name__ == '__main__':` guard to test it.",
    solution: `from collections import Counter
import re

def word_frequency(text):
    words = re.findall(r"\\w+", text.lower())
    return Counter(words).most_common(3)

if __name__ == "__main__":
    sample = "the quick brown fox jumps over the lazy dog the fox is quick"
    print(word_frequency(sample))
    # [('the', 3), ('quick', 2), ('fox', 2)]`,
  },
  {
    time: "Homework Project",
    title: "Build & Deploy a Task Manager REST API",
    concept: [
      "**Project Goal:** You will build a production-ready REST API for managing tasks. It will use local SQLite for development, and deploy to AWS ECS Fargate with a managed PostgreSQL RDS database. This covers the entire lifecycle: coding the API, containerizing it, provisioning infrastructure via Terraform, and deploying.",
      "**Step 1 — Create a Virtual Environment & Install Dependencies.** Open your terminal: `mkdir task-api && cd task-api`. Run `python -m venv .venv` and activate it. Create a `requirements.txt` file containing `Flask`, `Flask-SQLAlchemy`, `psycopg2-binary`, and `gunicorn`. Run `pip install -r requirements.txt`. This isolates your project dependencies.",
      "**Step 2 — Design the Database Model.** Create `app.py`. Initialize Flask and SQLAlchemy. Define a `Task` class inheriting from `db.Model`. It should have fields: `id` (Integer, primary key), `title` (String, max 200, nullable=False), `description` (Text), `status` (String, default='todo'), `priority` (String, default='medium'), and `created_at` (DateTime, defaulting to `datetime.utcnow`).",
      "**Step 3 — Implement the CRUD Endpoints.** Write routes for your API. `@app.route('/tasks', methods=['POST'])` extracts JSON from the request and inserts a new Task. `/tasks` via `GET` fetches all tasks. `/tasks/<id>` via `GET` fetches one. `/tasks/<id>` via `PUT` updates it. `/tasks/<id>` via `DELETE` removes it. Use Flask's `jsonify` to return dictionaries.",
      "**Step 4 — Add Filtering and Pagination (The 'Mid-Level' Touch).** Make your `GET /tasks` endpoint robust. Check `request.args` for query parameters. If `/tasks?status=in_progress` is called, filter the SQLAlchemy query (`Task.query.filter_by(status=status)`). Do the same for `priority`. Add a `.order_by(Task.created_at.desc())` so the newest tasks appear first.",
      "**Step 5 — Test Locally with SQLite.** At the bottom of `app.py`, add `with app.app_context(): db.create_all()`. Run the app locally with `python app.py`. Use Postman or `curl` to create a few tasks: `curl -X POST localhost:5000/tasks -H \"Content-Type: application/json\" -d '{\"title\": \"Learn AWS ECS\"}'`. Then fetch them via GET to verify it works.",
      "**Step 6 — Write a Production Dockerfile.** We shouldn't run the built-in Flask server in production. Create a `Dockerfile`: base it on `python:3.12-slim`. Copy `requirements.txt` and install dependencies. Copy the rest of the code. Expose port 5000. Set the command to: `CMD [\"gunicorn\", \"-w\", \"4\", \"-b\", \"0.0.0.0:5000\", \"app:app\"]`. This runs Gunicorn with 4 worker processes.",
      "**Step 7 — Provision AWS Infrastructure via Terraform.** Create a `terraform/` directory. Write scripts to provision a VPC, subnets, internet gateway. Create an RDS PostgreSQL database. Create an ECS Cluster. Define a Task Definition pointing to the ECR image URL. Define an ECS Service running on Fargate. Put an Application Load Balancer (ALB) in front to route port 80 traffic to your container instances.",
      "**Step 8 — Build, Push, and Deploy.** In your AWS account, create an ECR repository. Run `docker build -t task-api .`. Tag it and push it to ECR. In your `app.py`, ensure your `SQLALCHEMY_DATABASE_URI` is reading from an environment variable (provided by Terraform to your ECS container). Apply the Terraform. Hit the ALB DNS name to test your live, highly-available API!",
    ],
    code: `# === app.py ===
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="todo")
    priority = db.Column(db.String(10), default="medium")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.json
    task = Task(title=data["title"], description=data.get("description", ""),
                priority=data.get("priority", "medium"))
    db.session.add(task)
    db.session.commit()
    return jsonify({"id": task.id, "title": task.title}), 201

@app.route("/tasks", methods=["GET"])
def list_tasks():
    query = Task.query
    if status := request.args.get("status"):
        query = query.filter_by(status=status)
    if priority := request.args.get("priority"):
        query = query.filter_by(priority=priority)
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([{"id": t.id, "title": t.title, "status": t.status,
                     "priority": t.priority} for t in tasks])

@app.route("/tasks/<int:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get_or_404(id)
    data = request.json
    task.title = data.get("title", task.title)
    task.status = data.get("status", task.status)
    db.session.commit()
    return jsonify({"id": task.id, "title": task.title, "status": task.status})

@app.route("/tasks/<int:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return "", 204

@app.route("/health")
def health():
    return {"status": "healthy"}

with app.app_context():
    db.create_all()

# === Dockerfile ===
# FROM python:3.12-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# EXPOSE 5000
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]

# === Deploy ===
# docker build -t task-api .
# docker tag task-api:latest <ECR_URL>/task-api:v1
# docker push <ECR_URL>/task-api:v1
# terraform apply  (provisions ECS Fargate + ALB + RDS)`,
    practice: "Build the full Task Manager API: implement all CRUD endpoints, add filtering by status and priority, write a Dockerfile, and deploy to AWS ECS Fargate with an ALB. Test all endpoints via curl.",
    solution: `# Deployment checklist:
# 1. pip install flask flask-sqlalchemy gunicorn pytest
# 2. Write app.py with all endpoints
# 3. Test: python app.py && curl localhost:5000/tasks
# 4. curl -X POST localhost:5000/tasks -H "Content-Type: application/json" -d '{"title":"Learn Python"}'
# 5. docker build -t task-api . && docker run -p 5000:5000 task-api
# 6. Create ECR repo & push image
# 7. terraform apply (VPC + ECS Fargate + ALB + RDS PostgreSQL)
# 8. curl https://ALB_DNS/health
# 9. curl -X POST https://ALB_DNS/tasks -d '{"title":"Deploy to AWS"}'
# 10. curl https://ALB_DNS/tasks?status=todo&priority=high`,
  },
];

// Render concept paragraphs with **bold** and `code` support
function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
    // split by bold and inline code markers
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

export default function PythonOneDay() {
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
            <h1 className="text-2xl sm:text-3xl font-bold">Python in One Day — Mid-Level</h1>
          </div>
          <p className="text-slate-400 text-sm">
            8 focused hours. Read the concept, study the code, then try the practice problem.
          </p>
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>
              Lesson {idx + 1} of {lessons.length}
            </span>
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
                onClick={() => {
                  setIdx(i);
                  setShowSolution(false);
                }}
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
