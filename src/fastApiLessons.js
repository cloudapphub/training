export const fastApiLessons = [
  {
    time: "Hour 1",
    title: "Core Concepts: Routing, Request Validation & Pydantic",
    concept: [
      "**FastAPI** is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. It's built on top of Starlette (for the web parts) and Pydantic (for the data parts).",
      "**Routing:** Define endpoints using decorators like `@app.get('/')` or `@app.post('/items')`. Path parameters are declared in the path string and typed in the function signature: `@app.get('/items/{item_id}')`. Query parameters are arguments present in the function signature but not in the path.",
      "**Pydantic:** The engine behind FastAPI's data validation. When you strongly type your function arguments using Pydantic models (classes inheriting from `BaseModel`), FastAPI automatically parses the incoming JSON, validates it, and generates OpenAPI documentation (Swagger UI).",
      "**FastAPI Docs:** Out of the box, API documentation is generated dynamically at `/docs` (Swagger UI) and `/redoc` (ReDoc) based on your function signatures and Pydantic models. This eliminates the need manually write Swagger YAML files.",
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
      "**Dependency Injection (DI):** A design pattern where components receive their dependencies from outside. FastAPI has a native DI system built right into its routing mechanism via `Depends()`. It's one of the framework's most powerful features.",
      "**How it works:** A dependency is just a callable (a function or a class). You declare it in your route: `def get_item(db: Session = Depends(get_db))`. FastAPI runs `get_db()`, injects the result into `db`, and then runs `get_item`.",
      "**Hierarchical Dependencies:** Dependencies can have dependencies themselves. FastAPI resolves the entire graph, caching the results if `use_cache=True`.",
      "**Common Use Cases:** (1) Yielding Database sessions (`yield db` allows cleanup/rollback after the request). (2) Validating Authentication/JWT tokens. (3) Enforcing Permissions/Roles. (4) Shared logic (pagination parameters, sorting logic).",
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
      "**Async/Await:** FastAPI uses the ASGI (Asynchronous Server Gateway Interface) standard. A non-blocking `async def` endpoint allows the Python process to yield execution to other requests while waiting for network I/O (like DB queries or HTTP requests out).",
      "**The Golden Rule of Async:** Never run blocking synchronous code (like `time.sleep()`, heavy CPU computations, or synchronous `requests.get()`) inside an `async def` endpoint. It will block the entire event loop, destroying performance. Use `def` endpoints for blocking code (FastAPI automatically runs them in a separate threadpool!).",
      "**Uvicorn & Workers:** Uvicorn is the ASGI server that runs FastAPI. In production, a single Python process uses only 1 CPU core. To utilize multi-core servers, you run multiple workers (typically Gunicorn managing Uvicorn workers).",
      "**Connection Limits:** As you scale to thousands of requests/sec via async, you will exhaust backend limits faster. If 500 requests hit your database asynchronously, you need a robust connection pool (like PgBouncer or SQLAlchemy's `AsyncEngine`), otherwise you will exhaust DB connections instantly.",
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
      "**SQLAlchemy 2.0** provides full native support for asynchronous execution, making it the perfect ORM for FastAPI without blocking the event loop.",
      "**Database Engines:** Instead of `create_engine`, we use `create_async_engine`. Instead of `Session`, we use `AsyncSession`. We connect using async drivers like `asyncpg` for PostgreSQL.",
      "**Connection Pooling:** Under the hood, SQLAlchemy maintains a QueuePool of connections. In an async environment, connection pooling is critical. If 1,000 requests hit your API concurrently, your pool needs to be sized correctly (e.g., `pool_size=20, max_overflow=10`), or requests will queue waiting for a DB connection.",
      "**Execution:** ORM queries are executed using `session.execute(select(Model))` followed by `.scalars().all()`. All ORM interactions must be preceded by `await`.",
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
      "**BackgroundTasks:** Allow you to run functions after returning a response. Useful for sending emails, processing files, or logging metrics. They run in the same event loop, so if they are CPU-bound, they will still block the worker. For heavy distributed workloads, use Celery or ARQ.",
      "**Caching:** The fastest request is the one you never make to the database. Use **Redis** via the `redis-asyncio` library structure fast key-value caching.",
      "**FastAPI-Cache:** Libraries like `fastapi-cache2` provide a clean `@cache` decorator for endpoints, memoizing the response based on the request URL and parameters.",
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
      "**WebSockets** provide a persistent, full-duplex communication channel over a single TCP connection. Once the connection is established, both the client and the server can send data simultaneously without the overhead of HTTP headers on each message.",
      "**FastAPI WebSockets:** Injected into routes via `@app.websocket()`. You must `await websocket.accept()` before reading/writing data.",
      "**Connection Manager:** In chat applications or trading dashboards, you must track active connections. Connection managers maintain a list of active `WebSocket` objects in memory and facilitate broadcasting messages.",
      "**Limitations:** WebSocket connections hold server resources indefinitely. If using multiple Uvicorn workers, Worker 1 cannot directly broadcast to a WebSocket connected to Worker 2. To solve this in production, you must use a pub/sub backend like **Redis Pub/Sub** to synchronize messages across workers.",
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
      "**Server-Sent Events (SSE):** A unidirectional protocol over HTTP. The client connects once, and the server pushes text-based event data continuously. It is much simpler to implement than WebSockets if you only need the server to send data (e.g., Live Logs, Crypto Prices, LLM streaming).",
      "**StreamingResponse:** FastAPI implements SSE via `StreamingResponse`. You pass it an async generator (`async def stream_data(): yield data`) and specify the `media_type='text/event-stream'`.",
      "**Data Format:** SSE expects a specific text format: `data: Your Payload Here\n\n`. Two newline characters indicate the end of an event block.",
      "**LLM Streaming:** SSE is heavily used today by OpenAI and LangChain to stream tokens to frontends. It prevents the user from waiting 20 seconds for a massive JSON payload to resolve.",
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
      "**CORS Setup:** A common pitfall. If your React app runs on `localhost:5173` and FastAPI runs on `localhost:8000`, browsers will block requests due to Cross-Origin Resource Sharing rules. You MUST configure `CORSMiddleware` in FastAPI.",
      "**HTTP Integration:** For standard CRUD operations, use React `axios` combined with `TanStack Query (React Query)`. React Query handles caching, background fetching, and loading states for you. FastAPI’s auto-generated `/openapi.json` makes generating Typescript interfaces trivial.",
      "**WebSocket Integration Pattern:** In React, manage the WebSocket connection in a `useEffect` hook. Maintain the connection instance in a `useRef` to prevent re-renders from closing/opening the socket repeatedly.",
      "**SSE Integration Pattern:** Use the native browser `EventSource` API inside `useEffect`.",
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
      "**Identifying Bottlenecks:** To tune performance, you need to know exactly which function takes time. Database I/O? JSON serialization? External API calls?",
      "**Custom Middleware:** FastAPI middleware intercepts every request hitting the server before it reaches the endpoint, and intercepts the response before it returns to the client. We can use `BaseHTTPMiddleware` to track the exact `process_time` and inject it as a header `X-Process-Time`.",
      "**PyInstrument Profiler:** An industry-standard, lightweight statistical profiler for Python. You can integrate PyInstrument directly as a middleware to generate HTML stacks showing exactly which line of Python code caused the slow down.",
      "**JSON Speed:** If JSON parsing is slow, replace standard `json` with `orjson` by returning `ORJSONResponse`. It's significantly faster for massive arrays.",
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
      "**The ASGI Architecture Stack:** FastAPI is the framework. Uvicorn is the worker (translates HTTP to ASGI). Gunicorn is the Process Manager (manages multiple Uvicorn workers, restarts them if they crash). Nginx is the Reverse Proxy (handles SSL, serves static assets, load balances).",
      "**Dockerization:** When containerizing FastAPI, we expose port 80/8080 and use python:3.11-slim for minimal container size. We set `CMD` to launch our multi-worker setup.",
      "**Worker Scaling Formula:** A rule of thumb for concurrency: Number of Gunicorn workers = `(2 x $num_cores) + 1`. If your ECS task has 2 vCPUs, configure Gunicorn to run 5 workers.",
      "**Prometheus Metrics:** In enterprise, you cannot fly blind. We run exposing `/metrics` endpoints via tools like `prometheus-fastapi-instrumentator`. This tracks hit rates, latency, and 4xx/5xx errors directly to Grafana.",
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
  }
];
