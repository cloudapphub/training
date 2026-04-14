export const langgraphLessons = [
  {
    time: "Hour 1",
    title: "What Is LangGraph? — Graphs for AI Agents",
    concept: [
      "**LangGraph** is a Python framework by LangChain for building **stateful, multi-step AI workflows** as directed graphs. Instead of a single LLM call, you define a graph of **nodes** (actions) connected by **edges** (control flow). The graph keeps a **state** object that flows between nodes — each node reads the state, does work, and writes updates back.",
      "**Why graphs instead of chains?** LangChain's original `Chain` was linear — step A → step B → step C. Real AI agents need **loops** (retry until correct), **branches** (if tool needed, call tool; else respond), and **parallel execution** (run 3 LLM calls simultaneously). Graphs give you all of this with a clean, visual structure.",
      "**Core mental model:** Think of LangGraph like a flowchart. `START` is where execution begins. Each box is a **node** (a Python function). Arrows between boxes are **edges**. Some arrows are conditional — they check the state and decide which box to go to next. When execution reaches `END`, the graph returns the final state.",
      "**StateGraph** is the builder class you use to define the graph. You (1) define a `State` schema (the data structure flowing through the graph), (2) add nodes, (3) add edges, (4) call `.compile()` to get a runnable graph. The compiled graph supports `.invoke()` (get final result), `.stream()` (get updates after each node), and async variants.",
      "**Installation is simple:** `pip install langgraph`. For LLM integration you also want `langchain-openai` or `langchain-anthropic`. For production persistence: `langgraph-checkpoint-postgres`. For tracing/debugging: `langsmith`.",
      "**LangGraph vs other frameworks:** CrewAI and AutoGen are higher-level — they abstract away control flow. LangGraph is lower-level — you explicitly define every node, edge, and transition. This gives you **full control** over the agent's behavior, which matters for production systems where you need deterministic, auditable, testable workflows.",
    ],
    code: `# === Your First LangGraph — A Simple Two-Step Workflow ===
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

# Step 1: Define the state schema
class State(TypedDict):
    topic: str
    joke: str

# Step 2: Define node functions (they receive state, return updates)
def generate_joke(state: State) -> dict:
    """Node that generates a joke about the topic."""
    # In real code, you'd call an LLM here
    return {"joke": f"Why did the {state['topic']} cross the road?"}

# Step 3: Build the graph
builder = StateGraph(State)
builder.add_node("generate_joke", generate_joke)

# Step 4: Wire up edges
builder.add_edge(START, "generate_joke")    # Entry point
builder.add_edge("generate_joke", END)      # Exit point

# Step 5: Compile and run
graph = builder.compile()
result = graph.invoke({"topic": "chicken"})
print(result)
# {"topic": "chicken", "joke": "Why did the chicken cross the road?"}

# Visualize the graph (requires graphviz or use .get_graph().draw_mermaid())
print(graph.get_graph().draw_mermaid())`,
    practice: "Create a two-node graph: the first node takes a topic and generates a question, the second node takes the question and generates an answer. Wire them sequentially with START → node1 → node2 → END.",
    solution: `from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    topic: str
    question: str
    answer: str

def ask_question(state: State) -> dict:
    return {"question": f"What is interesting about {state['topic']}?"}

def give_answer(state: State) -> dict:
    return {"answer": f"Here's what's interesting about {state['topic']}: ..."}

builder = StateGraph(State)
builder.add_node("ask", ask_question)
builder.add_node("answer", give_answer)
builder.add_edge(START, "ask")
builder.add_edge("ask", "answer")
builder.add_edge("answer", END)
graph = builder.compile()

result = graph.invoke({"topic": "quantum computing"})
print(result["question"])   # "What is interesting about quantum computing?"
print(result["answer"])     # "Here's what's interesting about ..."`,
  },
  {
    time: "Hour 2",
    title: "State, Reducers & Schema Design",
    concept: [
      "**State is the heart of LangGraph.** It's a shared data structure (usually a `TypedDict` or Pydantic model) that every node reads from and writes to. When a node returns `{\"key\": \"value\"}`, that value is merged into the state. The next node sees the updated state. This is how information flows through the graph.",
      "**The default reducer is OVERWRITE.** If your state has `foo: int` and a node returns `{\"foo\": 2}`, the old value is replaced. This is fine for simple values like strings and numbers. But for lists (like chat messages), you usually want to **append**, not replace.",
      "**Annotated reducers** let you control HOW values merge. Using `Annotated[list[str], operator.add]`, you tell LangGraph to **concatenate** lists instead of replacing them. When a node returns `{\"messages\": [new_msg]}`, the new message is appended to the existing list rather than replacing it. This is critical for chat history.",
      "**MessagesState** is a built-in convenience. LangGraph provides `from langgraph.graph import MessagesState` — a pre-built state schema with a `messages` key that uses the `add_messages` reducer. This reducer handles appending, deduplication (by message ID), and even deletion. For most chatbot/agent use cases, start with `MessagesState`.",
      "**Input/Output schemas** let you separate what goes IN from what comes OUT. You can define `input_schema=InputState` and `output_schema=OutputState` when creating the `StateGraph`. The graph internally uses the full state, but only accepts `InputState` fields as input and only returns `OutputState` fields. This is like a function signature — clean API boundaries.",
      "**Private state** is state that exists only between specific nodes. If node_1 needs to pass data to node_2 that shouldn't be in the main state, you can use private channels. This keeps your main state clean and prevents accidental coupling between unrelated parts of the graph.",
    ],
    code: `# === Reducers: Overwrite vs Append ===
from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END

# WITHOUT reducer — list gets REPLACED
class BadState(TypedDict):
    items: list[str]       # Default: overwrite

# WITH reducer — list gets APPENDED
class GoodState(TypedDict):
    items: Annotated[list[str], add]   # add = concatenate lists

# === Demo: Append reducer in action ===
def node_a(state: GoodState) -> dict:
    return {"items": ["from_A"]}

def node_b(state: GoodState) -> dict:
    return {"items": ["from_B"]}

builder = StateGraph(GoodState)
builder.add_node("a", node_a)
builder.add_node("b", node_b)
builder.add_edge(START, "a")
builder.add_edge("a", "b")
builder.add_edge("b", END)
graph = builder.compile()

result = graph.invoke({"items": ["initial"]})
print(result["items"])
# ["initial", "from_A", "from_B"]  ← appended, not replaced!

# === MessagesState for Chat Applications ===
from langgraph.graph import MessagesState  # Pre-built state with messages reducer

class AgentState(MessagesState):
    """Extends MessagesState with extra fields."""
    tool_calls_count: int
    final_answer: str

# === Input/Output Schema Separation ===
class InputState(TypedDict):
    question: str

class OutputState(TypedDict):
    answer: str

class FullState(InputState, OutputState):
    intermediate_steps: list[str]   # Internal only

graph = StateGraph(FullState, input=InputState, output=OutputState)
# Caller sends: {"question": "..."}
# Caller gets:  {"answer": "..."}
# intermediate_steps is internal — never exposed`,
    practice: "Create a state with an Annotated list reducer. Build a graph where three parallel nodes each append their result to the same list. Verify the final list contains all three items.",
    solution: `from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    results: Annotated[list[str], add]

def researcher(state):
    return {"results": ["research_done"]}

def writer(state):
    return {"results": ["draft_written"]}

def reviewer(state):
    return {"results": ["review_complete"]}

builder = StateGraph(State)
builder.add_node("research", researcher)
builder.add_node("write", writer)
builder.add_node("review", reviewer)

# Fan out from START — all three run in parallel
builder.add_edge(START, "research")
builder.add_edge(START, "write")
builder.add_edge(START, "review")

# All converge to END
builder.add_edge("research", END)
builder.add_edge("write", END)
builder.add_edge("review", END)

graph = builder.compile()
result = graph.invoke({"results": []})
print(result["results"])
# ["research_done", "draft_written", "review_complete"]
# Order may vary since they run in parallel`,
  },
  {
    time: "Hour 3",
    title: "Edges, Conditional Routing & Branching",
    concept: [
      "**Normal edges** are fixed connections: `add_edge(\"node_a\", \"node_b\")` means after node_a finishes, ALWAYS go to node_b. Use these for sequential, deterministic flows (e.g., validate → process → save).",
      "**Conditional edges** are the core of agent intelligence. `add_conditional_edges(\"node_a\", router_function)` calls your `router_function` after node_a finishes. The function inspects the state and returns the **name of the next node** to execute. This is how agents decide: 'Should I call a tool or respond to the user?'",
      "**The router function** receives the current state and returns a string (node name) or a list of strings (for parallel fan-out). For example: if the LLM's response contains tool calls, route to `\"tool_node\"`; otherwise route to `END`. You can also return `[\"node_a\", \"node_b\"]` to fan out to multiple nodes.",
      "**Entry points and conditional entry.** `add_edge(START, \"first_node\")` sets a fixed entry. But `add_conditional_edges(START, router)` lets you dynamically choose the entry node based on input. For example, route to different processing pipelines based on the input type.",
      "**Multiple outgoing edges** create parallel branches. If you write `add_edge(START, \"a\")` AND `add_edge(START, \"b\")`, both nodes run simultaneously. LangGraph uses a **Pregel-style super-step** execution: all nodes in the same step run in parallel, and the system waits for ALL to finish before moving to the next step.",
      "**Recursion limit** prevents infinite loops. If your graph has cycles (e.g., agent → tool → agent → tool ...), you must set a recursion limit: `graph.invoke(input, config={\"recursion_limit\": 25})`. Default is 25. If the limit is hit, a `GraphRecursionError` is raised. Always set this to prevent runaway agents.",
    ],
    code: `# === Conditional Edge: Route Based on State ===
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    input: str
    classification: str
    result: str

def classify(state: State) -> dict:
    """Classify the input as a question or a command."""
    text = state["input"].lower()
    if "?" in text:
        return {"classification": "question"}
    return {"classification": "command"}

def handle_question(state: State) -> dict:
    return {"result": f"Answering your question: {state['input']}"}

def handle_command(state: State) -> dict:
    return {"result": f"Executing command: {state['input']}"}

# Router function — inspects state, returns next node name
def route_by_type(state: State) -> str:
    if state["classification"] == "question":
        return "handle_question"
    return "handle_command"

builder = StateGraph(State)
builder.add_node("classify", classify)
builder.add_node("handle_question", handle_question)
builder.add_node("handle_command", handle_command)

builder.add_edge(START, "classify")
builder.add_conditional_edges("classify", route_by_type)  # Dynamic routing!
builder.add_edge("handle_question", END)
builder.add_edge("handle_command", END)

graph = builder.compile()

# Question → routes to handle_question
print(graph.invoke({"input": "What is Python?"})["result"])
# "Answering your question: What is Python?"

# Command → routes to handle_command
print(graph.invoke({"input": "Deploy to production"})["result"])
# "Executing command: Deploy to production"`,
    practice: "Build a graph with three possible routes: 'easy', 'medium', 'hard'. A classifier node reads the input and a router function sends it to one of three handler nodes based on difficulty.",
    solution: `def classify(state):
    text = state["input"].lower()
    if "simple" in text:
        return {"difficulty": "easy"}
    elif "complex" in text:
        return {"difficulty": "hard"}
    return {"difficulty": "medium"}

def route(state):
    return f"handle_{state['difficulty']}"

def handle_easy(state):
    return {"result": "Handled with simple logic"}

def handle_medium(state):
    return {"result": "Handled with moderate logic"}

def handle_hard(state):
    return {"result": "Handled with advanced reasoning"}

builder = StateGraph(State)
builder.add_node("classify", classify)
builder.add_node("handle_easy", handle_easy)
builder.add_node("handle_medium", handle_medium)
builder.add_node("handle_hard", handle_hard)

builder.add_edge(START, "classify")
builder.add_conditional_edges("classify", route)
builder.add_edge("handle_easy", END)
builder.add_edge("handle_medium", END)
builder.add_edge("handle_hard", END)

graph = builder.compile()
print(graph.invoke({"input": "A simple math question"})["result"])
# "Handled with simple logic"`,
  },
  {
    time: "Hour 4",
    title: "Tool Calling & the ReAct Agent Loop",
    concept: [
      "**The ReAct pattern** (Reason + Act) is the most common agent architecture. The agent LLM decides whether to (1) call a tool to get more information, or (2) respond directly to the user. In LangGraph, this is a loop: `agent_node → [conditional: has tool calls?] → tool_node → agent_node → ... → END`.",
      "**LangChain tool integration** works seamlessly. Define tools with `@tool` decorator or as functions. Bind them to your LLM with `llm.bind_tools(tools)`. When the LLM decides to use a tool, it returns a message with `tool_calls` — structured JSON specifying which tool to call and with what arguments.",
      "**The ToolNode** is a built-in LangGraph utility: `from langgraph.prebuilt import ToolNode`. It automatically executes tool calls from the LLM's response and returns the results as `ToolMessage` objects. You don't need to write the tool execution logic yourself.",
      "**`create_react_agent`** is the ultimate shortcut. LangGraph provides a prebuilt function that creates a complete ReAct agent graph in one line: `graph = create_react_agent(model, tools)`. Under the hood, it creates the agent node, tool node, conditional routing, and the loop. Use this for prototyping; build custom graphs for production.",
      "**The agent loop works like this:** (1) Agent LLM receives the messages (including user question and any previous tool results). (2) LLM either returns a text response (→ END) or returns tool calls (→ tool_node). (3) ToolNode executes the tools and appends results to messages. (4) Control returns to the agent LLM with the new tool results. (5) Repeat until the LLM responds with text.",
      "**Why this matters:** The agent is not hardcoded to call specific tools in a specific order. The LLM **dynamically decides** based on the conversation. It might call one tool, see the result, decide it needs another tool, call that, and then finally respond. This is what makes it an 'agent' rather than a 'workflow'.",
    ],
    code: `# === Complete ReAct Agent with Tool Calling ===
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# Define tools
@tool
def search_web(query: str) -> str:
    """Search the web for current information."""
    return f"Search results for '{query}': AI is transforming industries..."

@tool
def calculate(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))  # In production, use a safe evaluator

# Create the agent (one line!)
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(llm, [search_web, calculate])

# Run it
result = agent.invoke({
    "messages": [("user", "What's 42 * 17 and what's the latest on AI?")]
})

# The agent will:
# 1. Call calculate("42 * 17") → "714"
# 2. Call search_web("latest AI news") → "Search results..."
# 3. Synthesize both results into a final answer

# === Building the Same Agent Manually (for understanding) ===
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition

llm_with_tools = ChatOpenAI(model="gpt-4o-mini").bind_tools([search_web, calculate])

def agent_node(state: MessagesState):
    """Call the LLM with the current messages."""
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

# Build the graph
builder = StateGraph(MessagesState)
builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode([search_web, calculate]))

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition)  # Built-in router!
# tools_condition checks: has tool_calls? → "tools" : END
builder.add_edge("tools", "agent")  # After tools, go back to agent

graph = builder.compile()`,
    practice: "Build a ReAct agent with two tools: a weather lookup and a unit converter. Ask it to find the weather in Tokyo and convert the temperature from Celsius to Fahrenheit.",
    solution: `from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

@tool
def get_weather(city: str) -> str:
    """Get current weather for a city."""
    # Simulated response
    return f"Weather in {city}: 22°C, partly cloudy"

@tool
def convert_temp(celsius: float) -> str:
    """Convert Celsius to Fahrenheit."""
    f = (celsius * 9/5) + 32
    return f"{celsius}°C = {f}°F"

llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(llm, [get_weather, convert_temp])

result = agent.invoke({
    "messages": [("user", "What's the weather in Tokyo? Convert the temp to Fahrenheit.")]
})

# Agent will:
# 1. Call get_weather("Tokyo") → "22°C, partly cloudy"
# 2. Call convert_temp(22.0) → "22°C = 71.6°F"
# 3. Respond: "The weather in Tokyo is 22°C (71.6°F), partly cloudy."
for msg in result["messages"]:
    print(f"{msg.type}: {msg.content}")`,
  },
  {
    time: "Hour 5",
    title: "Checkpointing, Memory & Persistence",
    concept: [
      "**Checkpointing** is LangGraph's superpower. When you compile a graph with a `checkpointer`, it automatically **saves the state after every node execution**. This enables pause/resume, fault recovery, time-travel debugging, and multi-turn conversations with memory.",
      "**MemorySaver** is the simplest checkpointer — stores state in memory. Great for development and testing but lost when the process restarts. For production, use **PostgresSaver** (`langgraph-checkpoint-postgres`) or **RedisSaver** — durable, shared across processes, and horizontally scalable.",
      "**Thread ID** is how LangGraph organizes conversations. When you call `graph.invoke(input, config={\"configurable\": {\"thread_id\": \"user-123\"}})`, the checkpointer saves state under that thread ID. The next call with the same thread_id **resumes from the last state** — the agent remembers the entire conversation history.",
      "**Every node execution creates a checkpoint.** If your graph has nodes A → B → C and the process crashes after B, you can resume from B's checkpoint. The state includes everything: messages, intermediate results, tool call history. This is automatic — you don't write any save/load code.",
      "**Time travel** lets you rewind to any checkpoint and branch from it. You can list all checkpoints with `graph.get_state_history(config)`, pick a past checkpoint, and invoke the graph from that point with different input. This is invaluable for debugging: 'What if the user had said X instead of Y at step 3?'",
      "**Cross-thread memory (Store)** goes beyond single conversations. The `BaseStore` abstraction lets you save information (user preferences, learned facts) that persists across ALL threads for a given user. Think of it as the agent's long-term memory, while thread checkpoints are short-term/conversation memory.",
    ],
    code: `# === Checkpointing with MemorySaver ===
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

def chatbot(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

# Compile WITH checkpointer — this enables memory!
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

# === Multi-Turn Conversation ===
config = {"configurable": {"thread_id": "user-alice-001"}}

# Turn 1
graph.invoke({"messages": [("user", "My name is Alice")]}, config)
# Turn 2 — the agent REMEMBERS Alice's name!
result = graph.invoke({"messages": [("user", "What's my name?")]}, config)
print(result["messages"][-1].content)
# "Your name is Alice!"  ← memory via checkpointing!

# === Time Travel: View Past States ===
for state in graph.get_state_history(config):
    print(f"Step: {state.metadata['step']}")
    print(f"Messages: {len(state.values['messages'])}")
    print("---")

# === Production: PostgresSaver ===
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
# async with AsyncPostgresSaver.from_conn_string(DATABASE_URL) as saver:
#     await saver.setup()  # Creates tables
#     graph = builder.compile(checkpointer=saver)`,
    practice: "Build a chatbot with MemorySaver. Have a 3-turn conversation. Then use get_state_history to list all checkpoints. Finally, rewind to the first checkpoint and branch with a different message.",
    solution: `from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain_openai import ChatOpenAI

memory = MemorySaver()
llm = ChatOpenAI(model="gpt-4o-mini")

def chatbot(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("bot", chatbot)
builder.add_edge(START, "bot")
builder.add_edge("bot", END)
graph = builder.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "test-thread"}}
graph.invoke({"messages": [("user", "I love Python")]}, config)
graph.invoke({"messages": [("user", "What language do I love?")]}, config)
graph.invoke({"messages": [("user", "Tell me a joke about it")]}, config)

# List all checkpoints
states = list(graph.get_state_history(config))
print(f"Total checkpoints: {len(states)}")

# Rewind to first checkpoint and branch
first_state = states[-1]
branched_config = {"configurable": {"thread_id": "test-branch",
    "checkpoint_id": first_state.config["configurable"]["checkpoint_id"]}}
graph.invoke({"messages": [("user", "Actually I love Rust!")]}, branched_config)`,
  },
  {
    time: "Hour 6",
    title: "Human-in-the-Loop & Interrupts",
    concept: [
      "**Human-in-the-Loop (HITL)** lets you pause a graph mid-execution so a human can review, approve, or modify the state before it continues. This is essential for high-stakes actions — you don't want an AI agent to send an email, make a purchase, or delete data without human approval.",
      "**`interrupt()`** is the function you call inside a node to pause execution. When the graph hits an interrupt, it saves the current state to the checkpointer and returns control to the caller. The human reviews the paused state and decides what to do next.",
      "**`interrupt_before` and `interrupt_after`** are compile-time options. Instead of calling `interrupt()` in your code, you can tell the compiler: 'always pause before node X' or 'always pause after node X'. Example: `graph = builder.compile(checkpointer=memory, interrupt_before=[\"send_email\"])` — the graph will always pause before executing the send_email node.",
      "**Resuming with `Command(resume=...)`** is how the human provides feedback. After reviewing the paused state, the human calls `graph.invoke(Command(resume=\"approved\"), config)` to continue. The `resume` value is passed to the node that was interrupted — it can be a simple 'yes/no' or a modified version of the proposed action.",
      "**Editing state before resuming:** You can also use `graph.update_state(config, new_values)` to directly modify the graph's state before resuming. For example, if the agent composed an email with the wrong recipient, the human fixes the recipient in the state, then resumes. The graph continues with the corrected state.",
      "**Common HITL patterns:** (1) **Approval gate** — pause before any destructive action. (2) **Review and edit** — let human modify agent output before it's sent. (3) **Multi-step approval** — different humans approve different steps in a pipeline. (4) **Escalation** — if the agent is unsure, pause and ask a human expert.",
    ],
    code: `# === Human-in-the-Loop with interrupt_before ===
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

class State(MessagesState):
    email_draft: str
    approved: bool

def draft_email(state):
    """Agent drafts an email."""
    return {"email_draft": "Subject: Q3 Report\\n\\nDear team, ..."}

def human_review(state):
    """Pause here for human approval."""
    decision = interrupt(  # ← PAUSE! Returns control to human
        {"draft": state["email_draft"], "question": "Send this email?"}
    )
    # When resumed, 'decision' contains the human's response
    return {"approved": decision == "yes"}

def send_email(state):
    if state["approved"]:
        return {"messages": [("assistant", "Email sent!")]}
    return {"messages": [("assistant", "Email cancelled by human.")]}

builder = StateGraph(State)
builder.add_node("draft", draft_email)
builder.add_node("review", human_review)
builder.add_node("send", send_email)
builder.add_edge(START, "draft")
builder.add_edge("draft", "review")
builder.add_edge("review", "send")
builder.add_edge("send", END)

memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

# Step 1: Run until interrupt
config = {"configurable": {"thread_id": "email-001"}}
result = graph.invoke({"messages": []}, config)
# Graph pauses at human_review node  ← PAUSED!

# Step 2: Human reviews the draft (shown in UI)
state = graph.get_state(config)
print(state.tasks)  # Shows the interrupt payload

# Step 3: Human approves and resumes
graph.invoke(Command(resume="yes"), config)
# → "Email sent!"

# OR: Human rejects
# graph.invoke(Command(resume="no"), config)
# → "Email cancelled by human."`,
    practice: "Build a graph where an agent proposes a database query. Use interrupt_before to pause before the 'execute_query' node. View the paused state, then resume with approval.",
    solution: `from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict

class State(TypedDict):
    question: str
    sql_query: str
    result: str

def generate_query(state):
    return {"sql_query": f"SELECT * FROM users WHERE name = '{state['question']}'"}

def execute_query(state):
    return {"result": f"Executed: {state['sql_query']} → 42 rows"}

builder = StateGraph(State)
builder.add_node("generate", generate_query)
builder.add_node("execute", execute_query)
builder.add_edge(START, "generate")
builder.add_edge("generate", "execute")
builder.add_edge("execute", END)

memory = MemorySaver()
graph = builder.compile(checkpointer=memory, interrupt_before=["execute"])

config = {"configurable": {"thread_id": "sql-1"}}
graph.invoke({"question": "Alice"}, config)
# PAUSED before execute!

state = graph.get_state(config)
print(f"Proposed query: {state.values['sql_query']}")

# Human approves → resume (just invoke with None)
graph.invoke(None, config)
print(graph.get_state(config).values["result"])`,
  },
  {
    time: "Hour 7",
    title: "Streaming — Real-Time Agent Output",
    concept: [
      "**Streaming** is critical for user experience. Without streaming, the user stares at a blank screen while the agent works. With streaming, they see progress in real-time — tokens appearing as the LLM generates them, status updates as tools execute, and state changes after each node.",
      "**LangGraph supports 5 streaming modes** via the `stream_mode` parameter: (1) `\"values\"` — streams the FULL state after each node completes. (2) `\"updates\"` — streams only the CHANGES (deltas) made by each node. (3) `\"messages\"` — streams individual LLM tokens as they're generated. (4) `\"custom\"` — lets you emit custom data from inside nodes. (5) `\"events\"` — streams everything including internal LangChain events.",
      "**`stream_mode=\"updates\"`** is the most common for debugging. For each node, you get a dict `{node_name: state_update}`. This tells you exactly what changed at each step without seeing the entire accumulated state.",
      "**`stream_mode=\"messages\"`** is what you want for chat UIs. It streams the LLM's response token-by-token, giving chatbots the 'typing' effect. Each chunk includes the token text, the node it came from, and metadata.",
      "**Multiple stream modes** can be combined: `stream_mode=[\"updates\", \"messages\"]`. You get both node-level updates AND token-by-token LLM output in a single stream. Each event is tagged with its mode so you can route them to different UI components.",
      "**Async streaming** with `astream()` and `astream_events()` is the production pattern. Use `async for event in graph.astream(input, config)` in your FastAPI/Starlette endpoint to push events via Server-Sent Events (SSE) or WebSockets to the frontend.",
    ],
    code: `# === Streaming Modes ===
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)

def chatbot(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("bot", chatbot)
builder.add_edge(START, "bot")
builder.add_edge("bot", END)
graph = builder.compile()

input_msg = {"messages": [("user", "Tell me about Python")]}

# --- Mode 1: "values" — full state after each step ---
for state in graph.stream(input_msg, stream_mode="values"):
    print(f"Messages count: {len(state['messages'])}")

# --- Mode 2: "updates" — only what changed ---
for node_name, update in graph.stream(input_msg, stream_mode="updates"):
    print(f"Node '{node_name}' produced: {update}")

# --- Mode 3: "messages" — token-by-token LLM output ---
for msg_chunk, metadata in graph.stream(input_msg, stream_mode="messages"):
    if msg_chunk.content:  # Skip empty chunks
        print(msg_chunk.content, end="", flush=True)
    # metadata includes: langgraph_node, langgraph_step, etc.

# --- Mode 4: Multiple modes at once ---
for event in graph.stream(input_msg, stream_mode=["updates", "messages"]):
    mode = event[0]  # "updates" or "messages"
    data = event[1]
    if mode == "messages":
        print(data[0].content, end="")
    else:
        print(f"\\nNode update: {data}")

# --- Async streaming for production APIs ---
# from fastapi import FastAPI
# from fastapi.responses import StreamingResponse
#
# app = FastAPI()
#
# @app.post("/chat")
# async def chat(question: str):
#     async def event_stream():
#         async for chunk, meta in graph.astream(
#             {"messages": [("user", question)]},
#             stream_mode="messages"
#         ):
#             if chunk.content:
#                 yield f"data: {chunk.content}\\n\\n"
#     return StreamingResponse(event_stream(), media_type="text/event-stream")`,
    practice: "Build a graph and stream it in 'updates' mode. Print the node name and the keys it modified at each step. Then switch to 'messages' mode and print tokens as they arrive.",
    solution: `from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class State(TypedDict):
    input: str
    step1_result: str
    step2_result: str

def step1(state):
    return {"step1_result": f"Processed: {state['input']}"}

def step2(state):
    return {"step2_result": f"Final: {state['step1_result']}!"}

builder = StateGraph(State)
builder.add_node("step1", step1)
builder.add_node("step2", step2)
builder.add_edge(START, "step1")
builder.add_edge("step1", "step2")
builder.add_edge("step2", END)
graph = builder.compile()

# Stream updates — see what each node produces
for chunk in graph.stream({"input": "hello"}, stream_mode="updates"):
    for node_name, update in chunk.items():
        print(f"Node '{node_name}' modified keys: {list(update.keys())}")
        # Node 'step1' modified keys: ['step1_result']
        # Node 'step2' modified keys: ['step2_result']`,
  },
  {
    time: "Hour 8",
    title: "Error Handling, Retries & Failure Recovery",
    concept: [
      "**Production agents WILL fail.** LLMs hallucinate, APIs timeout, rate limits are hit, and tools return unexpected data. LangGraph provides structured mechanisms to handle these failures gracefully instead of crashing your entire workflow.",
      "**RetryPolicy** is the primary defense against transient errors. Attach it to a node: `builder.add_node(\"api_call\", call_api, retry=RetryPolicy(max_attempts=3))`. If the node raises an exception, LangGraph automatically retries it with exponential backoff. You can specify which exception types to retry on: `retry_on=(TimeoutError, ConnectionError)`.",
      "**When retries are exhausted**, the node raises the exception and the graph halts. To handle this gracefully, use one of these patterns: (1) **Try-except inside the node** — catch errors and return structured error state. (2) **Conditional edges to error handler** — route to a recovery node based on error state. (3) **Graceful degradation** — fall back to a simpler model or cached response.",
      "**State-driven error tracking** is a best practice. Add an `errors` field to your state (e.g., `errors: Annotated[list[str], add]`). When a node fails, append the error details. Downstream nodes can check this field and adapt — skip optional steps, switch to fallback logic, or alert the human.",
      "**Recursive loops need protection.** An agent stuck in a tool-calling loop can burn through API credits and never respond. Always set `recursion_limit` (default 25). For production, also add **step counting** in your state and a conditional edge that forces exit after N iterations.",
      "**Parallel node failures:** When nodes run in parallel (same super-step), if ONE node raises an un-retried exception, LangGraph **cancels all other parallel nodes** and re-raises the error. Use `RetryPolicy` on individual parallel nodes to give them a chance to recover. For critical workflows, wrap each parallel node in try-except to prevent one failure from killing the entire batch.",
    ],
    code: `# === RetryPolicy for Transient Failures ===
from langgraph.graph import StateGraph, START, END
from langgraph.pregel import RetryPolicy
from typing_extensions import TypedDict
import random

class State(TypedDict):
    query: str
    result: str
    error: str

def flaky_api_call(state: State) -> dict:
    """Simulates an API that fails 50% of the time."""
    if random.random() < 0.5:
        raise ConnectionError("API timeout!")  # Transient error
    return {"result": f"Success for: {state['query']}"}

# Attach retry policy — 3 attempts with backoff
builder = StateGraph(State)
builder.add_node(
    "api_call",
    flaky_api_call,
    retry=RetryPolicy(max_attempts=3)  # Auto-retry on any exception
)
builder.add_edge(START, "api_call")
builder.add_edge("api_call", END)
graph = builder.compile()

# === Try-Except Pattern for Graceful Handling ===
def safe_api_call(state: State) -> dict:
    """Catches errors and returns structured failure state."""
    try:
        # Simulate API call
        if random.random() < 0.3:
            raise TimeoutError("Service unavailable")
        return {"result": "API response data", "error": ""}
    except Exception as e:
        return {"result": "", "error": f"Failed: {str(e)}"}

def handle_result(state: State) -> dict:
    """Route based on success or failure."""
    if state["error"]:
        return {"result": f"FALLBACK: Using cached data (error was: {state['error']})"}
    return {"result": f"FINAL: {state['result']}"}

# === Recursion Safety for Agent Loops ===
from langgraph.errors import GraphRecursionError

config = {"recursion_limit": 10}  # Max 10 loops
try:
    result = graph.invoke({"query": "test"}, config)
except GraphRecursionError:
    print("Agent exceeded max iterations — forced stop")

# === Step Counting in State for Custom Limits ===
# class AgentState(TypedDict):
#     messages: list
#     step_count: int
#
# def agent(state):
#     if state["step_count"] >= 5:
#         return {"messages": ["Stopping after 5 steps"]}
#     state["step_count"] += 1
#     ...  # normal agent logic`,
    practice: "Build a graph with a node that fails randomly. Add RetryPolicy with 3 attempts. Also add a fallback path using try-except that returns cached data when the API is down.",
    solution: `from langgraph.graph import StateGraph, START, END
from langgraph.pregel import RetryPolicy
from typing_extensions import TypedDict
import random

class State(TypedDict):
    input: str
    result: str
    used_fallback: bool

def unreliable_node(state):
    if random.random() < 0.7:
        raise ConnectionError("Service down!")
    return {"result": "Live API response", "used_fallback": False}

def fallback_node(state):
    return {"result": "Cached fallback response", "used_fallback": True}

def try_with_fallback(state):
    try:
        if random.random() < 0.7:
            raise ConnectionError("Timeout")
        return {"result": "Live data", "used_fallback": False}
    except ConnectionError:
        return {"result": "Cached data", "used_fallback": True}

builder = StateGraph(State)
builder.add_node("fetch", try_with_fallback)
builder.add_edge(START, "fetch")
builder.add_edge("fetch", END)
graph = builder.compile()

result = graph.invoke({"input": "test"})
print(f"Result: {result['result']}")
print(f"Used fallback: {result['used_fallback']}")`,
  },
  {
    time: "Hour 9",
    title: "Subgraphs, Send, Command & Map-Reduce",
    concept: [
      "**Subgraphs** let you compose complex workflows from smaller, reusable graphs. A subgraph is a fully compiled `StateGraph` that you add as a node in a parent graph: `parent.add_node(\"research_team\", research_subgraph)`. The subgraph runs as a self-contained unit — with its own nodes, edges, and even its own state schema.",
      "**Why subgraphs?** (1) **Modularity** — develop and test each sub-workflow independently. (2) **Reusability** — the same 'research agent' subgraph can be used by multiple parent graphs. (3) **Encapsulation** — the parent only sees the subgraph's input/output schema, not its internal complexity. (4) **Team collaboration** — different developers can own different subgraphs.",
      "**The `Send` API** enables dynamic fan-out (map-reduce). When you don't know at design time how many parallel tasks you'll need, `Send` lets you dynamically create them at runtime. A conditional edge returns a list of `Send(target_node, input_state)` objects — LangGraph spawns one instance of the target node per Send, each with its own input.",
      "**Map-Reduce pattern:** (1) **Orchestrator node** analyzes the input and decomposes it into subtasks. (2) **Conditional edge** returns `[Send(\"worker\", subtask) for subtask in tasks]`. (3) **Worker nodes** run in parallel, each processing one subtask. (4) Worker results are aggregated via a **reducer** on the state key. (5) **Aggregator node** combines all worker outputs into the final result.",
      "**The `Command` API** combines state updates with control flow in a single atomic operation. Instead of returning a state dict and relying on edges, a node can return `Command(update={\"key\": \"value\"}, goto=\"next_node\")`. This is powerful for: navigating from subgraphs to parent graphs (`graph=Command.PARENT`), resuming after interrupts (`resume=\"value\"`), and complex multi-target routing.",
      "**Practical pattern — Orchestrator-Worker:** An LLM-powered orchestrator analyzes a user request (e.g., 'Research quantum computing'), decomposes it into subtopics, dispatches each subtopic to a worker agent via `Send`, workers research in parallel, and the orchestrator synthesizes all worker results into a final report. This is the standard multi-agent architecture.",
    ],
    code: `# === Map-Reduce with Send API ===
from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

class OverallState(TypedDict):
    topics: list[str]
    jokes: Annotated[list[str], add]  # Reducer: append results

class WorkerState(TypedDict):
    topic: str   # Each worker gets ONE topic

def orchestrator(state: OverallState):
    """Analyzes input — nothing to return, routing handled by Send."""
    return {}  # Topics already in state

def generate_joke(state: WorkerState):
    """Worker: generates a joke for one topic."""
    return {"jokes": [f"Why did the {state['topic']} go to school? To get smarter!"]}

def synthesize(state: OverallState):
    """Aggregator: combines all jokes."""
    return {"jokes": state["jokes"]}  # Already aggregated by reducer

# Dynamic fan-out: create one Send per topic
def route_to_workers(state: OverallState):
    return [Send("joke_worker", {"topic": t}) for t in state["topics"]]

builder = StateGraph(OverallState)
builder.add_node("orchestrator", orchestrator)
builder.add_node("joke_worker", generate_joke)
builder.add_node("synthesize", synthesize)

builder.add_edge(START, "orchestrator")
builder.add_conditional_edges("orchestrator", route_to_workers)
builder.add_edge("joke_worker", "synthesize")
builder.add_edge("synthesize", END)
graph = builder.compile()

result = graph.invoke({"topics": ["cats", "dogs", "birds"], "jokes": []})
print(result["jokes"])
# 3 jokes — one per topic, generated in parallel!

# === Command API: Combined State Update + Routing ===
from langgraph.types import Command

def smart_node(state):
    """Update state AND control routing in one step."""
    if state["input"] == "urgent":
        return Command(
            update={"priority": "high"},
            goto="fast_track"          # Jump to specific node
        )
    return Command(
        update={"priority": "normal"},
        goto="standard_queue"
    )

# === Subgraph as a Node ===
# research_subgraph = build_research_graph()  # Returns compiled graph
# parent_builder.add_node("research", research_subgraph)
# parent_builder.add_edge("plan", "research")
# parent_builder.add_edge("research", "report")`,
    practice: "Build a map-reduce graph: an orchestrator takes a list of cities, fans out to worker nodes via Send, each worker 'looks up' the population, and an aggregator collects all results.",
    solution: `from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

class MainState(TypedDict):
    cities: list[str]
    populations: Annotated[list[str], add]

class CityState(TypedDict):
    city: str

def plan(state: MainState):
    return {}  # Cities already in state

def lookup_population(state: CityState):
    fake_data = {"NYC": "8.3M", "London": "8.8M", "Tokyo": "13.9M"}
    pop = fake_data.get(state["city"], "Unknown")
    return {"populations": [f"{state['city']}: {pop}"]}

def report(state: MainState):
    return {}  # Populations already aggregated by reducer

def fan_out(state: MainState):
    return [Send("lookup", {"city": c}) for c in state["cities"]]

builder = StateGraph(MainState)
builder.add_node("plan", plan)
builder.add_node("lookup", lookup_population)
builder.add_node("report", report)
builder.add_edge(START, "plan")
builder.add_conditional_edges("plan", fan_out)
builder.add_edge("lookup", "report")
builder.add_edge("report", END)
graph = builder.compile()

result = graph.invoke({"cities": ["NYC", "London", "Tokyo"], "populations": []})
for p in result["populations"]:
    print(p)
# NYC: 8.3M
# London: 8.8M
# Tokyo: 13.9M`,
  },
  {
    time: "Hour 10",
    title: "Production Patterns & Deployment",
    concept: [
      "**Workflow patterns** codify common agent architectures. (1) **Prompt chaining** — sequential LLM calls where each refines the previous output. (2) **Routing** — classify input and dispatch to specialized handlers. (3) **Parallelization** — fan out to multiple workers, aggregate results. (4) **Orchestrator-Worker** — LLM-driven task decomposition with dynamic workers. (5) **Evaluator-Optimizer** — generate → evaluate → regenerate loop until quality threshold met.",
      "**The Evaluator-Optimizer loop** is powerful for quality control. An LLM generates output, a separate evaluator LLM scores it, and if the score is below threshold, the generator gets the feedback and tries again. In LangGraph: `generator_node → evaluator_node → [conditional: score >= threshold?] → END or → generator_node`. Set a recursion limit to prevent infinite refinement.",
      "**Production checkpointing** uses PostgresSaver or RedisSaver. Configure with async for non-blocking I/O: `AsyncPostgresSaver.from_conn_string(DB_URL)`. Call `await saver.setup()` once to create tables. Each thread gets its own row-level isolation. For high-throughput, use connection pooling and consider partitioning by `thread_id`.",
      "**LangGraph Platform** is the managed deployment option. It provides a REST API server, a task queue for long-running agents, cron jobs for scheduled workflows, and built-in streaming. Deploy with `langgraph deploy` or as a Docker container. The LangGraph Studio IDE lets you visually debug running graphs with step-through execution.",
      "**Observability with LangSmith** is non-negotiable for production. Set `LANGSMITH_API_KEY` and `LANGSMITH_TRACING=true` — every graph execution is automatically traced: which nodes ran, what the LLM saw, how long each step took, what tools returned. LangSmith traces are the 'X-ray' of your agent's decision-making process.",
      "**Production checklist:** (1) Use Pydantic for state validation (catch bad data early). (2) Set `recursion_limit` on every graph with cycles. (3) Add `RetryPolicy` for external API calls. (4) Use `interrupt_before` for destructive actions. (5) Stream responses for UX. (6) Use PostgresSaver for persistence. (7) Add LangSmith tracing. (8) Test with unit tests — graph nodes are just functions. (9) Set `max_concurrency` for rate-limited APIs. (10) Monitor token usage and costs via LangSmith.",
    ],
    code: `# === Pattern: Evaluator-Optimizer Loop ===
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain_openai import ChatOpenAI

class EvalState(MessagesState):
    draft: str
    score: float
    feedback: str
    attempts: int

llm = ChatOpenAI(model="gpt-4o-mini")

def generate(state: EvalState):
    if state.get("feedback"):
        prompt = f"Improve this based on feedback: {state['feedback']}\\n\\nDraft: {state['draft']}"
    else:
        prompt = f"Write an essay about: {state['messages'][-1].content}"
    response = llm.invoke(prompt)
    return {"draft": response.content, "attempts": state.get("attempts", 0) + 1}

def evaluate(state: EvalState):
    eval_prompt = f"Score this 0-10 and give feedback:\\n{state['draft']}"
    response = llm.invoke(eval_prompt)
    # Parse score from response (simplified)
    return {"score": 7.5, "feedback": response.content}

def should_continue(state: EvalState):
    if state["score"] >= 8.0 or state["attempts"] >= 3:
        return END
    return "generate"  # Try again with feedback

builder = StateGraph(EvalState)
builder.add_node("generate", generate)
builder.add_node("evaluate", evaluate)
builder.add_edge(START, "generate")
builder.add_edge("generate", "evaluate")
builder.add_conditional_edges("evaluate", should_continue)
graph = builder.compile()

# === Production PostgresSaver ===
# import asyncio
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
#
# async def main():
#     DB_URL = "postgresql://user:pass@localhost:5432/langgraph"
#     async with AsyncPostgresSaver.from_conn_string(DB_URL) as saver:
#         await saver.setup()  # Create checkpoint tables
#         graph = builder.compile(checkpointer=saver)
#         config = {"configurable": {"thread_id": "prod-001"}}
#         result = await graph.ainvoke({"messages": [...]}, config)

# === LangSmith Tracing (just set env vars) ===
# export LANGSMITH_API_KEY="ls-..."
# export LANGSMITH_TRACING=true
# export LANGSMITH_PROJECT="my-agent-v2"
# → Every graph.invoke() is automatically traced!

# === Production Deployment with Docker ===
# Dockerfile:
# FROM python:3.12-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# COPY . .
# CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# === Unit Testing Graph Nodes ===
# Nodes are just functions — test them directly!
# def test_classify_node():
#     state = {"input": "What is Python?"}
#     result = classify(state)
#     assert result["classification"] == "question"`,
    practice: "Build an evaluator-optimizer loop: a generator writes a haiku, an evaluator checks if it has the correct 5-7-5 syllable pattern, and the graph loops until the evaluator approves (max 3 attempts).",
    solution: `from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class State(TypedDict):
    topic: str
    haiku: str
    is_valid: bool
    attempts: int
    feedback: str

def write_haiku(state):
    attempts = state.get("attempts", 0) + 1
    # Simulated haiku generation (in real code, use LLM)
    haikus = [
        "Code flows like water / Bugs hiding in every line / Debug saves the day",
        "Python is so great / Indentation matters here / Spaces not tabs please",
        "Autumn leaves falling / Golden light through forest trees / Peace in every breath",
    ]
    idx = min(attempts - 1, len(haikus) - 1)
    return {"haiku": haikus[idx], "attempts": attempts}

def evaluate_haiku(state):
    # Check 5-7-5 pattern (simplified)
    lines = state["haiku"].split(" / ")
    is_valid = len(lines) == 3
    feedback = "Valid haiku!" if is_valid else "Must have 3 lines (5-7-5)"
    return {"is_valid": is_valid, "feedback": feedback}

def should_retry(state):
    if state["is_valid"] or state["attempts"] >= 3:
        return END
    return "write"

builder = StateGraph(State)
builder.add_node("write", write_haiku)
builder.add_node("evaluate", evaluate_haiku)
builder.add_edge(START, "write")
builder.add_edge("write", "evaluate")
builder.add_conditional_edges("evaluate", should_retry)
graph = builder.compile()

result = graph.invoke({"topic": "python", "attempts": 0})
print(f"Final haiku: {result['haiku']}")
print(f"Valid: {result['is_valid']}, Attempts: {result['attempts']}")`,
  },
];
