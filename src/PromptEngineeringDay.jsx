import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft } from "lucide-react";

const lessons = [
  {
    time: "Hour 1",
    title: "The Anatomy of a Prompt",
    concept: [
      "Before technique, understand the instrument. An LLM is a probability machine dressed as a conversationalist.",
      "A language model does not 'understand' your request the way a colleague does. It reads your prompt as a sequence of tokens and predicts what tokens should come next, one at a time, based on patterns from training. Everything you write — instructions, context, examples, even stray typos — becomes part of that conditioning. This is why prompt structure matters so much: you are not asking a question, you are setting up a statistical continuation.",
      "A well-built prompt has four distinct parts: the **instruction** (what to do), the **context** (background the model needs), the **input** (the specific thing to act on), and the **output specification** (the shape of the answer). Name them in your head every time you write a prompt.",
      "**Why models 'hallucinate':** the word really means the model is generating plausible-sounding continuations that aren't grounded in fact. It's not lying — it's pattern-matching. Your job is to constrain the patterns.",
    ],
    code: `# The four parts of a well-structured prompt
prompt = """
# INSTRUCTION
Summarize the article below for a busy executive.

# CONTEXT
The reader has 30 seconds and cares only about financial impact.

# INPUT
\\"\\"\\"
{article_text}
\\"\\"\\"

# OUTPUT FORMAT
- 3 bullet points, max 15 words each
- Start each bullet with a dollar figure if possible
"""

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=300,
    messages=[{"role": "user", "content": prompt}],
)`,
    practice:
      "Take a vague question you'd normally ask an LLM and rewrite it with explicit audience, length, and focus.",
    solution: `# Weak prompt:
"Tell me about dogs."

# Stronger prompt:
"Write a 150-word overview of golden retrievers for a first-time
dog owner. Focus on temperament, exercise needs, and common
health issues."

# Why it's better: names the audience (first-time owner),
# quantifies length (150 words), and specifies focus areas.`,
  },
  {
    time: "Hour 2",
    title: "Clarity as a Superpower",
    concept: [
      "Ambiguity is the tax you pay on every unclear prompt. Pay it once, upfront.",
      "Most bad output is not a model failure — it is an under-specified prompt. When you say 'short', the model has to guess: three sentences? three paragraphs? three words? It will guess wrong about a third of the time.",
      "**Name the deliverable first, constraints second.** Prefer **positive instructions** over negative ones — negatives force the model to first imagine the forbidden thing, which often leaks into the output.",
      "**Quantify whenever possible** — 'short' is not a length. Treat your prompt like a legal contract: every adjective should be measurable, every requirement should be testable.",
    ],
    code: `# Vague — model has to guess
vague = "Write a short, friendly product description for our new water bottle."

# Specific — every requirement is measurable
specific = """
Write a product description for a 32oz insulated steel water bottle.

Requirements:
- Exactly 3 sentences
- Tone: friendly but not cutesy (no exclamation marks)
- Mention: 24hr cold retention, BPA-free, dishwasher-safe
- End with a sentence that creates mild urgency
- Reading level: 8th grade
"""`,
    practice:
      "Find three 'don'ts' in a prompt you've written and convert each into a 'do'.",
    solution: `# Before (negative):
"Don't make the email too long or too formal."

# After (positive):
"Write a 4-sentence email in a warm, professional tone
confirming tomorrow's 3pm meeting."

# Rule: replace every "don't" with a measurable "do".`,
  },
  {
    time: "Hour 3",
    title: "Role, Context, Audience",
    concept: [
      "You are not prompting a person. You are configuring a persona. Give it a stage.",
      "Assigning a role ('You are a senior tax accountant...') does two things: it **narrows the model's vocabulary and reasoning style** toward that domain, and it sets an implicit standard of care.",
      "But a role alone is not enough — you also need to **name the audience**, because the same expert speaks very differently to a child, a peer, or a skeptical boss.",
      "The combination of **role + audience + context** is what produces output that feels authored rather than generic. A useful mental model: you are casting an actor, seating an audience, and handing over a script direction, all in the first three lines of your prompt.",
    ],
    code: `# Use a system prompt for role + a user message for the task
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=500,
    system=(
        "You are a senior UX researcher with 15 years of experience "
        "in fintech. You write for product managers who are smart but "
        "not research-trained. You favor concrete examples over jargon."
    ),
    messages=[{
        "role": "user",
        "content": "Review this onboarding flow and flag the top 3 friction points:\\n\\n{flow}",
    }],
)`,
    practice:
      "Rewrite the same prompt three times for three different audiences: child, peer, expert.",
    solution: `# For a child:
"You are a friendly science teacher. Explain quantum
entanglement to a curious 10-year-old using a fun analogy."

# For a peer:
"You are a physics professor. Give a concise, technical
explanation of quantum entanglement for a fellow physicist."

# For an expert:
"You are a quantum information theorist. Critique the common
'spooky action at a distance' framing and propose a more
accurate mental model."`,
  },
  {
    time: "Hour 4",
    title: "Lunch — and a Meta-Lesson",
    concept: [
      "Step away from the screen. The best prompt engineers edit their thinking, not just their prompts.",
      "Prompt engineering is, surprisingly often, a **thinking problem** disguised as a typing problem. When a prompt isn't working, the impulse is to add more words. The better move is usually to step back and ask: do I actually know what I want?",
      "**Keep a 'prompt journal'** — what worked, what didn't, and most importantly, what you learned about your own task in the process. The journal is the curriculum after this curriculum ends.",
      "Could you explain this task to a smart new hire in two minutes? If not, the model has no chance.",
    ],
    code: `# A minimal prompt journal entry — copy this template
entry = {
    "date": "2026-04-07",
    "task": "Classify support tickets by urgency",
    "prompt_version": 4,
    "what_changed": "Added 2 edge-case examples for 'urgent but polite'",
    "result": "Accuracy on eval set: 72% -> 89%",
    "lesson": "Polite phrasing was fooling the model into 'normal'. "
              "Examples fixed it faster than instructions did.",
}`,
    practice:
      "Write down, longhand, the task you most want to automate this week.",
    solution: `# No single correct answer — but a good entry looks like:
task = {
    "what": "Summarize weekly standup notes into 3 bullet points",
    "who_reads_it": "Engineering manager, 30 seconds to scan",
    "what_good_looks_like": "Past tense, action-oriented, no filler",
    "hardest_part": "Distinguishing blockers from FYIs",
}`,
  },
  {
    time: "Hour 5",
    title: "Few-Shot: Teaching by Example",
    concept: [
      "One example clarifies what a thousand words cannot. Show the shape of the answer you want.",
      "**Few-shot prompting** means including a handful of input/output examples directly in your prompt. The model will strongly mirror the format, tone, and reasoning style of those examples — often more reliably than it follows your written instructions.",
      "Two rules matter most. First, **keep the format identical** across every example; any inconsistency becomes a signal the model has to interpret. Second, **cover edge cases on purpose**. If you only show easy examples, the model will assume everything is easy.",
      "A **3-shot prompt** that includes one tricky case often beats a 10-shot prompt of softballs. 2–5 examples usually beats zero or twenty.",
    ],
    code: `# Few-shot classifier with a deliberate edge case
prompt = """Classify each customer message into: urgent, normal, or spam.

Message: "My account is locked and I have a flight in 2 hours!!!"
Category: urgent

Message: "Hey, just wondering when the new colors drop?"
Category: normal

Message: "CONGRATS you won a $1000 gift card click here"
Category: spam

Message: "Thanks for the quick fix yesterday, really appreciate it."
Category: normal

Message: "{new_message}"
Category:"""

# The fourth example is the edge case: polite + non-urgent.
# Without it, the model sometimes misreads thank-you notes as urgent.`,
    practice:
      "Build a 3-shot prompt that classifies customer messages into urgent / normal / spam.",
    solution: `prompt = """Classify each message. Return ONLY the category.

Message: "HELP my order arrived smashed, I need a replacement TODAY"
Category: urgent

Message: "Do you ship to Canada?"
Category: normal

Message: "You've been selected! Click here for your FREE prize"
Category: spam

Message: "{user_input}"
Category:"""

# Key: include one edge case (e.g. urgent but polite,
# or spam that looks like a real question).`,
  },
  {
    time: "Hour 6",
    title: "Chain-of-Thought",
    concept: [
      "Ask the model to think step by step — and it often will. Reasoning is a format, not a feature.",
      "Models produce noticeably better answers on reasoning-heavy tasks when they **'show their work'** before committing to a final answer. This isn't magic — it's a consequence of how generation works.",
      "Each token the model writes becomes context for the next token, so writing out intermediate steps gives later tokens more useful context than writing a bare answer.",
      "The practical technique: **ask for reasoning before the answer** (never after), and for harder tasks ask for an explicit plan first. If you need a clean final answer for downstream code, ask the model to put it inside a tag like `<answer>` so you can parse it out.",
    ],
    code: `# Chain-of-thought with a parseable final answer
import re

prompt = """Solve this word problem.

First, write your reasoning inside <thinking> tags.
Then write the final numeric answer inside <answer> tags.

Problem: A store offers 15% off, then an extra 10% off the
discounted price. What is the total discount on a $200 item?
"""

# Expected output shape:
# <thinking>
# Step 1: 15% off $200 = $170
# Step 2: 10% off $170 = $153
# Step 3: Total discount = $200 - $153 = $47
# </thinking>
# <answer>47</answer>

text = response.content[0].text
final = re.search(r"<answer>(.*?)</answer>", text, re.DOTALL).group(1)`,
    practice:
      "Take a logic puzzle and prompt two versions: one direct, one with step-by-step reasoning. Compare.",
    solution: `# Direct (often wrong on tricky problems):
"What is 23% of 847?"

# With chain-of-thought (much more reliable):
"""Calculate 23% of 847.

First show your arithmetic step by step,
then give the final number on its own line.

Step 1: 23% = 0.23
Step 2: 0.23 × 847 = ?
Final answer:"""`,
  },
  {
    time: "Hour 7",
    title: "Structured Output",
    concept: [
      "If the answer will be parsed by a machine, demand a machine-readable shape.",
      "The moment your LLM output flows into other code, free-form prose becomes a liability. **Structured output** — JSON, XML tags, or a strict template — turns the model from a chatty assistant into a reliable function.",
      "The key is to **specify the exact schema** you want, not just the idea of one. Give field names, types, and what to do when a field is missing (`null`? empty string? omit?).",
      "For complex extractions, show one filled example. And always ask for **ONLY the structured output** with no preamble — models love to say 'Here is the JSON you requested:' which breaks your parser.",
    ],
    code: `import json

prompt = """Extract contact information from the text below.

Return ONLY a JSON object. No preamble, no code fences, no explanation.

Schema:
{
  "name": string,          // full name or null
  "email": string | null,  // lowercase, or null if missing
  "phone": string | null,  // E.164 format, or null
  "company": string | null
}

Text:
\\"\\"\\"
Hi, I'm Sarah Chen from Northwind Labs.
Reach me at sarah.chen@NORTHWIND.io or +1 415-555-0199.
\\"\\"\\"
"""

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=400,
    messages=[{"role": "user", "content": prompt}],
)

data = json.loads(response.content[0].text)
assert data["email"] == "sarah.chen@northwind.io"`,
    practice:
      "Design a JSON schema for a recipe and prompt the model to fill it from a paragraph of prose.",
    solution: `prompt = """Extract recipe details from the text below.

Return ONLY valid JSON matching this schema:
{
  "name": string,
  "prep_time_min": integer,
  "cook_time_min": integer,
  "servings": integer,
  "ingredients": [{"item": string, "amount": string}],
  "steps": [string]
}

Text: "My grandmother's banana bread takes about 15 minutes
to prep and 55 minutes to bake. Mix 3 ripe bananas, 1 cup
sugar, 1 egg, and 1/3 cup melted butter..."
"""`,
  },
  {
    time: "Hour 8",
    title: "Iteration & Debugging",
    concept: [
      "Your first prompt is a draft. Your tenth is a tool.",
      "Prompt engineering is empirical. You cannot reason your way to the best prompt in one shot, and you shouldn't try. The discipline is to **change one variable at a time**, observe the effect, and keep a version log.",
      "When the output is wrong, resist the urge to rewrite the whole prompt — that loses information. Instead, **isolate the failure**: is it a format problem? a reasoning problem? a knowledge problem? Each has a different fix.",
      "**Temperature** also matters more than people think: lower it (0–0.3) when you need consistency, raise it (0.7–1.0) when you need creative variation. Never tune both temperature and prompt at the same time.",
    ],
    code: `# Compare two prompt versions against the same eval cases
eval_cases = [
    {"input": "My flight leaves in 1hr, account locked!", "expected": "urgent"},
    {"input": "When do new colors drop?", "expected": "normal"},
    # ... 10-20 hand-picked cases
]

def score(prompt_template, cases):
    correct = 0
    for case in cases:
        out = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=50,
            temperature=0,  # pin for reproducibility
            messages=[{
                "role": "user",
                "content": prompt_template.format(input=case["input"]),
            }],
        )
        if case["expected"] in out.content[0].text.lower():
            correct += 1
    return correct / len(cases)

print("v3:", score(prompt_v3, eval_cases))
print("v4:", score(prompt_v4, eval_cases))`,
    practice:
      "Take a prompt that's 80% working and run five single-variable iterations to push it to 95%.",
    solution: `# Iteration log template:
iterations = [
    {"change": "Added 2 few-shot examples",         "accuracy": "80% -> 85%"},
    {"change": "Lowered temperature to 0.1",         "accuracy": "85% -> 87%"},
    {"change": "Added edge case for polite urgency",  "accuracy": "87% -> 91%"},
    {"change": "Changed 'classify' to 'categorize'",  "accuracy": "91% -> 91%"},
    {"change": "Added 'Return ONLY the category'",    "accuracy": "91% -> 95%"},
]
# Key insight: most gains came from examples, not instructions.`,
  },
  {
    time: "Hour 9",
    title: "Chaining & Evaluation",
    concept: [
      "The frontier isn't bigger prompts. It's smaller prompts, composed well, measured honestly.",
      "When a task gets complex, the instinct is to write a longer prompt. The better move is usually to **split the task into a chain of smaller, testable steps**. Each step becomes its own prompt with its own eval set.",
      "The cost is a few extra API calls; the benefit is a system you can actually reason about. Pair this with a small **eval set — even 15 hand-picked cases** is enough to catch most regressions.",
      "**Test regressions** when you change the prompt OR the model. Models update; your assumptions shouldn't outlive them.",
    ],
    code: `# A 3-step chain — each step is independently testable
def summarize(article: str) -> str:
    r = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=300,
        messages=[{"role": "user",
                   "content": f"Summarize in 5 bullets:\\n{article}"}],
    )
    return r.content[0].text

def to_tweet(summary: str) -> str:
    r = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=100,
        messages=[{"role": "user",
                   "content": f"Turn into a 240-char tweet:\\n{summary}"}],
    )
    return r.content[0].text

def to_email(summary: str) -> str:
    r = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=400,
        messages=[{"role": "user",
                   "content": f"Turn into a 150-word email digest:\\n{summary}"}],
    )
    return r.content[0].text

summary = summarize(article)
tweet   = to_tweet(summary)
email   = to_email(summary)`,
    practice:
      "Design a 3-step chain for turning a transcript into a tweet, a blog draft, and an email digest.",
    solution: `# Step 1: Extract key points
extract_prompt = """Extract the 5 most important points from this
transcript. Return as numbered bullets.

Transcript: {transcript}"""

# Step 2: Generate outputs from extracted points
tweet_prompt = "Turn these points into a 240-char tweet:\\n{points}"
blog_prompt  = "Expand these points into a 300-word blog post:\\n{points}"
email_prompt = "Format these points as a 150-word email digest:\\n{points}"

# Each step is independently testable and debuggable.`,
  },
  {
    time: "Homework Project",
    title: "Build an Automated Content Pipeline",
    concept: [
      "**Project Goal:** You will build a real-world, automated content processing pipeline. It takes a raw article or transcript, classifies it into a category, extracts key points, and generates three different social media posts based on those points. Finally, you will write an evaluation harness to rigorously test the accuracy of your classification prompt.",
      "**Step 1 — Build the Classification Prompt.** Write a Python function `classify(text)` that calls the OpenAI API. Instruct the model: 'Classify this text into exactly one category: tech, business, science, lifestyle, politics. Return ONLY JSON with fields `category` and `confidence`.' To make this reliable, provide 3 few-shot examples inside the prompt. Test it with a sample sentence.",
      "**Step 2 — Build the Extraction Prompt.** Write `extract_points(text)` that takes the same raw text and asks the model to 'Extract 5 key points as a numbered list.' Use a slightly higher temperature (0.2) here since extraction involves summarizing, but keep it low enough to prevent hallucinations.",
      "**Step 3 — Build the Generation Chain.** Write `generate_formats(points)`. This is the power of prompt chaining: instead of asking the model to read the whole article and write a tweet, you pass it the 5 key points extracted in Step 2. Instruct it: 'Return JSON containing three fields: `tweet` (max 280 chars), `linkedin` (100 words, professional), and `blog_summary` (3 paragraphs)'. Set temperature to 0.5 for creativity.",
      "**Step 4 — Wire the Pipeline Together.** Write a `pipeline(text)` function that calls `classify`, then `extract_points`, then `generate_formats`. Combine all their outputs into a single JSON response. You now have a mini-agent that digests raw text and outputs structured data and multiple content formats.",
      "**Step 5 — Build an Evaluation Harness.** Writing a prompt is easy; knowing if it's reliable is hard. Create a list of dictionaries `eval_cases = [{\"text\": \"...\", \"expected\": \"business\"}, ...]`. Include at least 20 examples, especially edge cases (e.g., a text about a tech company's stock price).",
      "**Step 6 — Run the Eval & Iterate.** Write an `evaluate()` function that loops through your 20 cases, calls your `classify()` function, and calculates an accuracy score (0-100%). Run it. It will likely score around 70%. Now, modify your prompt. Add an instruction: 'If a text is about tech stocks, classify it as business.' Rerun the eval. You should see the score improve. Track your versions and scores in a comment block.",
      "**Step 7 — Deploy as an API.** Wrap your pipeline inside a FastAPI server. Expose a `POST /process` endpoint that accepts `{\"text\": \"...\"}` and returns the final combined JSON. Test it using curl or Postman. This is exactly how GenAI microservices run in production.",
    ],
    code: `# === content_pipeline.py ===
import json
from openai import OpenAI

client = OpenAI()

def classify(text):
    prompt = """Classify this text into exactly one category.
Categories: tech, business, science, lifestyle, politics
Return ONLY JSON: {"category": "...", "confidence": 0.0-1.0}

Examples:
Text: "Apple announced the M4 chip with 30% faster GPU"
{"category": "tech", "confidence": 0.95}

Text: "The Fed held interest rates steady at 5.25%"
{"category": "business", "confidence": 0.90}

Text: """ + f'"{text[:500]}"'

    r = client.chat.completions.create(
        model="gpt-4", temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(r.choices[0].message.content)

def extract_points(text):
    r = client.chat.completions.create(
        model="gpt-4", temperature=0.2,
        messages=[{"role": "user", "content":
            f"Extract 5 key points as a numbered list:\\n\\n{text}"}],
    )
    return r.choices[0].message.content

def generate_formats(points):
    prompt = f"""Generate content from these key points.
Return ONLY JSON with these fields:
{{
  "tweet": "max 280 chars",
  "linkedin": "max 100 words, professional tone",
  "blog_summary": "3 paragraphs, informative tone"
}}

Key points:
{points}"""
    r = client.chat.completions.create(
        model="gpt-4", temperature=0.5,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(r.choices[0].message.content)

def pipeline(text):
    category = classify(text)
    points = extract_points(text)
    formats = generate_formats(points)
    return {"classification": category, "key_points": points, **formats}

# === Run ===
# result = pipeline("Apple announced the M4 chip...")
# print(json.dumps(result, indent=2))

# === FastAPI wrapper ===
# from fastapi import FastAPI
# app = FastAPI()
# @app.post("/process")
# async def process(body: dict):
#     return pipeline(body["text"])`,
    practice: "Build the complete content pipeline: implement classify, extract, and generate functions. Create a 20-case eval set. Iterate through 5 prompt versions tracking accuracy. Deploy as a FastAPI endpoint.",
    solution: `# Evaluation harness:
eval_cases = [
    {"text": "NVIDIA stock surged 15%...", "expected": "business"},
    {"text": "New CRISPR technique cures...", "expected": "science"},
    # ... 18 more cases
]

def evaluate(classify_fn, cases):
    correct = sum(1 for c in cases
                  if classify_fn(c["text"])["category"] == c["expected"])
    return correct / len(cases)

# Iteration log:
# v1: Basic prompt -> 70% accuracy
# v2: Added 3 few-shot examples -> 80%
# v3: Added edge case (tech stock = business) -> 87%
# v4: Lowered temperature to 0 -> 90%
# v5: Added "When unsure, classify by primary subject" -> 95%

# Deploy:
# pip install fastapi uvicorn openai
# uvicorn pipeline_api:app --host 0.0.0.0 --port 8000
# curl -X POST localhost:8000/process -d '{"text":"..."}'`,
  },
];

// Render concept paragraphs with **bold** and \`code\` support
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

export default function PromptEngineeringDay() {
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
            <h1 className="text-2xl sm:text-3xl font-bold">Prompt Engineering — One Day</h1>
          </div>
          <p className="text-slate-400 text-sm">
            9 focused hours. Read the concept, study the code, then try the practice problem.
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
