export const genaiLessons = [
  {
    time: "Hour 1",
    title: "How LLMs Work — Transformers & Attention",
    concept: [
      "**Large Language Models (LLMs)** are neural networks trained on massive text corpora to predict the next token in a sequence. The key innovation is the **Transformer architecture** (2017), which replaced RNNs with **self-attention** — allowing the model to look at all tokens simultaneously rather than sequentially. This parallelism enables training on billions of parameters.",
      "**Self-attention** answers: 'For each word, which other words in the sentence are most relevant?' The model computes Query, Key, and Value matrices from the input, then calculates attention scores as `softmax(QK^T / sqrt(d_k)) * V`. High attention scores mean two tokens are strongly related — e.g., 'it' attending to 'cat' in 'The cat sat because it was tired.'",
      "**Tokenization** breaks text into subword units — not characters, not full words. The tokenizer (BPE, WordPiece, or SentencePiece) converts 'unhappiness' into `['un', 'happiness']`. Each token gets an integer ID. GPT-4 uses ~100K tokens; a token is roughly ¾ of a word. Token count directly affects cost and context window usage.",
      "**Parameters** are the learned weights in the network. GPT-3 has 175B parameters; LLaMA 3 has 8B-70B; GPT-4 is estimated at 1.7T. More parameters = more knowledge capacity, but also more compute cost. The model doesn't 'store' facts explicitly — knowledge is distributed across billions of weight values.",
    ],
    code: `# --- Understanding tokenization ---
import tiktoken

# GPT-4's tokenizer
enc = tiktoken.encoding_for_model("gpt-4")

text = "Generative AI transforms how we build software."
tokens = enc.encode(text)
print(f"Text: {text}")
print(f"Tokens: {tokens}")
print(f"Token count: {len(tokens)}")
print(f"Decoded: {[enc.decode([t]) for t in tokens]}")
# Output: ['Gener', 'ative', ' AI', ' transforms', ' how', ' we', ' build', ' software', '.']

# --- Token count matters for cost ---
def estimate_cost(text, model="gpt-4"):
    enc = tiktoken.encoding_for_model(model)
    tokens = len(enc.encode(text))
    # GPT-4: $0.03/1K input, $0.06/1K output (example pricing)
    input_cost = (tokens / 1000) * 0.03
    return {"tokens": tokens, "estimated_cost": f"\${input_cost:.4f}"}

print(estimate_cost("Explain quantum computing in detail."))

# --- Attention visualization concept ---
# In the sentence "The cat sat on the mat because it was soft"
# The word "it" attends strongly to "mat" (not "cat")
# because the model learned that "soft" relates to "mat"
# This is what self-attention computes automatically

# --- Temperature and sampling ---
# Temperature controls randomness:
# T=0.0 → always pick the highest probability token (deterministic)
# T=0.7 → balanced creativity vs coherence (good default)
# T=1.0 → sample proportional to probabilities
# T=2.0 → very random, often incoherent

# Top-p (nucleus sampling):
# p=0.1 → only consider tokens in the top 10% probability mass
# p=0.9 → consider tokens covering 90% of probability mass`,
    practice: "Write a Python script that tokenizes 3 different sentences, prints their token counts, and estimates the API cost for each at GPT-4 pricing.",
    solution: `import tiktoken

enc = tiktoken.encoding_for_model("gpt-4")

sentences = [
    "Hello, world!",
    "Explain the transformer architecture in machine learning.",
    "Write a Python function that sorts a list using quicksort with detailed comments.",
]

for s in sentences:
    tokens = enc.encode(s)
    cost = (len(tokens) / 1000) * 0.03
    print(f"Text: {s}")
    print(f"  Tokens: {len(tokens)}, Cost: \${cost:.4f}")
    print(f"  Breakdown: {[enc.decode([t]) for t in tokens]}")
    print()`,
  },
  {
    time: "Hour 2",
    title: "Calling LLM APIs — OpenAI, Anthropic & Bedrock",
    concept: [
      "The **Chat Completions API** is the standard interface for modern LLMs. You send a list of messages (system, user, assistant) and receive a completion. The **system message** sets behavior ('You are a helpful coding assistant'), **user messages** are the human input, and **assistant messages** are prior model responses for multi-turn context.",
      "**Key parameters**: `model` (gpt-4, claude-3-opus, etc.), `temperature` (0-2, controls randomness), `max_tokens` (output limit), `top_p` (nucleus sampling threshold), `stop` (stop sequences), and `response_format` (force JSON output). For deterministic outputs (code gen, data extraction), use `temperature=0`.",
      "**AWS Bedrock** provides a unified API to access multiple LLMs (Claude, LLaMA, Titan, Mistral) without managing infrastructure. You invoke models via `bedrock-runtime` with the same message format. Bedrock adds IAM-based access control, VPC endpoints for private access, and CloudWatch metrics — enterprise-grade LLM access.",
      "**Streaming** returns tokens as they're generated instead of waiting for the full response. This dramatically improves perceived latency — users see text appearing in real-time. Use `stream=True` in OpenAI or `InvokeModelWithResponseStream` in Bedrock. Process chunks with an async iterator.",
    ],
    code: `# --- OpenAI Chat Completions ---
from openai import OpenAI

client = OpenAI()  # uses OPENAI_API_KEY env var

response = client.chat.completions.create(
    model="gpt-4",
    temperature=0.7,
    max_tokens=500,
    messages=[
        {"role": "system", "content": "You are a senior Python developer. Give concise, practical answers."},
        {"role": "user", "content": "Explain decorators with a real-world example."},
    ],
)

print(response.choices[0].message.content)
print(f"Tokens used: {response.usage.total_tokens}")

# --- Streaming response ---
stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Write a haiku about coding."}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)

# --- AWS Bedrock (Claude) ---
import boto3, json

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

response = bedrock.invoke_model(
    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    contentType="application/json",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 500,
        "messages": [
            {"role": "user", "content": "Explain microservices vs monolith."}
        ],
    }),
)

result = json.loads(response["body"].read())
print(result["content"][0]["text"])

# --- Anthropic Python SDK ---
from anthropic import Anthropic

client = Anthropic()  # uses ANTHROPIC_API_KEY
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "What is RAG?"}],
)
print(message.content[0].text)`,
    practice: "Write a Python function that accepts a user question, calls the OpenAI API with a system prompt for a technical assistant, and returns the response with token usage stats.",
    solution: `from openai import OpenAI

def ask_technical(question: str, temperature: float = 0.3) -> dict:
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        temperature=temperature,
        max_tokens=800,
        messages=[
            {"role": "system", "content": "You are a senior software architect. Be concise and practical."},
            {"role": "user", "content": question},
        ],
    )
    return {
        "answer": response.choices[0].message.content,
        "input_tokens": response.usage.prompt_tokens,
        "output_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
    }

result = ask_technical("When should I use event-driven architecture?")
print(result["answer"])
print(f"Tokens: {result['total_tokens']}")`,
  },
  {
    time: "Hour 3",
    title: "Embeddings & Vector Databases",
    concept: [
      "**Embeddings** convert text into dense numerical vectors (arrays of floats) that capture semantic meaning. Similar texts produce vectors that are close together in high-dimensional space. 'King' and 'Queen' embeddings are close; 'King' and 'Banana' are far apart. OpenAI's `text-embedding-3-small` produces 1536-dimensional vectors.",
      "**Cosine similarity** measures how similar two vectors are, ranging from -1 (opposite) to 1 (identical). Two sentences about 'machine learning' will have cosine similarity ~0.85+, while 'machine learning' vs 'cooking recipes' will be ~0.2. This is the foundation of semantic search — find content by *meaning*, not just keyword matching.",
      "**Vector databases** (Pinecone, ChromaDB, pgvector, Weaviate, Qdrant) store embeddings and enable fast similarity search. You insert documents with their embedding vectors, then query with a question's embedding to find the most semantically similar documents. This is the 'Retrieval' in RAG.",
      "**Chunking strategy** is critical: you split your source documents into overlapping chunks (typically 500-1000 tokens with 50-100 token overlap). Too large = diluted relevance; too small = lost context. Each chunk gets embedded and stored independently. The overlap ensures no information is lost at chunk boundaries.",
    ],
    code: `# --- Generate embeddings ---
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding

# Embed documents
docs = [
    "Python is a high-level programming language.",
    "Machine learning uses statistical algorithms.",
    "The best pizza in NYC is at Joe's.",
]

embeddings = [get_embedding(doc) for doc in docs]
print(f"Embedding dimensions: {len(embeddings[0])}")  # 1536

# --- Cosine similarity ---
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

query = get_embedding("What programming languages are popular?")
for doc, emb in zip(docs, embeddings):
    score = cosine_similarity(query, emb)
    print(f"{score:.4f} — {doc}")
# Python doc will score highest (semantically closest)

# --- ChromaDB (local vector database) ---
import chromadb

chroma = chromadb.Client()
collection = chroma.create_collection("knowledge_base")

# Add documents — ChromaDB auto-generates embeddings
collection.add(
    documents=docs,
    ids=["doc1", "doc2", "doc3"],
    metadatas=[
        {"source": "python_docs", "topic": "programming"},
        {"source": "ml_textbook", "topic": "ai"},
        {"source": "food_blog", "topic": "food"},
    ],
)

# Semantic search
results = collection.query(query_texts=["How do I learn coding?"], n_results=2)
print(results["documents"])  # Returns Python and ML docs, not pizza

# --- Text chunking ---
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks`,
    practice: "Write a function that embeds a list of documents, stores them in ChromaDB with metadata, and performs a semantic search query returning the top 3 results with similarity scores.",
    solution: `import chromadb
from openai import OpenAI

client = OpenAI()

def build_and_search(docs: list[dict], query: str, top_k: int = 3):
    chroma = chromadb.Client()
    col = chroma.create_collection("search_demo")

    col.add(
        documents=[d["text"] for d in docs],
        ids=[f"doc_{i}" for i in range(len(docs))],
        metadatas=[{"source": d.get("source", "")} for d in docs],
    )

    results = col.query(query_texts=[query], n_results=top_k)

    for doc, dist in zip(results["documents"][0], results["distances"][0]):
        similarity = 1 - dist  # ChromaDB returns distance
        print(f"Score: {similarity:.4f} — {doc[:80]}...")

    return results

docs = [
    {"text": "FastAPI is a modern Python web framework for building APIs.", "source": "docs"},
    {"text": "Neural networks consist of layers of interconnected nodes.", "source": "textbook"},
    {"text": "Kubernetes orchestrates containerized applications.", "source": "k8s_docs"},
]

build_and_search(docs, "How do I build a REST API?")`,
  },
  {
    time: "Hour 4",
    title: "RAG — Retrieval-Augmented Generation",
    concept: [
      "**RAG (Retrieval-Augmented Generation)** solves LLM hallucination by grounding responses in real data. Instead of relying on the model's training data (which may be outdated or incomplete), RAG retrieves relevant documents from your knowledge base and includes them in the prompt. The LLM generates answers based on the retrieved context.",
      "**RAG pipeline**: User question → **Embed** the question → **Retrieve** top-K similar chunks from vector DB → **Augment** the prompt with retrieved chunks → **Generate** answer with the LLM. The quality of your RAG system depends on chunking strategy, embedding model, retrieval accuracy, and prompt engineering.",
      "**Context window management**: retrieved chunks must fit within the model's context window (4K-128K tokens depending on model). Rank chunks by relevance score and include as many as fit. Use a system prompt that instructs the LLM to answer *only* from the provided context and say 'I don't know' if the answer isn't in the context.",
      "**Advanced RAG patterns**: **Hybrid search** combines semantic (vector) search with keyword (BM25) search for better recall. **Re-ranking** uses a cross-encoder model to re-score retrieved chunks for precision. **Query expansion** rewrites the user query to improve retrieval. **Parent document retrieval** stores small chunks but retrieves the parent document for full context.",
    ],
    code: `# --- Complete RAG Pipeline ---
from openai import OpenAI
import chromadb

client = OpenAI()

# Step 1: Build the knowledge base
def build_knowledge_base(documents: list[str]):
    chroma = chromadb.PersistentClient(path="./chroma_db")

    # Delete if exists, then create fresh
    try:
        chroma.delete_collection("knowledge")
    except:
        pass

    collection = chroma.create_collection(
        name="knowledge",
        metadata={"hnsw:space": "cosine"},
    )

    # Chunk and store
    for i, doc in enumerate(documents):
        chunks = chunk_text(doc, chunk_size=300, overlap=50)
        collection.add(
            documents=chunks,
            ids=[f"doc{i}_chunk{j}" for j in range(len(chunks))],
            metadatas=[{"doc_id": i, "chunk_idx": j} for j in range(len(chunks))],
        )
    return collection

# Step 2: Retrieve relevant context
def retrieve(collection, query: str, top_k: int = 5) -> str:
    results = collection.query(query_texts=[query], n_results=top_k)
    context_chunks = results["documents"][0]
    return "\\n\\n---\\n\\n".join(context_chunks)

# Step 3: Generate answer with context
def rag_query(collection, question: str) -> str:
    context = retrieve(collection, question)

    response = client.chat.completions.create(
        model="gpt-4",
        temperature=0.2,
        messages=[
            {"role": "system", "content": """You are a helpful assistant.
Answer questions ONLY using the provided context.
If the answer is not in the context, say "I don't have enough information."
Always cite which part of the context supports your answer."""},
            {"role": "user", "content": f"""Context:
{context}

Question: {question}

Answer:"""},
        ],
    )
    return response.choices[0].message.content

# Step 4: Use it
docs = [
    "Our company's PTO policy allows 20 days per year...",
    "The engineering team uses Python, TypeScript, and Go...",
    "Deployment follows a CI/CD pipeline with GitHub Actions...",
]

kb = build_knowledge_base(docs)
answer = rag_query(kb, "How many PTO days do employees get?")
print(answer)  # Grounded in the actual PTO document`,
    practice: "Build a complete RAG pipeline: chunk 3 documents, store in ChromaDB, retrieve top-3 chunks for a query, and generate an LLM answer grounded in the retrieved context.",
    solution: `from openai import OpenAI
import chromadb

client = OpenAI()

def simple_rag(docs, question):
    # Store
    chroma = chromadb.Client()
    col = chroma.create_collection("rag_demo")
    col.add(documents=docs, ids=[f"d{i}" for i in range(len(docs))])

    # Retrieve
    results = col.query(query_texts=[question], n_results=3)
    context = "\\n".join(results["documents"][0])

    # Generate
    resp = client.chat.completions.create(
        model="gpt-4",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "Answer only from the context. Say 'unknown' if not found."},
            {"role": "user", "content": f"Context:\\n{context}\\n\\nQuestion: {question}"},
        ],
    )
    return resp.choices[0].message.content

answer = simple_rag(
    ["Python supports decorators for metaprogramming.",
     "Docker containers package applications with dependencies.",
     "Git is a distributed version control system."],
    "How do I containerize an app?"
)
print(answer)`,
  },
  {
    time: "Hour 5",
    title: "Function Calling & Tool Use",
    concept: [
      "**Function calling** (tool use) lets LLMs interact with external systems — databases, APIs, calculators, code interpreters. You define functions with JSON schemas describing their name, description, and parameters. The LLM decides when to call a function, generates the arguments as JSON, and your code executes the function and feeds the result back.",
      "The **flow**: send messages + function definitions → LLM responds with a `tool_call` (function name + JSON args) instead of text → your code executes the function → send the result back as a `tool` message → LLM generates the final answer incorporating the result. The model never executes code — it only decides *which* function to call and *with what arguments*.",
      "**Parallel function calling**: modern models can call multiple functions simultaneously. If a user asks 'What's the weather in NYC and London?', the model generates two `tool_call` objects in one response. You execute both, send both results back, and the model synthesizes a unified answer.",
      "**Use cases**: database queries, API calls, code execution, web search, file operations, calculations, booking systems. Function calling transforms LLMs from text generators into **intelligent agents** that can take actions in the real world. This is the foundation of agentic AI.",
    ],
    code: `# --- Function Calling with OpenAI ---
from openai import OpenAI
import json

client = OpenAI()

# Define available tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Run a SQL query against the application database",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "The SQL query to execute"},
                },
                "required": ["sql"],
            },
        },
    },
]

# Simulate function implementations
def get_weather(city: str, unit: str = "celsius") -> dict:
    # In real code, call a weather API
    return {"city": city, "temp": 22, "unit": unit, "condition": "sunny"}

def query_database(sql: str) -> str:
    # In real code, execute against your DB
    return json.dumps([{"name": "Alice", "orders": 5}, {"name": "Bob", "orders": 3}])

FUNCTION_MAP = {"get_weather": get_weather, "query_database": query_database}

# The agent loop
def agent_query(question: str) -> str:
    messages = [{"role": "user", "content": question}]

    response = client.chat.completions.create(
        model="gpt-4", messages=messages, tools=tools,
    )

    msg = response.choices[0].message

    # If the model wants to call functions
    if msg.tool_calls:
        messages.append(msg)  # add assistant's tool_call message

        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)
            result = FUNCTION_MAP[fn_name](**fn_args)

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result),
            })

        # Get final answer with function results
        final = client.chat.completions.create(
            model="gpt-4", messages=messages,
        )
        return final.choices[0].message.content

    return msg.content

print(agent_query("What's the weather in Tokyo?"))
print(agent_query("How many orders does Alice have?"))`,
    practice: "Define a tool that searches a product catalog by name and price range. Write the full agent loop: send query → LLM calls tool → execute → return result → LLM generates answer.",
    solution: `from openai import OpenAI
import json

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "search_products",
        "description": "Search products by name and price range",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "min_price": {"type": "number"},
                "max_price": {"type": "number"},
            },
            "required": ["query"],
        },
    },
}]

def search_products(query, min_price=0, max_price=9999):
    products = [
        {"name": "Laptop Pro", "price": 1299},
        {"name": "Wireless Mouse", "price": 29},
        {"name": "USB-C Hub", "price": 49},
    ]
    return [p for p in products
            if query.lower() in p["name"].lower()
            and min_price <= p["price"] <= max_price]

def run_agent(question):
    msgs = [{"role": "user", "content": question}]
    resp = client.chat.completions.create(
        model="gpt-4", messages=msgs, tools=tools)
    msg = resp.choices[0].message

    if msg.tool_calls:
        msgs.append(msg)
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = search_products(**args)
            msgs.append({"role": "tool", "tool_call_id": tc.id,
                         "content": json.dumps(result)})
        final = client.chat.completions.create(model="gpt-4", messages=msgs)
        return final.choices[0].message.content
    return msg.content

print(run_agent("Find laptops under $1500"))`,
  },
  {
    time: "Hour 6",
    title: "Structured Output & Guardrails",
    concept: [
      "**Structured output** forces the LLM to return valid JSON matching a specific schema. Instead of parsing free text, you get predictable, typed data. OpenAI's `response_format={\"type\": \"json_schema\", \"json_schema\": {...}}` guarantees valid JSON. Without this, you're string-parsing unreliable free text — fragile and error-prone.",
      "**Pydantic models** paired with structured output give you end-to-end type safety: define a Python class with typed fields → convert to JSON schema → LLM returns conforming JSON → parse into a Pydantic object. Any field missing or wrong type raises a validation error. This makes LLM outputs as reliable as API responses.",
      "**Guardrails** prevent harmful, off-topic, or incorrect outputs. Implement at multiple layers: **system prompt guardrails** ('Never reveal internal data, only answer about our products'), **output validation** (check the structured output meets business rules), **content filters** (OpenAI's moderation endpoint flags harmful content), and **PII detection** (regex or NER to catch leaked personal data).",
      "**Output validation patterns**: check that extracted entities exist in your database, verify numerical results are within expected ranges, ensure generated SQL is read-only (no DROP/DELETE), and validate that citations reference real documents. Never trust LLM output without validation — treat it like untrusted user input.",
    ],
    code: `# --- Structured Output with Pydantic ---
from openai import OpenAI
from pydantic import BaseModel, Field
import json

client = OpenAI()

class ExtractedContact(BaseModel):
    name: str = Field(description="Full name of the person")
    email: str | None = Field(description="Email address if mentioned")
    company: str | None = Field(description="Company name if mentioned")
    role: str | None = Field(description="Job title if mentioned")
    sentiment: str = Field(description="Overall sentiment: positive, neutral, or negative")

# Force JSON output matching our schema
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "contact_extraction",
            "schema": ExtractedContact.model_json_schema(),
        },
    },
    messages=[
        {"role": "system", "content": "Extract contact information from the text. Return JSON."},
        {"role": "user", "content": "Hi, I'm Sarah Chen, CTO at TechFlow Inc. "
         "Love your product! Reach me at sarah@techflow.com"},
    ],
)

# Parse into typed Pydantic object
contact = ExtractedContact.model_validate_json(response.choices[0].message.content)
print(f"Name: {contact.name}")       # Sarah Chen
print(f"Email: {contact.email}")     # sarah@techflow.com
print(f"Role: {contact.role}")       # CTO
print(f"Sentiment: {contact.sentiment}")  # positive

# --- Guardrails: Content moderation ---
def check_safety(text: str) -> bool:
    moderation = client.moderations.create(input=text)
    return not moderation.results[0].flagged

# --- Guardrails: Output validation ---
def validate_sql_output(sql: str) -> bool:
    dangerous = ["DROP", "DELETE", "TRUNCATE", "ALTER", "INSERT", "UPDATE"]
    sql_upper = sql.upper()
    for keyword in dangerous:
        if keyword in sql_upper:
            return False
    return True

# --- PII detection ---
import re

def detect_pii(text: str) -> list[str]:
    patterns = {
        "SSN": r"\\b\\d{3}-\\d{2}-\\d{4}\\b",
        "Email": r"\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b",
        "Phone": r"\\b\\d{3}[-.]\\d{3}[-.]\\d{4}\\b",
    }
    found = []
    for pii_type, pattern in patterns.items():
        if re.search(pattern, text):
            found.append(pii_type)
    return found`,
    practice: "Create a Pydantic model for a product review (product_name, rating 1-5, pros list, cons list, recommendation bool). Use structured output to extract review data from free text.",
    solution: `from openai import OpenAI
from pydantic import BaseModel, Field

client = OpenAI()

class ProductReview(BaseModel):
    product_name: str
    rating: int = Field(ge=1, le=5)
    pros: list[str]
    cons: list[str]
    recommendation: bool

response = client.chat.completions.create(
    model="gpt-4o",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "review",
            "schema": ProductReview.model_json_schema(),
        },
    },
    messages=[
        {"role": "system", "content": "Extract structured review data."},
        {"role": "user", "content": "The MacBook Pro M3 is amazing! "
         "Great battery life, beautiful display, and fast performance. "
         "A bit pricey though and only 2 USB-C ports. "
         "I'd rate it 4/5 and definitely recommend it."},
    ],
)

review = ProductReview.model_validate_json(
    response.choices[0].message.content)
print(f"{review.product_name}: {review.rating}/5")
print(f"Pros: {review.pros}")
print(f"Cons: {review.cons}")
print(f"Recommended: {review.recommendation}")`,
  },
  {
    time: "Hour 7",
    title: "LangChain & Agent Frameworks",
    concept: [
      "**LangChain** is a framework that simplifies building LLM applications by providing abstractions for chains (sequential LLM calls), agents (LLMs that decide which tools to use), memory (conversation history), and retrieval (RAG). It wraps multiple LLM providers and vector stores with a unified interface.",
      "**Chains** link multiple LLM calls or processing steps. A `SequentialChain` passes the output of one step as input to the next. Example: summarize a document → extract key entities → generate a report. **LCEL (LangChain Expression Language)** uses the `|` pipe operator: `prompt | llm | parser` creates a processing pipeline.",
      "**Agents** are LLMs that decide which tools to call and in what order. The agent receives a goal, reasons about which tool to use, executes it, observes the result, and repeats until the goal is achieved. This is the **ReAct pattern** (Reasoning + Acting). LangGraph extends this with stateful, graph-based agent workflows.",
      "**Memory** gives LLMs conversation context. `ConversationBufferMemory` stores all messages; `ConversationSummaryMemory` uses an LLM to summarize older messages (saves tokens); `ConversationBufferWindowMemory` keeps the last N messages. Memory is critical for chatbots and multi-turn interactions.",
    ],
    code: `# --- LangChain LCEL Pipeline ---
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4", temperature=0.3)

# Simple chain with LCEL pipe syntax
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a technical writer. Be concise."),
    ("user", "Explain {topic} in 3 bullet points."),
])

chain = prompt | llm | StrOutputParser()
result = chain.invoke({"topic": "microservices"})
print(result)

# --- RAG Chain with LangChain ---
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.runnables import RunnablePassthrough

# Build vector store
vectorstore = Chroma.from_texts(
    texts=["Python is great for AI", "Java powers enterprise apps", "Go is fast and concurrent"],
    embedding=OpenAIEmbeddings(),
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

# RAG chain
rag_prompt = ChatPromptTemplate.from_template(
    """Answer based only on this context:
{context}

Question: {question}"""
)

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)

answer = rag_chain.invoke("Which language is best for AI?")
print(answer)

# --- Agent with Tools ---
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.tools import tool

@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))

@tool
def search_docs(query: str) -> str:
    """Search internal documentation."""
    return "Our API rate limit is 1000 requests per minute."

agent_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant with access to tools."),
    ("user", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, [calculator, search_docs], agent_prompt)
executor = AgentExecutor(agent=agent, tools=[calculator, search_docs])

result = executor.invoke({"input": "What is 15% of 2400? Also what's our API rate limit?"})
print(result["output"])`,
    practice: "Build a LangChain agent with two tools: one that fetches user info from a mock database and one that calculates discounts. Ask the agent to find a user and calculate their loyalty discount.",
    solution: `from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool

llm = ChatOpenAI(model="gpt-4")

@tool
def get_user(user_id: str) -> str:
    """Look up user info by ID."""
    users = {"U001": {"name": "Alice", "tier": "gold", "total_spent": 5000}}
    user = users.get(user_id, None)
    return str(user) if user else "User not found"

@tool
def calc_discount(tier: str, amount: float) -> str:
    """Calculate discount based on loyalty tier and purchase amount."""
    rates = {"gold": 0.15, "silver": 0.10, "bronze": 0.05}
    discount = amount * rates.get(tier, 0)
    return f"Discount: \${discount:.2f} ({rates.get(tier, 0)*100}%)"

prompt = ChatPromptTemplate.from_messages([
    ("system", "Help users with account inquiries."),
    ("user", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, [get_user, calc_discount], prompt)
executor = AgentExecutor(agent=agent, tools=[get_user, calc_discount])
print(executor.invoke({"input": "Look up user U001 and calculate their discount on a $200 purchase"})["output"])`,
  },
  {
    time: "Hour 8",
    title: "Fine-Tuning, Evaluation & Production Patterns",
    concept: [
      "**Fine-tuning** adapts a pre-trained LLM to your specific domain or task. You provide training examples (prompt → ideal completion pairs), and the model adjusts its weights. Fine-tuning is best for: consistent output formatting, domain-specific terminology, specific tone/style, and reducing prompt length (behaviors are baked in instead of instructed). It's *not* for adding new knowledge — use RAG for that.",
      "**Evaluation (evals)** measures LLM quality systematically. Key metrics: **accuracy** (does the answer match ground truth?), **faithfulness** (does it stick to provided context in RAG?), **relevance** (is the answer on-topic?), **toxicity** (is the output safe?). Use frameworks like **RAGAS** for RAG evaluation and **LLM-as-judge** where GPT-4 scores other models' outputs.",
      "**Production patterns**: **Caching** — cache identical prompts to avoid redundant API calls (save 40%+ costs). **Rate limiting** — respect API quotas with exponential backoff. **Fallback chains** — if GPT-4 fails, fall back to GPT-3.5. **Observability** — log every prompt, response, latency, and token count. **Cost tracking** — monitor spend per feature/user.",
      "**Prompt versioning & testing**: treat prompts like code — version them, test them against a regression suite of expected inputs/outputs, and deploy them through CI/CD. A small prompt change can drastically alter behavior. Run evals on every prompt change before deploying to production.",
    ],
    code: `# --- Fine-tuning with OpenAI ---
from openai import OpenAI

client = OpenAI()

# Step 1: Prepare training data (JSONL format)
# {"messages": [{"role": "system", "content": "You classify support tickets."},
#               {"role": "user", "content": "My order hasn't arrived"},
#               {"role": "assistant", "content": "category: shipping, priority: high"}]}

# Step 2: Upload training file
# file = client.files.create(file=open("training.jsonl", "rb"), purpose="fine-tune")

# Step 3: Create fine-tuning job
# job = client.fine_tuning.jobs.create(
#     training_file=file.id,
#     model="gpt-4o-mini-2024-07-18",
#     hyperparameters={"n_epochs": 3},
# )

# Step 4: Use your fine-tuned model
# response = client.chat.completions.create(
#     model="ft:gpt-4o-mini:my-org::job-id",
#     messages=[{"role": "user", "content": "I was charged twice"}],
# )

# --- LLM-as-Judge Evaluation ---
def evaluate_response(question: str, response: str, reference: str) -> dict:
    eval_prompt = f"""Rate the following response on a scale of 1-5 for:
1. Accuracy (does it match the reference answer?)
2. Completeness (does it cover all key points?)
3. Clarity (is it well-written and clear?)

Question: {question}
Reference Answer: {reference}
Model Response: {response}

Return JSON: {{"accuracy": int, "completeness": int, "clarity": int, "reasoning": str}}"""

    result = client.chat.completions.create(
        model="gpt-4",
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": eval_prompt}],
    )
    return json.loads(result.choices[0].message.content)

# --- Production: Caching + Retry + Cost Tracking ---
import hashlib, json, time
from functools import lru_cache

class LLMClient:
    def __init__(self):
        self.client = OpenAI()
        self.cache = {}
        self.total_tokens = 0
        self.total_cost = 0.0

    def query(self, messages, model="gpt-4", temperature=0, **kwargs):
        # Cache check (only for deterministic queries)
        if temperature == 0:
            cache_key = hashlib.md5(json.dumps(messages).encode()).hexdigest()
            if cache_key in self.cache:
                print("[CACHE HIT]")
                return self.cache[cache_key]

        # Retry with exponential backoff
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=model, messages=messages,
                    temperature=temperature, **kwargs,
                )
                # Track costs
                usage = response.usage
                self.total_tokens += usage.total_tokens
                self.total_cost += (usage.prompt_tokens * 0.03 + usage.completion_tokens * 0.06) / 1000

                result = response.choices[0].message.content
                if temperature == 0:
                    self.cache[cache_key] = result
                return result

            except Exception as e:
                wait = 2 ** attempt
                print(f"Retry {attempt+1}/3 in {wait}s: {e}")
                time.sleep(wait)
        raise Exception("All retries failed")

    def get_stats(self):
        return {"total_tokens": self.total_tokens, "total_cost": f"\${self.total_cost:.4f}"}`,
    practice: "Build a production LLM client class with caching (hash-based), retry with exponential backoff, token counting, and cost tracking. Include a method to get usage stats.",
    solution: `import hashlib, json, time
from openai import OpenAI

class ProductionLLM:
    def __init__(self):
        self.client = OpenAI()
        self.cache = {}
        self.stats = {"calls": 0, "cache_hits": 0, "tokens": 0, "cost": 0.0}

    def ask(self, prompt, model="gpt-4", temp=0, max_retries=3):
        key = hashlib.md5(f"{model}:{prompt}".encode()).hexdigest()
        if temp == 0 and key in self.cache:
            self.stats["cache_hits"] += 1
            return self.cache[key]

        for i in range(max_retries):
            try:
                r = self.client.chat.completions.create(
                    model=model, temperature=temp,
                    messages=[{"role": "user", "content": prompt}])
                self.stats["calls"] += 1
                self.stats["tokens"] += r.usage.total_tokens
                answer = r.choices[0].message.content
                if temp == 0:
                    self.cache[key] = answer
                return answer
            except Exception as e:
                time.sleep(2 ** i)
        raise RuntimeError("Max retries exceeded")

    def report(self):
        return self.stats

llm = ProductionLLM()
print(llm.ask("What is 2+2?"))
print(llm.ask("What is 2+2?"))  # cache hit
print(llm.report())`,
  },
  {
    time: "Homework Project",
    title: "Build & Deploy a RAG Q&A Chatbot",
    concept: [
      "**Project Goal**: you will build a complete, working RAG (Retrieval-Augmented Generation) chatbot from scratch. When finished, you will have a REST API where you can upload any text document, then ask natural-language questions and get answers grounded in that document — with source citations. This is a real-world pattern used in enterprise knowledge bases, customer support bots, and internal documentation search.",
      "**Step 1 — Create the project folder.** Open your terminal and run: `mkdir rag-chatbot && cd rag-chatbot`. Create these files: `main.py`, `rag.py`, `models.py`, `requirements.txt`, `Dockerfile`, `docker-compose.yml`. This separation matters — `models.py` holds your Pydantic schemas (request/response shapes), `rag.py` holds all the RAG logic (chunking, embedding, retrieval, generation), and `main.py` is the thin FastAPI layer that exposes HTTP endpoints.",
      "**Step 2 — Install dependencies.** Create a virtual environment: `python -m venv .venv && source .venv/bin/activate` (Windows: `.venv\\\\Scripts\\\\activate`). Write your `requirements.txt` with exact versions (shown in the code below), then `pip install -r requirements.txt`. Key libraries: **FastAPI** (web framework), **uvicorn** (ASGI server), **openai** (GPT-4 + embeddings API), **chromadb** (vector database that runs locally — no server needed), **tiktoken** (counts tokens for chunking), **python-multipart** (handles file uploads in FastAPI).",
      "**Step 3 — Define request/response models in `models.py`.** Use Pydantic `BaseModel` to create `QuestionRequest` (fields: `question: str`, `top_k: int = 5`) and `AnswerResponse` (fields: `answer: str`, `sources: list[str]`, `tokens_used: int`). These enforce type validation on every API call — if someone sends `top_k: 'abc'`, FastAPI returns a 422 error automatically. This is how production APIs work.",
      "**Step 4 — Build the chunking function in `rag.py`.** Chunking is the most important decision in RAG. You need to split documents into overlapping pieces small enough for the embedding model (max 8191 tokens for `text-embedding-3-small`), but large enough to contain meaningful context. Use `tiktoken` to count tokens accurately. The `chunk_text()` function takes raw text, encodes it to tokens, then slides a window of 500 tokens with 50-token overlap. The overlap ensures no information is lost at chunk boundaries. Without overlap, a sentence split across two chunks would be unretrievable.",
      "**Step 5 — Build the ingestion function.** `ingest_document(filename, content)` calls `chunk_text()`, then stores the chunks in ChromaDB with `collection.add()`. ChromaDB automatically embeds the text using its default model, but we configure it with `cosine` similarity (best for text). Each chunk gets a unique ID (`filename_chunk_0`, `filename_chunk_1`, ...) and metadata (`source: filename`, `chunk: index`). The metadata is crucial — it's how we tell the user which document the answer came from.",
      "**Step 6 — Build the query function.** `query_rag(question, top_k=5)` is the heart of RAG. It embeds the question, searches ChromaDB for the top-5 most similar chunks, joins them into a context string separated by `---`, then calls GPT-4 with a system prompt that says 'Answer ONLY from the provided context. If the answer isn't there, say so.' This grounding prompt is critical — without it, GPT-4 will hallucinate answers using its training data instead of your documents. Set `temperature=0.2` for factual, consistent answers.",
      "**Step 7 — Wire up FastAPI endpoints in `main.py`.** Create three routes: `POST /upload` accepts a file upload, reads it, calls `rag.ingest_document()`, and returns the chunk count. `POST /ask` accepts a JSON body with `question` and `top_k`, calls `rag.query_rag()`, and returns the answer with sources. `GET /health` returns a simple status for load balancer health checks. Start the server with `uvicorn main:app --reload` and test immediately.",
      "**Step 8 — Test locally with curl.** First, create a sample document: `echo 'Our PTO policy allows 20 days per year...' > handbook.txt`. Upload it: `curl -X POST http://localhost:8000/upload -F 'file=@handbook.txt'`. Ask a question: `curl -X POST http://localhost:8000/ask -H 'Content-Type: application/json' -d '{\"question\": \"How many PTO days?\"}'`. You should see the answer citing `handbook.txt`. Try a question not in the document — the bot should say 'I don\\'t have information about that.'",
      "**Step 9 — Containerize with Docker.** Write a `Dockerfile`: use `python:3.12-slim` as base, copy `requirements.txt` first (Docker caches this layer), install deps, copy code, expose port 8000, run with `uvicorn`. Write `docker-compose.yml` to pass `OPENAI_API_KEY` as an environment variable and mount a volume for ChromaDB persistence. Run `docker-compose up --build` and test the same curl commands against port 8000.",
      "**Step 10 — Deploy to AWS.** Create an ECR repository: `aws ecr create-repository --repository-name rag-chatbot`. Build, tag, and push your image. For production, store `OPENAI_API_KEY` in AWS Secrets Manager, deploy on ECS Fargate with a task definition referencing the secret, and place an ALB in front for HTTPS. Alternatively, deploy on EKS with a Kubernetes Deployment and Service.",
    ],
    code: `# --- requirements.txt ---
# fastapi==0.109.0
# uvicorn==0.27.0
# openai==1.12.0
# chromadb==0.4.22
# python-multipart==0.0.6
# tiktoken==0.5.2

# --- models.py ---
from pydantic import BaseModel

class QuestionRequest(BaseModel):
    question: str
    top_k: int = 5

class AnswerResponse(BaseModel):
    answer: str
    sources: list[str]
    tokens_used: int

# --- rag.py ---
from openai import OpenAI
import chromadb
import tiktoken

client = OpenAI()
chroma = chromadb.PersistentClient(path="./data/chroma")

def get_or_create_collection(name="knowledge"):
    return chroma.get_or_create_collection(
        name=name, metadata={"hnsw:space": "cosine"}
    )

def chunk_text(text, chunk_size=500, overlap=50):
    enc = tiktoken.encoding_for_model("gpt-4")
    tokens = enc.encode(text)
    chunks = []
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk_tokens = tokens[i:i + chunk_size]
        chunks.append(enc.decode(chunk_tokens))
    return chunks

def ingest_document(filename, content):
    collection = get_or_create_collection()
    chunks = chunk_text(content)
    collection.add(
        documents=chunks,
        ids=[f"{filename}_chunk_{i}" for i in range(len(chunks))],
        metadatas=[{"source": filename, "chunk": i} for i in range(len(chunks))],
    )
    return len(chunks)

def query_rag(question, top_k=5):
    collection = get_or_create_collection()
    results = collection.query(query_texts=[question], n_results=top_k)
    context = "\\n\\n---\\n\\n".join(results["documents"][0])
    sources = [m["source"] for m in results["metadatas"][0]]

    response = client.chat.completions.create(
        model="gpt-4",
        temperature=0.2,
        messages=[
            {"role": "system", "content": """Answer questions using ONLY the provided context.
If the answer is not in the context, say "I don't have information about that."
Cite the source document for each claim."""},
            {"role": "user", "content": f"Context:\\n{context}\\n\\nQuestion: {question}"},
        ],
    )
    return {
        "answer": response.choices[0].message.content,
        "sources": list(set(sources)),
        "tokens_used": response.usage.total_tokens,
    }

# --- main.py ---
from fastapi import FastAPI, UploadFile, File
from models import QuestionRequest, AnswerResponse
import rag

app = FastAPI(title="RAG Q&A Chatbot")

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8")
    chunks = rag.ingest_document(file.filename, content)
    return {"filename": file.filename, "chunks_created": chunks}

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(req: QuestionRequest):
    result = rag.query_rag(req.question, req.top_k)
    return AnswerResponse(**result)

@app.get("/health")
async def health():
    return {"status": "healthy"}

# --- Dockerfile ---
# FROM python:3.12-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# EXPOSE 8000
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- docker-compose.yml ---
# services:
#   api:
#     build: .
#     ports: ["8000:8000"]
#     environment:
#       - OPENAI_API_KEY=\${OPENAI_API_KEY}
#     volumes:
#       - chroma_data:/app/data/chroma
# volumes:
#   chroma_data:

# --- Deploy commands ---
# docker build -t rag-chatbot .
# docker tag rag-chatbot:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/rag-chatbot:v1
# aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
# docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/rag-chatbot:v1`,
    practice: "Build the complete RAG chatbot: set up the project, implement document ingestion and query endpoints, containerize with Docker, and test locally with docker-compose. Upload a text file and ask questions about it.",
    solution: `# Full deployment checklist:
# 1. Create project directory with all files above
# 2. pip install -r requirements.txt
# 3. export OPENAI_API_KEY="sk-..."
# 4. uvicorn main:app --reload  (test locally)
# 5. curl -X POST http://localhost:8000/upload -F "file=@company_handbook.txt"
# 6. curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" \\
#      -d '{"question": "What is the PTO policy?"}'
# 7. docker-compose up --build  (test containerized)
# 8. Create ECR repo: aws ecr create-repository --repository-name rag-chatbot
# 9. Build, tag, push to ECR
# 10. Deploy on ECS Fargate or EKS with OPENAI_API_KEY from Secrets Manager
# 11. Verify: POST /upload and /ask on the deployed endpoint
# 12. Add CloudWatch logging and set up alarms for errors`,
  },
];
