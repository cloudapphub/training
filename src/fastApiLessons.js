export const fastApiLessons = [
  {
    time: "Hour 1",
    title: "Core Concepts: Routing, Request Validation & Pydantic",
    concept: [
      "**FastAPI** is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. It is built on top of **Starlette** (for the web/ASGI layer) and **Pydantic** (for data validation). In benchmarks, FastAPI rivals Node.js and Go frameworks due to its async-first architecture and zero-overhead type system.",
      "**Routing:** Define endpoints using decorators like `@app.get('/')` or `@app.post('/items')`. Path parameters are declared in the path string and typed in the function signature: `@app.get('/items/{item_id}')`. Query parameters are function arguments NOT in the path. FastAPI auto-converts types: `item_id: int` will return a 422 if the client sends a string.",
      "**Pydantic V2:** The engine behind FastAPI's data validation, now rewritten in Rust for 5-50x speed. Models inherit from `BaseModel`. Use `Field(...)` for constraints: `Field(min_length=2, max_length=50, gt=0)`. Pydantic V2 adds `model_validator(mode='before')` for cross-field validation and `computed_field` for derived properties like `full_name` from `first` + `last`.",
      "**Nested Models:** Pydantic supports deeply nested validation. Define `class Address(BaseModel)` and embed it: `address: Address`. FastAPI validates the entire tree recursively. Use `list[Item]` for arrays of models. This replaces manual JSON parsing entirely.",
      "**Response Models:** Use `response_model=UserResponse` on your decorator to filter the output. This prevents leaking sensitive fields (like passwords). Pydantic serializes only the fields defined in the response model, even if the internal object has more attributes.",
      "**Status Codes & HTTPException:** Return proper HTTP status codes: `status_code=201` for creation, `204` for deletion. Raise `HTTPException(status_code=404, detail='Not found')` to return error responses. FastAPI catches these and formats them as JSON automatically.",
      "**Auto Docs:** Documentation is generated dynamically at `/docs` (Swagger UI) and `/redoc` (ReDoc) from your function signatures and Pydantic models. Every Field description, example, and constraint appears in the docs. Use `openapi_extra` and `summary` parameters for additional customization.",
      "**Enum Validation:** Use Python `Enum` classes as parameter types to restrict values: `class Status(str, Enum): active = 'active'; inactive = 'inactive'`. FastAPI generates a dropdown in Swagger UI and rejects invalid values with a 422.",
    ],
    code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Enterprise API")

# 1. Pydantic Model for Request Body
class ItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: str | None = None
    price: float = Field(..., gt=0, description="Price must be greater than zero")
    tax: float | None = None

# DB Mock
fake_db = {}

# 2. Path Parameter and Response Model
@app.get("/items/{item_id}", response_model=ItemCreate)
async def read_item(item_id: int):
    if item_id not in fake_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return fake_db[item_id]

# 3. Request Body, Path Params, and Query Params Combined
@app.post("/items/{item_id}", status_code=201)
async def create_item(
    item_id: int,           # Path Param
    item: ItemCreate,       # Request Body
    q: str | None = None    # Query Param
):
    if item_id in fake_db:
        raise HTTPException(status_code=400, detail="Item ID already exists")
    
    # Validation guaranteed: price > 0, name length [2, 50]
    total_price = item.price + (item.tax or 0.0)
    fake_db[item_id] = item.model_dump()
    
    return {"id": item_id, "data": item, "total_price": total_price, "query": q}`,
    practice: "Create a User registration endpoint. Define a `UserCreate` Pydantic model with `username`, `email` (must be a valid email regex or EmailStr), and `password` (min 8 characters). Create a `POST /users` endpoint that accepts the model and returns a success dictionary without printing the password.",
    solution: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, Field

app = FastAPI()

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    username: str
    email: EmailStr
    message: str

@app.post("/users", response_model=UserResponse)
async def register_user(user: UserCreate):
    # In a real app, check if user exists in DB and hash the password
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="Username taken")
        
    # Return everything EXCEPT the password
    return UserResponse(
        username=user.username,
        email=user.email,
        message="User registered successfully"
    )`
  },
  {
    time: "Hour 2",
    title: "Dependency Injection System",
    concept: [
      "**Dependency Injection (DI):** A design pattern where components receive their dependencies from outside rather than creating them internally. FastAPI has a native DI system built right into its routing mechanism via `Depends()`. It is one of the framework's most powerful features and replaces the need for external DI containers.",
      "**How it works:** A dependency is any callable (function or class). Declare it in your route signature: `def endpoint(db: Session = Depends(get_db))`. FastAPI calls `get_db()`, injects the result into `db`, and then executes the endpoint. The dependency runs before every request and is isolated per-request by default.",
      "**Yield Dependencies (Lifecycle Management):** Use `yield` instead of `return` inside a dependency to run cleanup code after the response is sent. Pattern: `async def get_db(): db = SessionLocal(); try: yield db; finally: db.close()`. The `finally` block runs even if the endpoint throws an exception, guaranteeing resource cleanup.",
      "**Hierarchical Dependencies:** Dependencies can depend on other dependencies, forming a tree. FastAPI resolves the entire graph automatically, caching results within a single request (so if two deps both need `get_db`, it is called only once). Control this with `use_cache=True/False`.",
      "**Class-Based Dependencies:** Instead of functions, use classes with `__init__` parameters: `class Pagination: def __init__(self, skip: int = 0, limit: int = 10): ...`. FastAPI instantiates the class per-request, making it clean for complex parameter groups.",
      "**Global Dependencies:** Apply dependencies to ALL routes via `app = FastAPI(dependencies=[Depends(verify_api_key)])`. Every endpoint will require the API key without repeating `Depends()` on each route. Combine with router-level deps for layered security.",
      "**Common Use Cases:** (1) Yielding Database sessions with rollback on error. (2) JWT token validation returning the current user. (3) Role-based access control (`Depends(require_role('admin'))`). (4) Shared logic like pagination, sorting, and filtering parameters.",
    ],
    code: `from fastapi import FastAPI, Depends, Header, HTTPException
from typing import Annotated

app = FastAPI()

# 1. Dependency: Authentication check
async def verify_token(x_api_token: str = Header(...)):
    if x_api_token != "supersecret":
        raise HTTPException(status_code=401, detail="Invalid API Token")
    return {"user_id": 42, "role": "admin"}

# 2. Dependency: Database Session Yielding
# In a real app this connects to a DB. "yield" ensures teardown.
async def get_db_session():
    print("Opening DB connection")
    db = "DB_SESSION_OBJECT"
    try:
        yield db
    finally:
        print("Closing DB connection")

# 3. Endpoint using Dependencies
# Use Annotated (Python 3.9+) to keep type hints clean
SessionDep = Annotated[str, Depends(get_db_session)]
UserDep = Annotated[dict, Depends(verify_token)]

@app.get("/secure-data")
async def read_secure_data(user: UserDep, db: SessionDep):
    # If the token was invalid, verify_token would raise a 401 before we reach here.
    return {
        "message": "Secure data accessed",
        "user": user,
        "db_status": f"Connected using {db}"
    }`,
    practice: "Build a pagination dependency `def pagination_params(skip: int = 0, limit: int = 10)` that ensures limit <= 100. Apply it to an endpoint `@app.get('/products')` using `Depends()`.",
    solution: `from fastapi import FastAPI, Depends, HTTPException
from typing import Annotated

app = FastAPI()

# Dependency function
def pagination_params(skip: int = 0, limit: int = 10):
    if limit > 100:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 100")
    if limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be > 0")
    return {"skip": skip, "limit": limit}

# Cleaner Dependency Type
PaginationDep = Annotated[dict, Depends(pagination_params)]

@app.get("/products")
async def get_products(pagination: PaginationDep):
    # Simulated query logic
    return {
        "status": "success",
        "data_skipped": pagination["skip"],
        "data_returned": pagination["limit"]
    }`
  },
  {
    time: "Hour 3",
    title: "Performance: Async/Await & Uvicorn Architecture",
    concept: [
      "**Async/Await Fundamentals:** FastAPI uses the ASGI (Asynchronous Server Gateway Interface) standard powered by Python's `asyncio` event loop. An `async def` endpoint allows the single-threaded Python process to handle thousands of concurrent requests by yielding execution during I/O waits (DB, HTTP, file) and processing other requests in the meantime.",
      "**The Golden Rule of Async:** NEVER run blocking synchronous code (like `time.sleep()`, `requests.get()`, heavy CPU loops) inside an `async def` endpoint. It freezes the entire event loop and no other request can be served. Use `def` (not `async def`) for blocking code -- FastAPI automatically runs sync endpoints in an external ThreadPool, protecting the event loop.",
      "**asyncio.gather for Parallel I/O:** When an endpoint needs data from multiple sources (e.g., user profile + order history + recommendations), use `results = await asyncio.gather(fetch_user(), fetch_orders(), fetch_recs())` to run all three concurrently. This turns 3 sequential 200ms calls into a single 200ms wall-clock wait.",
      "**run_in_executor for CPU-Bound Work:** If you must run CPU-heavy code (image processing, PDF generation, ML inference), use `loop.run_in_executor(None, cpu_heavy_fn)` to offload it to a thread/process pool without blocking the event loop. For truly heavy workloads, use a separate Celery worker.",
      "**Uvicorn & Workers:** Uvicorn is the ASGI server that translates HTTP into ASGI calls. A single Uvicorn process uses only 1 CPU core. To utilize multi-core servers, run Gunicorn managing multiple Uvicorn workers: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`. Each worker has its own event loop.",
      "**Connection Limits & Backpressure:** Async code fires requests extremely fast. If 500 async requests all hit your database concurrently, you will exhaust the DB connection limit instantly. You MUST use connection pooling (`pool_size=20, max_overflow=10`) and consider external poolers like PgBouncer for PostgreSQL.",
      "**httpx vs requests:** The `requests` library is synchronous and blocks the event loop. Use `httpx.AsyncClient` for non-blocking HTTP calls: `async with httpx.AsyncClient() as client: resp = await client.get(url)`. Always use `async with` to properly manage connection pools.",
    ],
    code: `import asyncio
import time
from fastapi import FastAPI

app = FastAPI()

# ❌ BAD: Blocking code inside async def
@app.get("/sync-blocker")
async def bad_endpoint():
    # This blocks the entire event loop for 5 seconds.
    # NO OTHER REQUESTS CAN BE PROCESSED BY THIS WORKER.
    time.sleep(5) 
    return {"message": "Done blocking. Sorry everybody else!"}

# ✅ GOOD: Non-blocking async code
@app.get("/async-fast")
async def good_endpoint():
    # asyncio.sleep yields control to the event loop.
    # Other requests can be processed concurrently while we wait!
    await asyncio.sleep(5)
    return {"message": "Done waiting. Oher requests were served!"}

# ✅ GOOD: Blocking code inside sync def
@app.get("/sync-safe")
def safe_sync_endpoint():
    # FastAPI detects 'def' instead of 'async def' and runs this 
    # inside an external ThreadPool, protecting the main event loop.
    time.sleep(5)
    return {"message": "Executed safely in a threadpool."}

# Production Run Command (Gunicorn managing Uvicorn workers):
# gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
# -w 4 creates 4 worker processes to utilize 4 CPU cores.`,
    practice: "Explain what happens if you use `requests.get(...)` inside an `async def` route. Propose the correct library to use instead of `requests` for making asynchronous HTTP calls, and write a snippet of what it looks like.",
    solution: `"""
Ans: Using the synchronous 'requests' library inside 'async def' blocks the ASGI event loop, 
causing all other concurrent requests to hang until the HTTP call completes.

Correct Approach: Use an asynchronous HTTP client like 'httpx' or 'aiohttp'.
"""
import httpx
from fastapi import FastAPI

app = FastAPI()

@app.get("/fetch-weather")
async def get_weather():
    # We use httpx.AsyncClient to make non-blocking HTTP requests
    async with httpx.AsyncClient() as client:
        # The 'await' yields control back to the event loop
        response = await client.get("https://api.weatherapi.com/v1/current.json?q=London")
        return response.json()
`
  },
  {
    time: "Hour 4",
    title: "Database Pooling & ORM (SQLAlchemy 2.0 Async)",
    concept: [
      "**SQLAlchemy 2.0 Async:** Provides full native async support, making it the standard ORM for FastAPI. Use `create_async_engine` with async drivers like `asyncpg` (PostgreSQL) or `aiosqlite` (SQLite). This ensures DB queries never block the event loop.",
      "**Connection Pooling Internals:** SQLAlchemy maintains a `QueuePool` of persistent connections. Key parameters: `pool_size=20` (permanent connections), `max_overflow=10` (temporary extras under load), `pool_timeout=30` (wait time before raising), `pool_recycle=1800` (recycle connections every 30 min to prevent stale TCP).",
      "**pool_pre_ping:** Enable `pool_pre_ping=True` on the engine to test each connection with a lightweight query before using it. This prevents 'connection reset' errors when the DB drops idle connections (common with AWS RDS that kills idle connections after 8 hours).",
      "**AsyncSession Dependency Pattern:** Yield an `AsyncSession` from a FastAPI dependency. The `async with` context manager automatically rolls back uncommitted transactions on error and returns the connection to the pool on scope exit. This guarantees no connection leaks.",
      "**ORM Execution:** Use SQLAlchemy 2.0 style: `result = await session.execute(select(User).where(User.active == True))`. Chain `.scalars().all()` for lists, `.scalar_one_or_none()` for single results. Always `await session.commit()` after writes and `await session.refresh(obj)` to load DB-generated fields like auto-increment IDs.",
      "**Relationship Loading:** Async sessions cannot lazy-load relationships by default. Use `selectinload(User.orders)` or `joinedload(User.profile)` in your query to eagerly load related data in one round-trip. Forgetting this causes `MissingGreenlet` errors.",
      "**Alembic Async Migrations:** Use Alembic with `async` support for schema migrations. Configure `run_async(connectable.run_sync(target_metadata.create_all))` in your `env.py`. This keeps your migration pipeline consistent with your async application code.",
    ],
    code: `from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select

# 1. Async Setup (Requires 'asyncpg' library)
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"

# pool_size specifies how many connections to keep open permanently.
engine = create_async_engine(DATABASE_URL, pool_size=20, max_overflow=10, echo=False)

# AsyncSession factory
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase): pass

# 2. Model Definition
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)

# 3. Dependency Yielding Connection from the Pool
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session # Automatically rolled back/closed when scope exits

app = FastAPI()

@app.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    # 4. Async Execution 
    stmt = select(User).limit(10)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return {"data": users}`,
    practice: "Write an async endpoint that inserts a new user via SQLAlchemy `AsyncSession`. Ensure you call `await session.commit()` and `await session.refresh(user)` so you can return the generated ID.",
    solution: `from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
# Assumes User model and get_db from previous example

app = FastAPI()

@app.post("/users")
async def create_user(username: str, db: AsyncSession = Depends(get_db)):
    # Create Python object
    new_user = User(username=username)
    
    # Add to transaction
    db.add(new_user)
    
    # Asynchronously execute transaction
    await db.commit()
    
    # Refresh to pull the auto-incremented primary key (id) from DB
    await db.refresh(new_user)
    
    return {"id": new_user.id, "username": new_user.username}`
  },
  {
    time: "Hour 5",
    title: "Caching & Background Tasks",
    concept: [
      "**BackgroundTasks:** FastAPI's built-in mechanism to run functions AFTER returning the HTTP response. Inject `background_tasks: BackgroundTasks` and call `background_tasks.add_task(fn, arg1, arg2)`. The client gets an instant response while the task runs asynchronously. Use for emails, webhooks, audit logging, and lightweight cleanup.",
      "**Sync vs Async Background Tasks:** If the background function is defined with `def` (sync), FastAPI runs it in a threadpool. If defined with `async def`, it runs on the event loop. CPU-bound sync tasks in the background will still block the worker thread, so keep them lightweight.",
      "**BackgroundTasks vs Celery:** BackgroundTasks run inside the web worker process -- if the server restarts, unfinished tasks are lost. Celery/ARQ uses external message brokers (Redis/RabbitMQ), providing durability, retries, scheduling, and horizontal scaling. Use BackgroundTasks for fire-and-forget I/O; use Celery for critical or long-running jobs.",
      "**Redis Caching:** Use `redis.asyncio` for non-blocking cache reads/writes. Pattern: check cache first (`await redis.get(key)`), if miss then query DB, then cache result (`await redis.setex(key, ttl, value)`). This reduces DB load by 80-95% for read-heavy workloads.",
      "**Cache TTL Strategies:** (1) **Time-based:** `setex(key, 300, data)` expires after 5 min. (2) **Event-based invalidation:** delete the cache key when data is mutated. (3) **Stale-while-revalidate:** serve stale cache immediately while refreshing in the background.",
      "**fastapi-cache2 Decorator:** Provides `@cache(expire=60)` decorator that transparently caches endpoint responses. Supports Redis, Memcached, and in-memory backends. Generates cache keys from the request URL and query parameters automatically.",
      "**ARQ Task Queue:** A lightweight async alternative to Celery, designed for Python's asyncio. Integrates naturally with FastAPI since both are async. Uses Redis as the broker and supports retries, cron-style scheduling, and result storage.",
    ],
    code: `from fastapi import FastAPI, BackgroundTasks, Depends
import asyncio

app = FastAPI()

# --- 1. Background Tasks ---
def send_email_notification(email: str, message: str):
    # Simulated external API call (runs in a separate thread if defined with 'def')
    print(f"Sending email to {email}: {message}")

@app.post("/register")
async def register_account(email: str, background_tasks: BackgroundTasks):
    # Do registration logic here...
    
    # Enqueue task. The HTTP response is returned immediately to the client.
    background_tasks.add_task(send_email_notification, email, "Welcome!")
    return {"message": "Registration successful, email will arrive shortly."}

# --- 2. Manual Redis Caching Concept ---
# import redis.asyncio as redis
# redis_client = redis.Redis(host='localhost', port=6379, db=0)

# @app.get("/heavy-data")
# async def heavy_data():
#     cached = await redis_client.get("heavy_data_key")
#     if cached:
#         return {"source": "cache", "data": cached}
#     
#     # Simulate 2 second DB query
#     await asyncio.sleep(2)
#     data = "Expensive computation result"
#     
#     # Cache for 60 seconds
#     await redis_client.setex("heavy_data_key", 60, data)
#     return {"source": "db", "data": data}`,
    practice: "Explain the difference between FastAPI's BackgroundTasks and using an external message broker like Celery/RabbitMQ. When would you use BackgroundTasks vs Celery?",
    solution: `"""
Ans:
BackgroundTasks run inside the actual FastAPI worker process (using asyncio tasks or a threadpool).
Pros: Zero setup, built-in, great for quick, lightweight tasks like firing an email.
Cons: If the server restarts, tasks are lost. CPU-bound tasks block the web worker.

Celery/RabbitMQ runs in entirely separate processes/servers and uses message queues.
Pros: High resilience (tasks persist across restarts), scalable across many servers, doesn't block web workers.
Cons: High architectural complexity (requires Redis/RabbitMQ infrastructure).

Verdict: Use BackgroundTasks for fire-and-forget I/O logic. Use Celery for heavy data processing, PDF generation, or tasks strictly requiring retry logic and durability.
"""`
  },
  {
    time: "Hour 6",
    title: "WebSockets: Real-Time Bidirectional Communication",
    concept: [
      "**WebSockets** provide a persistent, full-duplex communication channel over a single TCP connection. Once the HTTP handshake upgrades to WebSocket, both the client and server can push data at any time without the overhead of HTTP headers on each message. Ideal for chat, live dashboards, and gaming.",
      "**FastAPI WebSockets:** Declare with `@app.websocket('/ws')`. You MUST call `await websocket.accept()` before reading or writing. Use `await websocket.receive_text()` / `receive_json()` to read and `await websocket.send_text()` / `send_json()` to write.",
      "**Connection Manager Pattern:** Track active connections in a class with `connect()`, `disconnect()`, and `broadcast()` methods. This is essential for chat rooms, notification systems, and trading platforms where messages need to fan out to multiple clients.",
      "**Rooms and Channels:** Extend the ConnectionManager with a `dict[str, list[WebSocket]]` to support named rooms/channels. Clients join a room on connect and messages are broadcast only within that room, not globally.",
      "**Heartbeat / Ping-Pong:** WebSocket connections can silently drop (network changes, mobile sleep). Implement periodic ping/pong frames or application-level heartbeats (`await websocket.send_json({'type': 'ping'})` every 30s) and disconnect clients that don't respond.",
      "**Multi-Worker Problem & Redis Pub/Sub:** Each Uvicorn worker has its own in-memory ConnectionManager. Worker 1 cannot broadcast to clients connected to Worker 2. Solution: publish messages to a Redis Pub/Sub channel and have each worker subscribe, forwarding messages to their local clients.",
      "**Binary Data:** WebSockets support binary frames via `receive_bytes()` / `send_bytes()`. Use this for streaming audio, video frames, or protobuf-encoded payloads where JSON overhead is unacceptable.",
    ],
    code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        # Store active connections
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            # Send text msg to all connected clients
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for data from client
            data = await websocket.receive_text()
            
            # Broadcast the received message to everyone
            await manager.broadcast(f"Client #{client_id} says: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left the chat")`,
    practice: "Build a `WebSocket` endpoint that echoes messages back to the client, but converts the received text to UPPERCASE. Handle `WebSocketDisconnect` cleanly.",
    solution: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/echo")
async def echo_websocket(websocket: WebSocket):
    await websocket.accept()
    print("Client connected!")
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"ECHO: {data.upper()}")
    except WebSocketDisconnect:
        print("Client disconnected cleanly. No action needed.")`
  },
  {
    time: "Hour 7",
    title: "Server-Sent Events (SSE) for Streaming Data",
    concept: [
      "**Server-Sent Events (SSE):** A unidirectional protocol over HTTP where the server pushes text-based event data continuously to the client. Simpler than WebSockets when you only need server-to-client data flow (live logs, stock tickers, LLM token streaming, notification feeds).",
      "**StreamingResponse:** FastAPI implements SSE via `StreamingResponse`. Pass an async generator and set `media_type='text/event-stream'`. The connection stays open and the server yields data chunks as they become available.",
      "**SSE Data Format:** Each event block follows the format: `data: payload\n\n`. Named events use `event: eventName\ndata: payload\n\n`. The `id:` field enables client reconnection from the last received event. The `retry:` field tells the browser how many ms to wait before reconnecting.",
      "**LLM Token Streaming:** SSE is the standard pattern used by OpenAI, Anthropic, and LangChain to stream AI-generated tokens to frontends. Without streaming, users wait 10-30 seconds for a complete response. With SSE, tokens appear in real-time as they are generated.",
      "**Client Reconnection:** The browser's `EventSource` API automatically reconnects on network drops. It sends a `Last-Event-ID` header so the server can resume from where it left off. Design your generator to support resumption using event IDs.",
      "**SSE vs WebSockets:** SSE is simpler (works over standard HTTP, auto-reconnects, firewall-friendly) but is unidirectional. Use SSE when only the server sends data. Use WebSockets when the client also needs to send data (chat, interactive forms).",
      "**Backpressure:** If the client consumes data slower than the server produces it, the TCP buffer fills up. Handle this by checking for client disconnection in your generator (`if await request.is_disconnected(): break`) to avoid wasting server resources.",
    ],
    code: `from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

# Async Generator that yields data periodically
async def event_generator():
    counter = 1
    while True:
        # Check if client disconnected by handling exceptions 
        # or relying on ASGI server timeout mechanisms
        
        # Format MUST strictly match SSE proto: "data: value \n\n"
        yield f"data: Tick {counter}\n\n"
        
        counter += 1
        await asyncio.sleep(1) # Wait 1 sec without blocking loop

@app.get("/stream-prices")
async def stream_prices():
    # Return StreamingResponse with SSE media type
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

# --- Frontend Client Usage (JS) ---
# const eventSource = new EventSource("http://localhost:8000/stream-prices");
# eventSource.onmessage = function(event) {
#     console.log("New price tick:", event.data);
# };
# // Close when done: eventSource.close();`,
    practice: "Write an SSE streaming endpoint `/countup` that loops from 1 to 10, yields the payload `data: {\"count\": X}\n\n`, and then breaks the loop, naturally closing the HTTP connection.",
    solution: `from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

async def countup_generator():
    for i in range(1, 11):
        # Payload must be strings, JSON is converted via json.dumps
        payload = json.dumps({"count": i})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(0.5)

@app.get("/countup")
async def countup():
    return StreamingResponse(countup_generator(), media_type="text/event-stream")`
  },
  {
    time: "Hour 8",
    title: "React JS Frontend Integration Patterns",
    concept: [
      "**CORS Setup:** If React runs on `localhost:5173` and FastAPI on `localhost:8000`, the browser blocks cross-origin requests by default. You MUST add `CORSMiddleware` with `allow_origins`, `allow_methods`, and `allow_headers`. In production, NEVER use `['*']` for origins -- whitelist specific domains.",
      "**HTTP Integration with TanStack Query:** For CRUD operations, use `@tanstack/react-query` with `axios` or `fetch`. React Query handles caching, automatic background refetching, loading/error states, pagination, and optimistic updates. This eliminates 80% of manual `useEffect` data-fetching code.",
      "**OpenAPI Code Generation:** FastAPI auto-generates `/openapi.json`. Use `openapi-typescript-codegen` or `orval` to generate TypeScript interfaces and API client functions from this spec. This gives you type-safe API calls with zero manual typing.",
      "**WebSocket Integration in React:** Manage the WebSocket lifecycle in a `useEffect` hook. Store the connection in a `useRef` to prevent re-renders from closing/reopening the socket. Handle `onopen`, `onmessage`, `onerror`, and `onclose` events. Clean up with `ws.current.close()` in the effect cleanup function.",
      "**SSE Integration in React:** Use the native `EventSource` API inside `useEffect`. It auto-reconnects on disconnection. Parse incoming `event.data` and update state: `source.onmessage = (e) => setMessages(prev => [...prev, JSON.parse(e.data)])`. Close with `source.close()` on unmount.",
      "**Vite Proxy for Development:** Instead of configuring CORS during local development, use Vite's built-in proxy: `server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }`. This makes React and FastAPI appear to be on the same origin.",
      "**File Upload from React:** Use `FormData` with `axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`. FastAPI receives the file via `UploadFile` parameter. For large files, track progress with `onUploadProgress` callback.",
    ],
    code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. FastAPI CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],    # Allows GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],
)

@app.get("/api/message")
async def get_message():
    return {"msg": "Hello React!"}

# ==========================================================
# React Integration Code (JavaScript/JSX)
# ==========================================================

/* 2. Standard Axios Fetch (React Query recommended) */
// import axios from "axios";
// import { useEffect, useState } from "react";
//
// function Dashboard() {
//   const [data, setData] = useState(null);
//   useEffect(() => {
//     axios.get("http://localhost:8000/api/message")
//       .then(res => setData(res.data.msg));
//   }, []);
//   return <div>{data}</div>;
// }

/* 3. WebSocket Integration component */
// import { useEffect, useRef, useState } from "react";
// 
// function LiveChat() {
//   const [messages, setMessages] = useState([]);
//   const ws = useRef(null);
// 
//   useEffect(() => {
//     // Connect on Mount
//     ws.current = new WebSocket("ws://localhost:8000/ws/client1");
//     
//     ws.current.onmessage = (event) => {
//       setMessages(prev => [...prev, event.data]);
//     };
// 
//     // Disconnect on Unmount
//     return () => ws.current.close();
//   }, []);
// 
//   return (
//     <ul>
//       {messages.map((m, i) => <li key={i}>{m}</li>)}
//     </ul>
//   );
// }`,
    practice: "Your React app tries to fetch data from FastAPI but getting 'Blocked by CORS policy'. Write the FastAPI command required to allow CORS specifically from `https://myapp.com` safely.",
    solution: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Be restrictive in production, don't use ["*"]
    allow_origins=["https://myapp.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)`
  },
  {
    time: "Hour 9",
    title: "Profiling & Performance Middleware",
    concept: [
      "**Identifying Bottlenecks:** Before optimizing, you must measure. Is the bottleneck in DB I/O, JSON serialization, external API calls, or Python computation? Never guess -- profile first, then optimize the hottest path.",
      "**Custom Timing Middleware:** Use `@app.middleware('http')` to wrap every request with a timer. Inject the result as `X-Process-Time` header. APM tools (Datadog, New Relic) and load balancers can read this header to generate latency dashboards.",
      "**GZip Middleware:** Enable `GZipMiddleware(app, minimum_size=500)` to compress responses larger than 500 bytes. This reduces network bandwidth by 60-80% for JSON-heavy APIs. The CPU cost is negligible compared to the network savings.",
      "**Trusted Host Middleware:** Use `TrustedHostMiddleware(app, allowed_hosts=['api.myapp.com'])` to reject requests with unexpected `Host` headers, preventing DNS rebinding attacks.",
      "**PyInstrument Profiler:** A lightweight statistical profiler that generates HTML flame charts showing exactly which Python lines are slow. Integrate as middleware: start profiling on request, stop on response, and dump the HTML report. Use a `?profile=1` query param to enable on-demand.",
      "**ORJSONResponse for Speed:** Replace the default `JSONResponse` with `ORJSONResponse` by setting `default_response_class=ORJSONResponse` on the app. `orjson` is written in Rust and is 3-10x faster than Python's `json` module for serializing large payloads.",
      "**Sentry Integration:** Use `sentry-sdk[fastapi]` to automatically capture unhandled exceptions, slow transactions, and breadcrumbs. Sentry groups errors, tracks frequency, and alerts your team. Essential for production visibility.",
    ],
    code: `from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
import time

# By default, FastAPI uses JSONResponse. ORJSONResponse is much faster.
app = FastAPI(default_response_class=ORJSONResponse)

# 1. Custom Performance Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    
    # Pass request down the chain to the actual endpoint
    response = await call_next(request)
    
    process_time = time.time() - start_time
    # Inject header into the HTTP response. Tools like Postman or New Relic can read this.
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# 2. PyInstrument Profiler Concept
# pip install pyinstrument
#
# from pyinstrument import Profiler
# @app.middleware("http")
# async def profile_request(request: Request, call_next):
#     # If a special query param ?profile=1 is present, profile the request
#     profiling = request.query_params.get("profile", False)
#     if profiling:
#         profiler = Profiler()
#         profiler.start()
#
#     response = await call_next(request)
#
#     if profiling:
#         profiler.stop()
#         with open("profile.html", "w") as f:
#             f.write(profiler.output_html())
#
#     return response

@app.get("/data")
async def get_data():
    return {"message": "Extremely fast response using ORJSON"}`,
    practice: "Write a middleware that logs the Request Method (GET/POST) and URL Path to the console before processing the request.",
    solution: `from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming Request: {request.method} {request.url.path}")
    
    # Process the request
    response = await call_next(request)
    
    print(f"Completed with Status Code: {response.status_code}")
    return response`
  },
  {
    time: "Hour 10",
    title: "Production Deployment: Docker & Gunicorn Architecture",
    concept: [
      "**The ASGI Architecture Stack:** Four layers: **Nginx** (reverse proxy, SSL termination, static files) -> **Gunicorn** (process manager, restarts crashed workers) -> **Uvicorn** (ASGI server, translates HTTP to async Python) -> **FastAPI** (your application framework). Each layer has a distinct production responsibility.",
      "**Multi-Stage Docker Build:** Use a two-stage Dockerfile: Stage 1 installs dependencies into a virtual env, Stage 2 copies only the venv and source code into a slim base image. This reduces image size from 1GB+ to ~150MB and eliminates build tools from the production image.",
      "**Worker Scaling Formula:** Gunicorn workers = `(2 x CPU_cores) + 1`. For an ECS task with 2 vCPUs, run 5 workers. For memory-constrained containers, reduce workers and increase `--threads` per worker instead. Monitor memory usage per worker to find the sweet spot.",
      "**Health & Readiness Probes:** Expose `/health` (liveness: is the process alive?) and `/ready` (readiness: can it serve traffic? e.g., DB connected?). Kubernetes and ECS use these to auto-restart unhealthy containers and route traffic only to ready ones.",
      "**Graceful Shutdown:** Configure Gunicorn's `--graceful-timeout 30` so that in-flight requests finish before the worker is killed during deployments. Without this, active WebSocket connections and long-running requests are abruptly terminated.",
      "**Prometheus Metrics:** Use `prometheus-fastapi-instrumentator` to expose a `/metrics` endpoint. It tracks request count, latency percentiles (p50/p95/p99), error rates, and in-flight requests. Scrape with Prometheus and visualize in Grafana.",
      "**Environment Configuration:** Use `pydantic-settings` to load config from environment variables with type validation: `class Settings(BaseSettings): db_url: str; redis_url: str; debug: bool = False`. Access via `settings = Settings()`. Never hardcode secrets.",
    ],
    code: `# === 1. The Dockerfile ===
"""
FROM python:3.11-slim

WORKDIR /app

# Best Practice: Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the API port
EXPOSE 8000

# Start Gunicorn managing Uvicorn workers
# -w 4 = 4 worker processes
# -k uvicorn.workers.UvicornWorker = The specialized ASGI worker class
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
"""

# === 2. main.py (Entrypoint) ===
from fastapi import FastAPI
# pip install prometheus-fastapi-instrumentator
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Mount metrics endpoint for Prometheus server to scrape
Instrumentator().instrument(app).expose(app)

@app.get("/health")
def healthcheck():
    return {"status": "up", "workers_running": True}`,
    practice: "If your Kubernetes pod dies sporadically due to memory leaks, explain why relying natively on `uvicorn main:app` is dangerous in production compared to using `gunicorn` with Uvicorn workers.",
    solution: `"""
Ans:
Running bare 'uvicorn main:app' runs a single Python process. If that process crashes or runs out of memory, the server stops serving requests completely until the container orchestration (Docker/K8s) restarts the pod, causing seconds of downtime.

Gunicorn acts as a Master Process Manager. If a Uvicorn child worker dies due to a memory leak, Gunicorn instantly detects it and spawns a fresh worker to replace it in milliseconds. The master process stays alive, ensuring zero downtime. Furthermore, Gunicorn allows specifying worker limits (e.g., max_requests=1000) to proactively restart workers before memory leaks become fatal.
"""`
  },
  {
    time: "Hour 11",
    title: "Security: OAuth2, JWT & Password Hashing",
    concept: [
      "**OAuth2PasswordBearer:** FastAPI provides a built-in OAuth2 password flow via `OAuth2PasswordBearer(tokenUrl='token')`. This declares a security dependency that extracts the Bearer token from the `Authorization` header and passes it to your endpoint for validation.",
      "**JWT (JSON Web Tokens):** JWTs encode user identity and claims (role, permissions, expiry) into a signed, base64 token. The server signs with a secret key using `python-jose`. On each request, the server verifies the signature without querying the database, enabling stateless authentication.",
      "**Token Structure:** A JWT has three parts: Header (algorithm), Payload (sub, exp, role), and Signature. Set short expiry times (15-30 min) for access tokens and longer (7 days) for refresh tokens. Include `exp` (expiry) and `sub` (subject/user_id) claims.",
      "**Password Hashing with passlib:** NEVER store passwords in plain text. Use `passlib` with `bcrypt` to hash passwords: `pwd_context.hash(password)` to store and `pwd_context.verify(plain, hashed)` to check. Bcrypt includes a salt automatically, preventing rainbow table attacks.",
      "**Protected Routes Pattern:** Create a `get_current_user` dependency that decodes the JWT, validates expiry, fetches the user from DB, and returns the user object. Inject it: `current_user: User = Depends(get_current_user)`. Any invalid token returns 401 before the endpoint runs.",
      "**Scopes & Role-Based Access:** JWT scopes restrict what a token can do (e.g., `read:users`, `write:admin`). Implement `Security(oauth2_scheme, scopes=['admin'])` to enforce that only tokens with the correct scope can access specific endpoints.",
      "**Refresh Token Flow:** Issue a short-lived access token and a long-lived refresh token. When the access token expires, the client sends the refresh token to `/refresh` to get a new access token without re-entering credentials. Store refresh tokens securely (HTTPOnly cookies or encrypted DB).",
    ],
    code: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel

# Config
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme - extracts Bearer token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

# Mock DB
fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "hashed_password": pwd_context.hash("secret123"),
        "role": "admin"
    }
}

class Token(BaseModel):
    access_token: str
    token_type: str

# 1. Create JWT Token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 2. Dependency: Decode and validate JWT
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = fake_users_db.get(username)
    if user is None:
        raise credentials_exception
    return user

# 3. Login endpoint - issues JWT
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 4. Protected endpoint
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user`,
    practice: "Write a dependency `require_admin` that checks if the current user's role is 'admin'. If not, raise a 403 Forbidden. Chain it with `get_current_user` so the endpoint is both authenticated AND authorized.",
    solution: `from fastapi import Depends, HTTPException, status

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

@app.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(require_admin)):
    # Only users with role="admin" reach this point
    return {"message": "Welcome to the admin dashboard", "user": admin["username"]}`
  },
  {
    time: "Hour 12",
    title: "Error Handling & Custom Exceptions",
    concept: [
      "**HTTPException:** The primary way to return error responses. `raise HTTPException(status_code=404, detail='Item not found')` returns a JSON `{'detail': 'Item not found'}` with status 404. You can also pass `headers` for custom response headers (e.g., `WWW-Authenticate`).",
      "**Custom Exception Classes:** Define application-specific exceptions by subclassing Python's `Exception`: `class ItemNotFoundError(Exception): ...`. Then register a handler with `@app.exception_handler(ItemNotFoundError)` to control the exact JSON response format.",
      "**Global Exception Handler:** Catch ALL unhandled exceptions with `@app.exception_handler(Exception)` to prevent stack traces from leaking to clients. Log the full traceback server-side but return a generic `500 Internal Server Error` JSON to the client.",
      "**RequestValidationError Handler:** Override the default 422 response for Pydantic validation errors by registering `@app.exception_handler(RequestValidationError)`. This lets you customize the error format (e.g., flattening nested error details into user-friendly messages).",
      "**Structured Error Responses:** Define a standard error model: `class ErrorResponse(BaseModel): code: str; message: str; details: list = None`. Return this consistently across all error handlers so frontend clients can parse errors uniformly.",
      "**Exception Middleware vs Handlers:** `@app.exception_handler` catches exceptions raised inside route functions. Middleware catches exceptions raised anywhere in the request pipeline, including other middleware. Use both for comprehensive coverage.",
      "**Logging Errors:** Integrate Python's `logging` module in exception handlers: `logger.exception('Unhandled error', exc_info=exc)`. This captures the full stack trace in your log aggregator (CloudWatch, ELK) while returning a clean response to the client.",
    ],
    code: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
app = FastAPI()

# 1. Custom exception class
class ItemNotFoundError(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id

# 2. Standard error response model
class ErrorResponse(BaseModel):
    code: str
    message: str
    details: list | None = None

# 3. Register handler for custom exception
@app.exception_handler(ItemNotFoundError)
async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            code="ITEM_NOT_FOUND",
            message=f"Item with ID {exc.item_id} does not exist"
        ).model_dump()
    )

# 4. Override Pydantic validation error format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=errors
        ).model_dump()
    )

# 5. Global catch-all for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            code="INTERNAL_ERROR",
            message="An unexpected error occurred"
        ).model_dump()
    )

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    if item_id > 100:
        raise ItemNotFoundError(item_id=item_id)
    return {"id": item_id, "name": "Widget"}`,
    practice: "Create a `RateLimitExceeded` custom exception and its handler that returns status 429 with a `Retry-After` header set to 60 seconds.",
    solution: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int = 60):
        self.retry_after = retry_after

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"code": "RATE_LIMITED", "message": "Too many requests"},
        headers={"Retry-After": str(exc.retry_after)}
    )

@app.get("/api/data")
async def get_data():
    # Simulated rate limit check
    raise RateLimitExceeded(retry_after=60)`
  },
  {
    time: "Hour 13",
    title: "File Uploads, Static Files & Streaming Responses",
    concept: [
      "**UploadFile:** FastAPI handles file uploads via `UploadFile` parameter. It provides `.filename`, `.content_type`, `.file` (a SpooledTemporaryFile), and async methods: `await file.read()`, `await file.write()`, `await file.seek(0)`. Files smaller than 1MB are kept in memory; larger ones spill to disk.",
      "**Multiple File Uploads:** Accept multiple files with `files: list[UploadFile]`. Validate file count, individual size, total size, and allowed MIME types before processing. Always limit upload sizes to prevent denial-of-service attacks.",
      "**Streaming Large Files:** For large uploads (videos, datasets), do NOT use `await file.read()` which loads the entire file into memory. Instead, read in chunks: `while chunk := await file.read(8192): f.write(chunk)`. This keeps memory usage constant regardless of file size.",
      "**S3 Upload Pattern:** In production, upload files directly to S3/MinIO using `boto3` or `aiobotocore`. Use presigned URLs for direct browser-to-S3 uploads (bypassing your API server entirely) when files exceed 100MB.",
      "**StaticFiles Mount:** Serve static assets (images, CSS, JS) from a directory: `app.mount('/static', StaticFiles(directory='static'), name='static')`. This is useful for serving user-uploaded content or SPA frontends directly from FastAPI.",
      "**FileResponse & StreamingResponse:** Return files to clients with `FileResponse('path/to/file.pdf', media_type='application/pdf', filename='report.pdf')`. For dynamically generated files (CSV exports, PDF reports), use `StreamingResponse` with an async generator.",
      "**Form Data:** Accept form fields alongside files using `Form(...)` parameters: `async def upload(title: str = Form(...), file: UploadFile = File(...))`. Note that `Form` and `Body` (JSON) cannot be mixed in the same endpoint -- use `Form` when files are involved.",
    ],
    code: `from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Mount static files directory
# app.mount("/static", StaticFiles(directory="static"), name="static")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}

# 1. Single file upload with validation
@app.post("/upload")
async def upload_file(
    description: str = Form(...),
    file: UploadFile = File(...)
):
    # Validate MIME type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type {file.content_type} not allowed")
    
    # Stream to disk in chunks (memory-safe for large files)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    total_size = 0
    
    with open(file_path, "wb") as f:
        while chunk := await file.read(8192):  # 8KB chunks
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                os.remove(file_path)
                raise HTTPException(413, "File too large (max 10MB)")
            f.write(chunk)
    
    return {
        "filename": file.filename,
        "size_bytes": total_size,
        "description": description
    }

# 2. Download a file
@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path, filename=filename)

# 3. Stream a CSV export
@app.get("/export/csv")
async def export_csv():
    async def generate():
        yield "id,name,email\\n"
        for i in range(1, 101):
            yield f"{i},user_{i},user{i}@example.com\\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"}
    )`,
    practice: "Write an endpoint that accepts multiple image uploads (max 5 files), validates that each is a JPEG or PNG, and returns a list of uploaded filenames and sizes.",
    solution: `from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

@app.post("/upload-images")
async def upload_images(files: list[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(400, "Maximum 5 files allowed")
    
    results = []
    for file in files:
        if file.content_type not in {"image/jpeg", "image/png"}:
            raise HTTPException(400, f"{file.filename}: must be JPEG or PNG")
        
        content = await file.read()
        results.append({
            "filename": file.filename,
            "size_bytes": len(content),
            "type": file.content_type
        })
    
    return {"uploaded": len(results), "files": results}`
  },
  {
    time: "Hour 14",
    title: "Testing with pytest & TestClient",
    concept: [
      "**TestClient:** FastAPI provides `TestClient` (backed by `httpx`) for synchronous testing. Create `client = TestClient(app)` and call `client.get('/items')`, `client.post('/items', json={...})`. It simulates HTTP requests without starting a real server.",
      "**pytest-asyncio for Async Tests:** When testing async dependencies or async DB sessions, use `pytest-asyncio` with `httpx.AsyncClient`: `async with AsyncClient(app=app, base_url='http://test') as ac: response = await ac.get('/')`. This runs tests inside an event loop.",
      "**Dependency Overrides:** Override any dependency for testing: `app.dependency_overrides[get_db] = lambda: mock_db_session`. This lets you inject mock databases, fake auth tokens, or test-specific configurations without changing production code.",
      "**Test Database Fixtures:** Use pytest fixtures to create a fresh test database per test session. Pattern: create tables in `setup`, yield the session, drop tables in `teardown`. Use SQLite in-memory (`sqlite+aiosqlite://`) for speed or a dedicated PostgreSQL test DB for accuracy.",
      "**Testing WebSockets:** TestClient supports WebSocket testing: `with client.websocket_connect('/ws') as ws: ws.send_text('hello'); data = ws.receive_text()`. Assert on the received messages to validate your WebSocket logic.",
      "**Testing Authentication:** Create a helper that generates a valid JWT for tests. Override the `get_current_user` dependency to return a mock user, or pass `headers={'Authorization': 'Bearer <test_token>'}` to test the full auth flow end-to-end.",
      "**Coverage & CI:** Run `pytest --cov=app --cov-report=html` to generate code coverage reports. Integrate with GitHub Actions or GitLab CI to enforce minimum coverage thresholds (e.g., 80%) and prevent merging untested code.",
    ],
    code: `# test_main.py
from fastapi.testclient import TestClient
from main import app, get_db

# 1. Basic TestClient usage
client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_create_item():
    response = client.post(
        "/items/1",
        json={"name": "Widget", "price": 9.99}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["data"]["name"] == "Widget"

def test_item_not_found():
    response = client.get("/items/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

# 2. Override Dependencies for Isolated Tests
def mock_get_db():
    return "MOCK_DB_SESSION"

app.dependency_overrides[get_db] = mock_get_db

def test_with_mock_db():
    response = client.get("/users")
    assert response.status_code == 200
    # Tests use mock DB, not real DB

# Clean up overrides  
app.dependency_overrides.clear()

# 3. Testing WebSockets
def test_websocket_echo():
    with client.websocket_connect("/echo") as ws:
        ws.send_text("hello")
        data = ws.receive_text()
        assert data == "ECHO: HELLO"

# 4. Async Test with httpx (requires pytest-asyncio)
# import pytest
# from httpx import AsyncClient, ASGITransport
#
# @pytest.mark.asyncio
# async def test_async_endpoint():
#     transport = ASGITransport(app=app)
#     async with AsyncClient(transport=transport, base_url="http://test") as ac:
#         response = await ac.get("/async-endpoint")
#         assert response.status_code == 200`,
    practice: "Write a test that overrides the `get_current_user` dependency to return a mock admin user, then tests a protected endpoint returns 200 with the expected user data.",
    solution: `from fastapi.testclient import TestClient
from main import app, get_current_user

# Override auth dependency with mock user
def mock_current_user():
    return {"username": "testadmin", "role": "admin"}

app.dependency_overrides[get_current_user] = mock_current_user

client = TestClient(app)

def test_protected_endpoint():
    response = client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"

# Always clean up
app.dependency_overrides.clear()`
  },
  {
    time: "Hour 15",
    title: "APIRouter, Project Structure & API Versioning",
    concept: [
      "**APIRouter:** FastAPI's modular routing system. Instead of defining all routes on the main `app` object, create `router = APIRouter()` in separate files and register them with `app.include_router(router, prefix='/api/users', tags=['users'])`. This keeps large applications organized.",
      "**Prefix & Tags:** `prefix='/api/v1/users'` prepends this path to all routes in the router. `tags=['Users']` groups the endpoints under 'Users' in the auto-generated Swagger docs. Both significantly improve code organization and API discoverability.",
      "**Enterprise Folder Structure:** Organize by domain: `app/routers/users.py`, `app/routers/items.py`, `app/models/user.py`, `app/schemas/user.py`, `app/services/user_service.py`, `app/core/config.py`, `app/core/security.py`. This separation of concerns scales to 50+ developers.",
      "**Router-Level Dependencies:** Apply dependencies to all routes in a router: `router = APIRouter(dependencies=[Depends(verify_token)])`. This is cleaner than adding `Depends()` to every single endpoint, especially for authenticated API groups.",
      "**API Versioning Strategies:** (1) **URL prefix:** `/api/v1/users` vs `/api/v2/users` (most common, explicit). (2) **Header-based:** `Accept: application/vnd.myapi.v2+json` (cleaner URLs but harder for clients). (3) **Query param:** `/users?version=2` (simple but unconventional). URL prefix is recommended for most APIs.",
      "**Mounting Sub-Applications:** For major version changes, mount an entirely separate FastAPI app: `app.mount('/api/v2', v2_app)`. Each version has its own middleware, exception handlers, and dependencies. This is ideal for breaking changes.",
      "**Lifecycle Events:** Use `@app.on_event('startup')` or the modern `lifespan` context manager to initialize resources (DB engine, Redis pool, ML models) on startup and clean them up on shutdown. This replaces scattered initialization code.",
    ],
    code: `# === Project Structure ===
# app/
#   main.py          <- Entry point, registers routers
#   core/
#     config.py      <- Settings, env vars
#     security.py    <- JWT, password hashing
#   models/
#     user.py        <- SQLAlchemy ORM models
#   schemas/
#     user.py        <- Pydantic request/response models
#   routers/
#     users.py       <- User endpoints (APIRouter)
#     items.py       <- Item endpoints (APIRouter)
#   services/
#     user_service.py <- Business logic

# === app/routers/users.py ===
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
    # All routes in this router require authentication
    # dependencies=[Depends(get_current_user)],
)

@router.get("/")
async def list_users():
    return [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]

@router.get("/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": "John Doe"}

@router.post("/", status_code=201)
async def create_user(name: str):
    return {"id": 3, "name": name}

# === app/main.py ===
from fastapi import FastAPI
from contextlib import asynccontextmanager
# from app.routers import users, items

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Initialize resources
    print("Starting up: connecting to DB, Redis, loading ML models...")
    # engine = create_async_engine(...)
    yield
    # SHUTDOWN: Cleanup resources
    print("Shutting down: closing DB pool, flushing caches...")
    # await engine.dispose()

app = FastAPI(title="Enterprise API", lifespan=lifespan)

# Register routers
# app.include_router(users.router)
# app.include_router(items.router)

# API Versioning via sub-application mounting
# v2_app = FastAPI(title="API V2")
# app.mount("/api/v2", v2_app)`,
    practice: "Create two separate APIRouters -- one for `products` and one for `orders`. Each should have a GET endpoint. Register both in the main app with proper prefixes and tags. Verify they appear as separate groups in Swagger.",
    solution: `from fastapi import FastAPI, APIRouter

# Router 1: Products
products_router = APIRouter(prefix="/api/v1/products", tags=["Products"])

@products_router.get("/")
async def list_products():
    return [{"id": 1, "name": "Laptop", "price": 999.99}]

# Router 2: Orders
orders_router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

@orders_router.get("/")
async def list_orders():
    return [{"id": 101, "product_id": 1, "quantity": 2}]

# Main app
app = FastAPI(title="E-Commerce API")
app.include_router(products_router)
app.include_router(orders_router)

# Swagger will show "Products" and "Orders" as separate groups`
  }
];

