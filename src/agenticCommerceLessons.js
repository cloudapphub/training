export const agenticCommerceLessons = [
  {
    time: "Hour 1",
    title: "What Is Agentic Commerce? — The End of Browsing",
    concept: [
      "**Agentic Commerce** is a new paradigm where autonomous AI agents perform end-to-end shopping and purchasing on behalf of consumers and businesses. Instead of a human scrolling through websites, clicking 'Add to Cart', and entering credit card details, an AI agent does ALL of it — from product discovery to price comparison to checkout to delivery tracking.",
      "**The shift is from assistance to autonomy.** Traditional chatbots SUGGEST products and answer questions. Agentic Commerce agents EXECUTE transactions. You tell the agent: 'Find me running shoes under $100, good for flat feet, delivered by Friday' — and the agent researches options across multiple retailers, compares reviews, applies coupons, checks your shoe size from past orders, and completes the purchase. You approve a single confirmation.",
      "**Three layers power Agentic Commerce:** (1) The **AI Layer** — LLMs that reason, plan, and understand natural language intent. (2) The **Protocol Layer** — standards like ACP, UCP, and MCP that let agents securely interact with merchant systems. (3) The **Data Layer** — machine-readable product catalogs, inventory feeds, and structured data (JSON-LD, semantic tagging) that agents can parse.",
      "**Why now?** Three forces converged in 2025-2026: (1) LLMs became reliable enough for multi-step planning and tool use. (2) Payment providers (Stripe, PayPal) built agent-safe payment infrastructure. (3) Commerce platforms (Shopify, BigCommerce) created agent-ready APIs. The result: a $5.6 trillion retail market is being re-architected around AI-first interfaces.",
      "**Business value:** For consumers — save hours of shopping, get better prices, never miss deals. For merchants — reach customers through AI channels (ChatGPT, Gemini, Copilot), reduce cart abandonment (agents don't get distracted), increase conversion rates. For enterprises — automate procurement, reduce purchasing cycle time from days to minutes.",
      "**The competitive cliff:** Businesses that don't make their product data and APIs 'agent-ready' will become invisible. When a consumer asks their AI assistant to buy something, the agent will only surface products from merchants whose data is structured and whose checkout APIs are agent-compatible. No agent-ready API = no AI-driven sales.",
    ],
    code: `# === The Agentic Commerce Mental Model ===

# TRADITIONAL COMMERCE (Human-Driven)
# User → Browser → Search → Scroll → Compare → Cart → Checkout → Pay
# Time: 30-60 minutes per purchase
# Friction: High (forms, passwords, distractions)

# AGENTIC COMMERCE (Agent-Driven)
# User → "Buy running shoes under $100" → Agent handles everything → Confirm
# Time: 30 seconds (mostly waiting for confirmation)
# Friction: Near zero

# === The Three-Layer Architecture ===
#
# ┌─────────────────────────────────────────┐
# │  AI LAYER (Reasoning & Planning)        │
# │  LLMs: GPT-4o, Gemini, Claude           │
# │  Capabilities: NLU, multi-step planning │
# │  Frameworks: LangGraph, AutoGen         │
# └────────────────┬────────────────────────┘
#                  │
# ┌────────────────▼────────────────────────┐
# │  PROTOCOL LAYER (Interoperability)      │
# │  ACP: Agentic Commerce Protocol         │
# │  UCP: Universal Commerce Protocol       │
# │  MCP: Model Context Protocol            │
# │  A2A: Agent-to-Agent Protocol           │
# └────────────────┬────────────────────────┘
#                  │
# ┌────────────────▼────────────────────────┐
# │  DATA LAYER (Machine-Readable Catalogs) │
# │  JSON-LD, Schema.org Product markup     │
# │  Structured inventory feeds             │
# │  Real-time pricing APIs                 │
# └─────────────────────────────────────────┘

# === Simple Agent Intent Example (Pseudocode) ===
user_intent = "Find a waterproof hiking backpack, 40L, under $150, with good reviews"

# Agent decomposes intent into structured query:
agent_query = {
    "category": "hiking_backpack",
    "features": ["waterproof", "40L_capacity"],
    "price_max": 150.00,
    "min_rating": 4.0,
    "sort_by": "best_value",  # price-to-quality ratio
    "delivery_by": "2026-04-18"
}
# Agent searches multiple merchant APIs simultaneously...`,
    practice: "List three real-world scenarios where agentic commerce dramatically outperforms traditional online shopping. For each, explain what the agent does that a human cannot do efficiently.",
    solution: `Scenario 1: Multi-Retailer Price Comparison
- Human: Open 5 tabs, search each retailer, compare prices manually. Takes 30+ min.
- Agent: Queries all 5 retailer APIs simultaneously in <2 seconds, factors in
  shipping costs, available coupons, loyalty discounts, and return policies.
  Returns the objectively best deal with a single recommendation.

Scenario 2: Complex B2B Procurement
- Human: Fill out purchase requisition, get 3 quotes, review specs, get approval,
  create PO, submit to vendor. Takes 3-5 business days.
- Agent: Reads the requisition, queries approved vendor catalogs via ACP,
  compares against contract pricing, checks budget allocation, routes for
  approval, and submits PO. Takes 10 minutes.

Scenario 3: Recurring Household Reorders
- Human: Check what's running low, open Amazon, search each item, add to cart,
  check if prices changed, checkout. Weekly task: 20 minutes.
- Agent: Monitors consumption patterns (via smart home/IoT), predicts when
  items will run out, compares current prices across retailers, auto-reorders
  when prices are lowest, and alerts only if something is unusual.`,
  },
  {
    time: "Hour 2",
    title: "The Protocol Stack — ACP, UCP, MCP & A2A",
    concept: [
      "**Agentic Commerce Protocol (ACP)** is an open-source standard co-developed by **Stripe and OpenAI**. It defines how AI agents discover products, construct carts, initiate checkouts, and execute transactions programmatically. Think of ACP as the 'HTTP of agent shopping' — a common language that any agent and any merchant can speak.",
      "**ACP covers the full transaction lifecycle:** (1) Product discovery — agent queries merchant catalog. (2) Cart management — agent adds/removes items, applies promotions. (3) Checkout — agent initiates secure payment via tokenized credentials. (4) Order confirmation — agent receives order ID, tracking info. (5) Post-purchase — returns, refunds, status queries. The merchant retains full control over pricing, branding, and policies.",
      "**Universal Commerce Protocol (UCP)** is a complementary standard co-developed by **Shopify and Google**. While ACP focuses on the transactional flow, UCP focuses on being a 'digital sales contract' — it encodes store logic (pricing rules, tax calculations, shipping options, return policies) in a machine-readable format that any AI agent can interpret.",
      "**Model Context Protocol (MCP)** by Anthropic is the 'API for AI agents.' It standardizes how agents securely connect to external data sources — inventory systems, CRMs, ERPs, pricing databases. MCP servers expose structured tools (functions) that agents can call. For commerce: an MCP server might expose `search_products()`, `check_inventory()`, `get_shipping_rates()` as callable tools.",
      "**Agent-to-Agent (A2A) Protocol** by Google enables direct communication between AI agents. Example: your personal shopping agent negotiates with a retailer's inventory agent to find the best deal. Or a procurement agent talks to a supplier agent to automate B2B ordering. A2A handles agent identity, capability discovery, and message exchange.",
      "**Why multiple protocols?** Each solves a different problem: MCP connects agents to data, ACP handles transactions, UCP encodes store logic, and A2A enables agent-agent coordination. In practice, a real agentic commerce flow uses ALL of them together — MCP to discover products, UCP to understand store policies, ACP to execute checkout, and A2A for multi-agent orchestration.",
    ],
    code: `# === ACP: Agentic Commerce Protocol (Stripe/OpenAI) ===
# The agent interacts with a merchant's ACP endpoint

# Step 1: Discover products
import requests

acp_response = requests.post("https://merchant.com/acp/v1/search", json={
    "query": "wireless noise-canceling headphones",
    "filters": {"price_max": 200, "brand": ["Sony", "Bose"]},
    "agent_id": "agent_openai_user123",
    "protocol_version": "acp/1.0"
})
products = acp_response.json()["products"]
# Returns: structured product data with prices, availability, images

# Step 2: Add to cart
cart = requests.post("https://merchant.com/acp/v1/cart", json={
    "items": [{"sku": products[0]["sku"], "quantity": 1}],
    "agent_id": "agent_openai_user123"
})

# Step 3: Checkout with Shared Payment Token (no raw card data!)
checkout = requests.post("https://merchant.com/acp/v1/checkout", json={
    "cart_id": cart.json()["cart_id"],
    "payment_token": "spt_abc123xyz",   # Stripe Shared Payment Token
    "shipping_address_token": "addr_token_456",
    "agent_id": "agent_openai_user123"
})
order_id = checkout.json()["order_id"]  # Done!

# === MCP: Model Context Protocol (Anthropic) ===
# MCP Server exposes tools that agents can call

# mcp_commerce_server.py
from mcp.server import Server

server = Server("commerce-tools")

@server.tool("search_products")
async def search_products(query: str, max_price: float = None):
    """Search product catalog with optional price filter."""
    results = await catalog_db.search(query, max_price=max_price)
    return [{"name": r.name, "price": r.price, "sku": r.sku} for r in results]

@server.tool("check_inventory")
async def check_inventory(sku: str, warehouse: str = "default"):
    """Check real-time inventory for a product."""
    stock = await inventory_api.get_stock(sku, warehouse)
    return {"sku": sku, "available": stock.quantity, "warehouse": warehouse}

@server.tool("get_shipping_rates")
async def get_shipping_rates(sku: str, zip_code: str):
    """Get shipping options and estimated delivery dates."""
    rates = await shipping_api.calculate(sku, zip_code)
    return [{"method": r.method, "cost": r.cost, "eta": r.eta} for r in rates]`,
    practice: "Design an MCP server for a bookstore that exposes three tools: search_books (by title/author/genre), check_availability (by ISBN and store location), and place_hold (reserve a book for pickup).",
    solution: `from mcp.server import Server

server = Server("bookstore-tools")

@server.tool("search_books")
async def search_books(
    query: str,
    genre: str = None,
    max_price: float = None,
    limit: int = 10
):
    """Search the bookstore catalog by title, author, or genre."""
    filters = {}
    if genre: filters["genre"] = genre
    if max_price: filters["price_max"] = max_price
    results = await book_db.search(query, filters=filters, limit=limit)
    return [{
        "isbn": b.isbn, "title": b.title, "author": b.author,
        "price": b.price, "genre": b.genre, "rating": b.avg_rating
    } for b in results]

@server.tool("check_availability")
async def check_availability(isbn: str, store_id: str = "main"):
    """Check if a book is available at a specific store location."""
    stock = await inventory.check(isbn, store_id)
    return {
        "isbn": isbn, "store": store_id,
        "in_stock": stock.quantity > 0,
        "quantity": stock.quantity,
        "next_restock": stock.restock_date if stock.quantity == 0 else None
    }

@server.tool("place_hold")
async def place_hold(isbn: str, customer_id: str, store_id: str = "main"):
    """Reserve a book for customer pickup. Hold expires in 48 hours."""
    hold = await holds_service.create(isbn, customer_id, store_id, hours=48)
    return {
        "hold_id": hold.id, "isbn": isbn,
        "pickup_by": hold.expires_at.isoformat(),
        "store_address": hold.store.address
    }`,
  },
  {
    time: "Hour 3",
    title: "Stripe & Payments — SPTs, Tokenization & Trust",
    concept: [
      "**The biggest question in agentic commerce: how do you let an AI agent pay for things without giving it your credit card?** Stripe solved this with **Shared Payment Tokens (SPTs)** — a cryptographic token that represents your payment method. The agent uses the SPT to pay, but it NEVER sees your actual card number, CVV, or bank details.",
      "**How SPTs work:** (1) The user authorizes an agent to make purchases on their behalf (via Stripe's UI). (2) Stripe generates an SPT — a scoped, time-limited, permissioned token. (3) The agent uses the SPT in checkout requests. (4) Stripe verifies the SPT, validates the transaction against the user's spending controls, and processes the payment. (5) The SPT expires after use or after a set time period.",
      "**SPT security controls:** Users and businesses can set granular guardrails: maximum spend per transaction, maximum spend per day/week/month, allowed merchant categories (groceries: yes, electronics: ask first), geographic restrictions, and time windows. If the agent tries to exceed these limits, the transaction is REJECTED at the Stripe level — the agent cannot override it.",
      "**Network tokens** add another layer. In 2026, SPTs support Visa/Mastercard network-issued tokens — virtual card numbers unique to each merchant. Even if a token is leaked, it's useless at any other merchant. This is the same technology behind Apple Pay and Google Pay, now extended to AI agents.",
      "**The Agentic Commerce Suite** by Stripe is the merchant toolkit. It connects a business's product catalog to Stripe, handles checkout state management, shipping calculation, and post-purchase flows (refunds, returns) — all through agent-compatible APIs. Merchants don't need to build custom integrations for each AI platform.",
      "**Business value of agent-safe payments:** (1) Trust — consumers will only let agents spend their money if the payment system is provably secure. (2) Compliance — tokenization means PCI scope is minimal. (3) Fraud reduction — SPTs have built-in velocity checks and spending controls. (4) New revenue — merchants who support agent payments tap into the growing AI-driven purchase channel.",
    ],
    code: `# === Stripe Shared Payment Tokens (SPTs) ===
import stripe
stripe.api_key = "sk_live_..."

# Step 1: Merchant creates an SPT for the agent
# (User has pre-authorized the agent via Stripe's consent flow)
spt = stripe.SharedPaymentToken.create(
    customer="cus_user123",
    agent_id="agent_openai_asst_abc",
    permissions={
        "max_amount": 20000,         # $200.00 max per transaction
        "max_daily_spend": 50000,    # $500.00/day limit
        "allowed_categories": [      # Only these merchant categories
            "sporting_goods",
            "clothing",
            "electronics"
        ],
        "expires_at": "2026-04-30T23:59:59Z",
    }
)
# spt.id = "spt_abc123xyz" — this is what the agent uses

# Step 2: Agent uses SPT to complete purchase (via ACP)
payment_intent = stripe.PaymentIntent.create(
    amount=9999,                    # $99.99
    currency="usd",
    payment_method_token=spt.id,    # Agent's SPT — no card number!
    metadata={
        "agent_id": "agent_openai_asst_abc",
        "order_source": "agentic_commerce",
        "user_intent": "running shoes under $100"
    },
    confirm=True
)

# Step 3: Stripe validates the SPT
# ✓ Is the SPT valid and not expired?
# ✓ Is the amount within the max_amount permission?
# ✓ Is the daily spend limit exceeded?
# ✓ Is "sporting_goods" in the allowed categories?
# ✓ Is the merchant in the allowed geography?
# → If ALL checks pass: payment is processed
# → If ANY check fails: payment is REJECTED, agent gets error

# Step 4: SPT is consumed (single-use) or decremented (multi-use)
# The agent NEVER saw: card number, CVV, expiry, or bank details

# === Spending Controls Dashboard (for the user) ===
# Users manage agent permissions via Stripe's UI:
# - View all active SPTs and their limits
# - Revoke any SPT instantly
# - Review transaction history per agent
# - Set up notifications for agent purchases
# - Emergency: "Freeze all agent spending" button`,
    practice: "Design a spending control schema for three different agent use cases: (1) a grocery shopping agent, (2) a travel booking agent, (3) a corporate procurement agent. What limits and categories would you set for each?",
    solution: `# 1. GROCERY SHOPPING AGENT
grocery_spt = {
    "max_amount": 30000,           # $300 max per transaction
    "max_weekly_spend": 60000,     # $600/week
    "allowed_categories": ["grocery", "organic_foods", "beverages"],
    "blocked_categories": ["alcohol", "tobacco"],
    "auto_approve_under": 5000,    # Auto-approve < $50
    "require_approval_above": 15000,  # Ask user for > $150
    "allowed_merchants": ["whole_foods", "trader_joes", "costco"],
    "delivery_window": "same_day"
}

# 2. TRAVEL BOOKING AGENT
travel_spt = {
    "max_amount": 500000,          # $5,000 max per transaction
    "max_monthly_spend": 1000000,  # $10,000/month
    "allowed_categories": ["airlines", "hotels", "car_rental"],
    "blocked_categories": ["gambling", "adult_entertainment"],
    "require_approval": "always",  # ALWAYS ask user before booking
    "allowed_currencies": ["USD", "EUR", "GBP"],
    "geo_restrictions": ["US", "EU", "UK", "JP"]
}

# 3. CORPORATE PROCUREMENT AGENT
procurement_spt = {
    "max_amount": 250000,          # $2,500 per PO
    "max_monthly_spend": 5000000,  # $50,000/month
    "allowed_categories": ["office_supplies", "IT_equipment", "SaaS"],
    "approved_vendors_only": True,
    "require_3_quotes_above": 100000,  # 3 quotes for > $1,000
    "require_manager_approval_above": 250000,
    "budget_code_required": True,
    "audit_log": "enabled"
}`,
  },
  {
    time: "Hour 4",
    title: "Shopify Agentic Storefronts & UCP",
    concept: [
      "**Shopify Agentic Storefronts** are a new merchant capability that lets businesses manage their presence across multiple AI channels from a single dashboard. Instead of building separate integrations for ChatGPT, Gemini, Copilot, and Alexa, merchants configure their agentic storefront ONCE — and Shopify distributes their products across all supported AI platforms.",
      "**The Universal Commerce Protocol (UCP)**, co-developed by Shopify and Google, is the backbone. UCP is a 'digital sales contract' — it encodes ALL of a store's logic in machine-readable format: product catalog, pricing rules (including dynamic pricing, volume discounts, loyalty tiers), tax calculations (by jurisdiction), shipping options (rates, carriers, delivery windows), and return policies.",
      "**Why UCP matters:** Without UCP, an AI agent would need to scrape a website's terms, guess at shipping costs, and hope it's calculating taxes correctly. With UCP, the agent gets a structured, authoritative manifest that says: 'This product costs $79.99, tax is $6.40 in California, free shipping over $50, 30-day returns accepted.' The agent can make accurate decisions instantly.",
      "**Agent-Ready Product Data** is the new SEO. In traditional e-commerce, you optimize for Google search (keywords, meta descriptions, page speed). In agentic commerce, you optimize for AI agents — structured product attributes (material, fit, use case, compatibility), rich taxonomy, high-quality images with alt text, and JSON-LD schema markup. The richer your product data, the more likely an agent will recommend your product.",
      "**Share of Model** is the new KPI replacing 'Share of Search.' It measures how often AI agents recommend your brand/product when users ask for something in your category. If a user asks 'best running shoes under $100' and the agent recommends Nike, Adidas, and Brooks but not your brand — your Share of Model is 0%. Optimizing for this requires structured data, competitive pricing, strong reviews, and agent-ready APIs.",
      "**The economics shift:** In traditional e-commerce, you pay for ads to get attention (SEO/SEM). In agentic commerce, agents do the research — ad impressions become less relevant. Instead, merchants compete on data quality, API reliability, pricing transparency, and fulfillment speed. The winner is the merchant whose data is richest and whose API is fastest.",
    ],
    code: `# === Shopify UCP Product Manifest (Simplified) ===
# This is what an AI agent "sees" when it queries a UCP-enabled store

ucp_product_manifest = {
    "protocol_version": "ucp/1.0",
    "merchant": {
        "name": "TrailRunner Pro Shop",
        "merchant_id": "shopify_trail_runner",
        "trust_score": 4.8,
        "verified": True,
        "return_policy": {
            "window_days": 30,
            "condition": "unworn_with_tags",
            "refund_method": "original_payment",
            "free_returns": True
        }
    },
    "product": {
        "sku": "TRP-SHOE-001",
        "name": "CloudTrail Ultra Running Shoe",
        "category": "athletic_footwear/running/trail",
        "price": {"amount": 8999, "currency": "USD"},  # $89.99
        "attributes": {
            "terrain": "trail",
            "cushioning": "moderate",
            "arch_support": "neutral",
            "waterproof": True,
            "weight_oz": 9.8,
            "drop_mm": 8,
            "sustainability": "30% recycled materials"
        },
        "availability": {
            "in_stock": True,
            "sizes": ["8", "8.5", "9", "9.5", "10", "10.5", "11"],
            "colors": ["forest_green", "slate_gray", "navy"]
        },
        "reviews_summary": {
            "avg_rating": 4.6,
            "total_reviews": 1247,
            "fit": "runs_true_to_size"
        }
    },
    "shipping": [
        {"method": "standard", "cost": 0, "eta_days": "5-7", "note": "Free!"},
        {"method": "express", "cost": 1299, "eta_days": "2-3"},
        {"method": "next_day", "cost": 2499, "eta_days": "1"}
    ],
    "tax_rules": {
        "US_CA": {"rate": 0.0725, "included": False},
        "US_OR": {"rate": 0.0, "included": False},
        "EU": {"rate": 0.20, "included": True}  # VAT included
    },
    "promotions": [
        {"code": "TRAIL10", "discount_pct": 10, "min_order": 5000}
    ]
}

# An AI agent reads this manifest and can:
# 1. Compare this product against competitors on structured attributes
# 2. Calculate exact total cost (price + tax + shipping) for the user
# 3. Apply available promotions automatically
# 4. Check size availability before recommending
# 5. Factor in return policy when assessing risk of purchase`,
    practice: "Create a UCP manifest for a fictional electronics store selling a wireless charger. Include structured attributes (wattage, compatibility, certifications), dynamic pricing (bulk discounts), and at least two shipping options.",
    solution: `ucp_manifest = {
    "protocol_version": "ucp/1.0",
    "merchant": {
        "name": "TechWave Electronics",
        "trust_score": 4.5,
        "verified": True,
        "return_policy": {
            "window_days": 14,
            "condition": "unopened",
            "restocking_fee_pct": 15,
            "free_returns": False
        }
    },
    "product": {
        "sku": "TWE-CHG-WIRELESS-50W",
        "name": "TechWave 50W MagSafe Wireless Charger",
        "category": "electronics/chargers/wireless",
        "price": {"amount": 3499, "currency": "USD"},
        "attributes": {
            "wattage": 50,
            "input": "USB-C PD",
            "compatibility": ["iPhone 15+", "Samsung Galaxy S24+", "Qi2"],
            "certifications": ["Qi2", "MFi", "FCC", "CE"],
            "color": "matte_black",
            "weight_g": 120,
            "includes_cable": True,
            "cable_length_ft": 6
        },
        "availability": {"in_stock": True, "quantity": 342},
        "reviews_summary": {"avg_rating": 4.3, "total_reviews": 589}
    },
    "pricing_tiers": [
        {"min_qty": 1, "price": 3499},
        {"min_qty": 5, "price": 2999},   # $5 off each for 5+
        {"min_qty": 20, "price": 2499}   # $10 off each for 20+
    ],
    "shipping": [
        {"method": "standard", "cost": 499, "eta_days": "5-7"},
        {"method": "two_day", "cost": 999, "eta_days": "2"},
        {"method": "free_over_50", "cost": 0, "min_order": 5000, "eta_days": "5-7"}
    ]
}`,
  },
  {
    time: "Hour 5",
    title: "Building an Agentic Shopping Agent",
    concept: [
      "**An agentic shopping agent** is an AI system that autonomously handles the entire purchase journey. Using LangGraph, you can build one as a multi-step graph: `understand_intent → search_products → compare_options → check_budget → human_approval → execute_purchase → confirm_order`. Each node is a distinct capability.",
      "**Intent parsing** is the first node. The user says: 'I need a birthday gift for my mom, she likes gardening, budget $50-$75.' The agent extracts: category (gifts/gardening), occasion (birthday), recipient (female, older), price range ($50-$75), urgency (depends on birthday date). This structured intent drives every downstream decision.",
      "**Multi-source product search** queries multiple merchant APIs simultaneously (via MCP tools or ACP endpoints). The agent doesn't search one store — it searches ALL stores that support agent APIs. Results are normalized into a common schema for comparison. This is something a human shopper simply cannot do efficiently.",
      "**Intelligent comparison** goes beyond price. The agent considers: price-per-value ratio, shipping cost and speed, review sentiment (not just star rating — NLP analysis of review text), return policy friendliness, seller trustworthiness, past purchase history (does the recipient already have this?), and environmental impact if the user cares about sustainability.",
      "**The approval gate** is critical. Before spending money, the agent presents its top recommendation with a full cost breakdown: product price + tax + shipping - discount = total. The user sees exactly what they're getting and approves with one tap. For low-value routine purchases (groceries under $50), this can be skipped via spending controls.",
      "**Post-purchase autonomy:** After the order, the agent tracks delivery, handles issues proactively (e.g., if a package is delayed, automatically contacts support or finds an alternative), and learns from the experience (this brand's size runs small → remember for next time).",
    ],
    code: `# === Building an Agentic Shopping Agent with LangGraph ===
from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from langchain_openai import ChatOpenAI

class ShoppingState(TypedDict):
    user_request: str
    parsed_intent: dict
    search_results: Annotated[list[dict], add]
    top_picks: list[dict]
    selected_product: dict
    order_confirmation: dict
    messages: list[str]

llm = ChatOpenAI(model="gpt-4o-mini")

def parse_intent(state: ShoppingState):
    """Extract structured shopping intent from natural language."""
    prompt = f"""Parse this shopping request into structured JSON:
    Request: {state['user_request']}
    Extract: category, occasion, price_min, price_max, key_features, urgency"""
    response = llm.invoke(prompt)
    return {"parsed_intent": {
        "category": "gardening_gifts",
        "price_range": [50, 75],
        "occasion": "birthday",
        "features": ["practical", "high_quality"]
    }}

def search_products(state: ShoppingState):
    """Search multiple merchants via MCP/ACP."""
    intent = state["parsed_intent"]
    # In production: call real MCP tools or ACP endpoints
    results = [
        {"name": "Premium Garden Tool Set", "price": 59.99,
         "rating": 4.7, "merchant": "GardenPro", "shipping": "free"},
        {"name": "Herb Growing Kit Deluxe", "price": 44.99,
         "rating": 4.5, "merchant": "PlantJoy", "shipping": "$4.99"},
        {"name": "Smart Garden Planter", "price": 69.99,
         "rating": 4.8, "merchant": "TechGarden", "shipping": "free"},
    ]
    return {"search_results": results}

def compare_and_rank(state: ShoppingState):
    """Rank products by value, reviews, and fit to intent."""
    ranked = sorted(state["search_results"],
                    key=lambda p: p["rating"] * (1 / p["price"]),
                    reverse=True)
    return {"top_picks": ranked[:3]}

def get_approval(state: ShoppingState):
    """Pause for human approval before purchasing."""
    top = state["top_picks"][0]
    decision = interrupt({
        "recommendation": top,
        "message": f"Buy '{top['name']}' for " + "$" + f"{top['price']}?"
    })
    if decision == "approve":
        return {"selected_product": top}
    return {"selected_product": None}

def execute_purchase(state: ShoppingState):
    """Complete the purchase via ACP + Stripe SPT."""
    if not state.get("selected_product"):
        return {"order_confirmation": {"status": "cancelled"}}
    # In production: call ACP checkout with SPT
    return {"order_confirmation": {
        "status": "confirmed",
        "order_id": "ORD-2026-04-13-001",
        "product": state["selected_product"]["name"],
        "total": state["selected_product"]["price"]
    }}

# Build the graph
builder = StateGraph(ShoppingState)
builder.add_node("parse_intent", parse_intent)
builder.add_node("search", search_products)
builder.add_node("compare", compare_and_rank)
builder.add_node("approve", get_approval)
builder.add_node("purchase", execute_purchase)

builder.add_edge(START, "parse_intent")
builder.add_edge("parse_intent", "search")
builder.add_edge("search", "compare")
builder.add_edge("compare", "approve")
builder.add_edge("approve", "purchase")
builder.add_edge("purchase", END)

memory = MemorySaver()
graph = builder.compile(checkpointer=memory)`,
    practice: "Extend the shopping agent to handle a 'product not found' scenario. If search returns no results matching the intent, the agent should suggest relaxing the price range or broadening the category, then search again.",
    solution: `def search_with_fallback(state):
    """Search with automatic fallback if no results found."""
    intent = state["parsed_intent"]
    results = search_merchant_apis(intent)  # Primary search

    if not results:
        # Fallback 1: Relax price range by 25%
        relaxed_intent = {**intent}
        relaxed_intent["price_range"] = [
            intent["price_range"][0] * 0.75,
            intent["price_range"][1] * 1.25
        ]
        results = search_merchant_apis(relaxed_intent)

    if not results:
        # Fallback 2: Broaden category
        relaxed_intent["category"] = get_parent_category(intent["category"])
        results = search_merchant_apis(relaxed_intent)

    if not results:
        return {
            "search_results": [],
            "messages": ["No products found. Try a different category."]
        }

    return {"search_results": results}

def route_after_search(state):
    """Route based on search results."""
    if not state["search_results"]:
        return END  # No products — stop
    return "compare"  # Found products — continue

builder.add_conditional_edges("search", route_after_search)`,
  },
  {
    time: "Hour 6",
    title: "Hyper-Personalization & Recommendation Agents",
    concept: [
      "**Traditional recommendation engines** are rules-based: 'Users who bought X also bought Y.' They're static, generic, and context-blind. **Agentic recommendations** are dynamic, contextual, and personalized: the agent knows your preferences, past purchases, current needs, budget, and even the occasion — and uses real-time reasoning to find the BEST match, not just the most popular one.",
      "**Zero-party data** is information users voluntarily share: 'I prefer organic products', 'I'm training for a marathon', 'I have sensitive skin.' Agents collect this through natural conversation and store it in persistent memory (LangGraph's Store API). Every future recommendation is filtered through these preferences — without invasive tracking.",
      "**Context-aware shopping** means the agent considers situational factors: time of year (winter coat in October), location (recommending local stores), social context (gift for a colleague vs. partner), urgency ('I need this by Friday'), and budget sensitivity ('I'm saving this month'). Traditional e-commerce ignores all of this.",
      "**Conversational discovery** replaces keyword search. Instead of typing 'blue running shoes size 10' into a search box, the user says: 'I've been getting knee pain during runs. What shoes would help?' The agent understands the medical context, recommends shoes with extra cushioning and stability features, and explains WHY each recommendation fits the user's specific situation.",
      "**Cross-session memory** is enabled by checkpointing and long-term stores. The agent remembers: 'Last time you bought size 10 Nikes and said they were a bit tight. Should I recommend size 10.5 this time?' This turns every interaction into a data point that improves future recommendations — a virtual personal shopper that gets smarter over time.",
      "**Business value:** Personalized agents increase average order value by 15-30% (recommending complementary items that actually fit the user's needs), reduce return rates by 20-35% (right product first time), and dramatically improve customer lifetime value through relationship-based selling rather than transaction-based selling.",
    ],
    code: `# === Personalization Agent with Persistent User Profile ===
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore
from langchain_openai import ChatOpenAI

# Long-term memory store (persists across conversations)
store = InMemoryStore()
llm = ChatOpenAI(model="gpt-4o-mini")

class PersonalizedState(MessagesState):
    user_id: str
    user_profile: dict
    recommendations: list[dict]

def load_user_profile(state, config, store):
    """Load user preferences from persistent store."""
    user_id = state["user_id"]
    items = store.search(("user_profiles", user_id))
    if items:
        return {"user_profile": items[0].value}
    return {"user_profile": {
        "preferences": [], "size_history": {},
        "past_purchases": [], "dislikes": []
    }}

def personalize_search(state):
    """Apply user preferences to search results."""
    profile = state["user_profile"]
    # Agent considers: size history, brand preferences, budget,
    # past returns (items that didn't fit), style preferences
    personalized = [
        {"name": "CloudRun Pro 10.5", "match_score": 0.95,
         "reason": "Based on your knee pain: extra cushioning + stability. "
                   "Size 10.5 per your last Nike fit feedback."},
        {"name": "TrailMaster Stability", "match_score": 0.88,
         "reason": "Great arch support for pronation. Within your $120 budget."},
    ]
    return {"recommendations": personalized}

def update_profile(state, config, store):
    """Save new preferences discovered during conversation."""
    user_id = state["user_id"]
    # After the conversation, save any new learned preferences
    updated_profile = {**state["user_profile"]}
    updated_profile["last_interaction"] = "2026-04-13"
    store.put(("user_profiles", user_id), "profile", updated_profile)
    return {}

# === JSON-LD Product Schema for Agent Consumption ===
product_jsonld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "CloudRun Pro Running Shoe",
    "brand": {"@type": "Brand", "name": "CloudRun"},
    "offers": {
        "@type": "Offer",
        "price": "119.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2026-12-31"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "reviewCount": "2341"
    },
    "additionalProperty": [
        {"@type": "PropertyValue", "name": "cushioning", "value": "maximum"},
        {"@type": "PropertyValue", "name": "stability", "value": "high"},
        {"@type": "PropertyValue", "name": "arch_support", "value": "motion_control"},
        {"@type": "PropertyValue", "name": "best_for", "value": "knee_pain_pronation"}
    ]
}`,
    practice: "Design a user profile schema that an agentic shopping agent would maintain. Include: size history per category, brand preferences, budget ranges, past returns with reasons, dietary restrictions (for grocery agents), and gift recipient profiles.",
    solution: `user_profile_schema = {
    "user_id": "usr_alice_001",
    "created_at": "2025-06-15",
    "size_history": {
        "shoes": {"nike": "10.5", "adidas": "10", "preferred": "10.5"},
        "shirts": {"general": "M", "slim_fit": "L"},
        "pants": {"waist": 32, "inseam": 30}
    },
    "brand_preferences": {
        "liked": ["Nike", "Patagonia", "Apple"],
        "disliked": ["Fast fashion brands"],
        "luxury_threshold": "mid-range"
    },
    "budget_ranges": {
        "routine_groceries": {"weekly_max": 150},
        "clothing": {"per_item_max": 200},
        "electronics": {"per_item_max": 500},
        "gifts": {"per_occasion": {"birthday": 75, "holiday": 100}}
    },
    "return_history": [
        {"item": "Running Shoe X", "reason": "too_narrow", "action": "exchanged_size_up"},
        {"item": "Jacket Y", "reason": "color_different_from_photo", "action": "refunded"}
    ],
    "dietary": {
        "restrictions": ["gluten_free", "dairy_free"],
        "preferences": ["organic", "local"],
        "allergies": ["peanuts"]
    },
    "gift_recipients": {
        "mom": {"interests": ["gardening", "cooking"], "sizes": {"shirt": "S"}},
        "partner": {"interests": ["tech", "fitness"], "sizes": {"shoe": "9"}}
    }
}`,
  },
  {
    time: "Hour 7",
    title: "B2B & Enterprise Procurement Agents",
    concept: [
      "**B2B procurement** is where agentic commerce delivers the MOST measurable ROI. Enterprise purchasing is traditionally slow, manual, and expensive: purchase requisitions, 3-quote requirements, approval chains, PO creation, vendor management, invoice reconciliation. An agentic procurement system automates the ENTIRE workflow.",
      "**The procurement agent workflow:** (1) An employee requests: 'Need 50 ergonomic keyboards for the new office floor.' (2) The agent checks approved vendor catalogs via MCP. (3) It requests quotes from 3+ vendors (via A2A protocol). (4) It compares quotes against contract pricing, checks compliance requirements. (5) It routes for approval based on dollar thresholds. (6) Upon approval, it generates and sends the PO. (7) It tracks delivery, matches invoices to POs, and flags discrepancies.",
      "**Compliance automation** is a killer feature. The agent enforces purchasing policies automatically: only approved vendors, mandatory competitive bids above threshold amounts, budget allocation checks, environmental compliance (e.g., conflict mineral certificates), and diversity supplier quotas. Policy violations are caught BEFORE the purchase, not in an audit months later.",
      "**Supplier agent negotiation** via A2A protocol. Your procurement agent can negotiate directly with a supplier's sales agent: 'We need 50 keyboards. Your catalog price is $89. Our contract says $79 for 50+ units. Can you also expedite delivery to April 20?' The agents resolve this in seconds, following pre-set negotiation parameters.",
      "**Spend analytics** emerge naturally from agentic procurement. Every purchase is structured data: who bought what, from which vendor, at what price, approved by whom, delivered when. The agent builds real-time dashboards: spend by category, contract compliance rates, cost savings vs. market prices, vendor performance scores.",
      "**Impact metrics:** Enterprise procurement automation via agents typically shows: 60-80% reduction in purchase cycle time, 10-15% cost savings through better price comparison and contract compliance, 90% reduction in maverick spending (off-contract purchases), and significant reduction in invoice processing costs.",
    ],
    code: `# === B2B Procurement Agent ===
from typing import Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Send

class ProcurementState(TypedDict):
    requisition: dict
    vendor_quotes: Annotated[list[dict], add]
    best_quote: dict
    approval_status: str
    purchase_order: dict

def parse_requisition(state):
    """Parse employee request into structured requisition."""
    return {"requisition": {
        "item": "Ergonomic Keyboard",
        "quantity": 50,
        "specs": {"type": "mechanical", "wireless": True, "ergonomic": True},
        "budget_code": "IT-2026-Q2",
        "requested_by": "jane.doe@company.com",
        "delivery_by": "2026-04-25",
        "estimated_cost": 4500  # Triggers approval policy
    }}

def request_vendor_quotes(state):
    """Fan out to approved vendors via A2A protocol."""
    return {}  # Routing handled by Send

def route_to_vendors(state):
    """Dynamic fan-out: query each approved vendor."""
    vendors = ["vendor_dell", "vendor_logitech", "vendor_microsoft"]
    return [Send("get_quote", {"vendor": v, "requisition": state["requisition"]})
            for v in vendors]

def get_quote(state):
    """Each vendor agent returns a structured quote."""
    vendor = state["vendor"]
    quotes_db = {
        "vendor_dell": {"unit_price": 89.99, "delivery_days": 5, "warranty": "3yr"},
        "vendor_logitech": {"unit_price": 79.99, "delivery_days": 3, "warranty": "2yr"},
        "vendor_microsoft": {"unit_price": 94.99, "delivery_days": 7, "warranty": "3yr"},
    }
    quote = quotes_db.get(vendor, {})
    return {"vendor_quotes": [{
        "vendor": vendor,
        "unit_price": quote["unit_price"],
        "total": quote["unit_price"] * 50,
        "delivery_days": quote["delivery_days"],
        "warranty": quote["warranty"],
    }]}

def evaluate_quotes(state):
    """Rank quotes by value score (price + delivery + warranty)."""
    ranked = sorted(state["vendor_quotes"], key=lambda q: q["total"])
    return {"best_quote": ranked[0]}

def check_approval_needed(state):
    """Route based on approval policy thresholds."""
    total = state["best_quote"]["total"]
    if total < 1000:
        return "auto_approve"
    elif total < 5000:
        return "manager_approval"
    return "director_approval"

def manager_approval(state):
    """Human-in-the-loop: manager reviews and approves."""
    decision = interrupt({
        "type": "procurement_approval",
        "quote": state["best_quote"],
        "message": f"Approve PO for {state['best_quote']['total']}?"
    })
    return {"approval_status": decision}

def generate_po(state):
    """Generate and submit purchase order."""
    if state["approval_status"] != "approved":
        return {"purchase_order": {"status": "rejected"}}
    return {"purchase_order": {
        "po_number": "PO-2026-04-001",
        "vendor": state["best_quote"]["vendor"],
        "total": state["best_quote"]["total"],
        "status": "submitted"
    }}`,
    practice: "Design a compliance check node that validates: (1) vendor is on the approved list, (2) total is within budget allocation, (3) minimum 3 quotes were obtained for orders > $2,500. Return specific violations if any checks fail.",
    solution: `def compliance_check(state):
    """Validate procurement against company policies."""
    violations = []
    req = state["requisition"]
    quote = state["best_quote"]
    quotes = state["vendor_quotes"]

    # Check 1: Approved vendor list
    approved_vendors = ["vendor_dell", "vendor_logitech", "vendor_microsoft",
                        "vendor_hp", "vendor_lenovo"]
    if quote["vendor"] not in approved_vendors:
        violations.append(f"VIOLATION: {quote['vendor']} is not an approved vendor")

    # Check 2: Budget allocation
    budget_remaining = get_budget_remaining(req["budget_code"])
    if quote["total"] > budget_remaining:
        violations.append(
            f"VIOLATION: Total {quote['total']} exceeds remaining budget "
            f"{budget_remaining} for {req['budget_code']}")

    # Check 3: Minimum quotes for large orders
    if quote["total"] > 2500 and len(quotes) < 3:
        violations.append(
            f"VIOLATION: Orders > $2,500 require 3+ quotes. "
            f"Only {len(quotes)} obtained.")

    return {
        "compliance_status": "pass" if not violations else "fail",
        "violations": violations
    }`,
  },
  {
    time: "Hour 8",
    title: "Agent-Ready Data, SEO & Share of Model",
    concept: [
      "**Agent-Ready Data** is the foundation of agentic commerce visibility. If your product data isn't structured, rich, and machine-readable, AI agents literally cannot find or recommend your products. This is the new 'if you're not on Google, you don't exist' — except now it's 'if agents can't parse your data, you don't exist.'",
      "**Structured product attributes** go far beyond name and price. For a running shoe, an agent needs: terrain type, cushioning level, arch support type, drop height (mm), weight, sustainability certifications, best-for conditions (flat feet, knee pain, overpronation), and fit tendency (runs small/large/true). The more attributes you provide, the more precisely an agent can match your product to a user's specific needs.",
      "**JSON-LD and Schema.org markup** are the technical standards. Embed structured product data in your web pages using JSON-LD format with Schema.org types (Product, Offer, AggregateRating, Review). AI agents and crawlers parse this data to build their product understanding. Google's Merchant Center already uses Schema.org — agentic commerce extends this to all AI platforms.",
      "**Share of Model** is the new competitive KPI. It measures how often AI agents recommend your brand when users ask for products in your category. Unlike Google search rankings (which you can see), Share of Model is largely invisible — you need to actively test by querying AI agents with relevant prompts and measuring how often your brand appears. Early movers who optimize for this now will dominate.",
      "**Optimizing for Share of Model:** (1) Rich, accurate product data (JSON-LD, structured attributes). (2) Competitive pricing transparency (agents compare instantly). (3) Strong reviews with high volume. (4) Fast, reliable APIs (slow APIs get deprioritized). (5) Clear return policies (agents factor risk). (6) Content that answers questions agents ask: 'Is this product good for X use case?'",
      "**The death of traditional e-commerce ads?** When an AI agent does the shopping, it doesn't see banner ads, sponsored results, or pop-ups. It evaluates products on merit: data quality, price, reviews, fit. Merchants who relied on advertising to compensate for mediocre products will struggle. Merchants with genuinely good products AND great data will thrive.",
    ],
    code: `# === Making Your Product Data Agent-Ready ===

# 1. JSON-LD Schema.org Markup (Embed in HTML <script> tag)
product_schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ProFit Ergonomic Office Chair",
    "description": "Ergonomic mesh office chair with lumbar support",
    "brand": {"@type": "Brand", "name": "ProFit"},
    "sku": "PF-CHAIR-ERG-001",
    "gtin13": "5901234123457",
    "image": ["https://store.com/images/chair-front.jpg"],
    "offers": {
        "@type": "Offer",
        "url": "https://store.com/products/ergo-chair",
        "price": "349.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "seller": {"@type": "Organization", "name": "ProFit Direct"},
        "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {"@type": "MonetaryAmount", "value": "0", "currency": "USD"},
            "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "businessDays": {"@type": "QuantitativeValue", "minValue": 3, "maxValue": 5}
            }
        },
        "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "returnMethod": "https://schema.org/ReturnByMail"
        }
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.6",
        "reviewCount": "891",
        "bestRating": "5"
    },
    "additionalProperty": [
        {"@type": "PropertyValue", "name": "weight_capacity_lbs", "value": "300"},
        {"@type": "PropertyValue", "name": "adjustable_height", "value": "16-20 inches"},
        {"@type": "PropertyValue", "name": "lumbar_support", "value": "adjustable"},
        {"@type": "PropertyValue", "name": "armrest_type", "value": "4D_adjustable"},
        {"@type": "PropertyValue", "name": "tilt_lock", "value": "yes"},
        {"@type": "PropertyValue", "name": "warranty_years", "value": "10"},
        {"@type": "PropertyValue", "name": "certification", "value": "BIFMA_certified"},
        {"@type": "PropertyValue", "name": "best_for", "value": "long_hours_back_pain"}
    ]
}

# 2. Share of Model Testing Script
import openai

def measure_share_of_model(brand, category, queries, model="gpt-4o-mini"):
    """Test how often an AI agent recommends your brand."""
    client = openai.OpenAI()
    mentions = 0
    for query in queries:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": query}]
        )
        answer = response.choices[0].message.content.lower()
        if brand.lower() in answer:
            mentions += 1
    share = (mentions / len(queries)) * 100
    return {"brand": brand, "category": category,
            "queries_tested": len(queries), "share_of_model": f"{share}%"}

# Test queries for "ergonomic office chairs"
test_queries = [
    "What's the best ergonomic office chair under $400?",
    "Recommend an office chair for someone with back pain",
    "Best office chairs for working from home 2026",
    "Top rated mesh office chairs with lumbar support",
]
result = measure_share_of_model("ProFit", "office_chairs", test_queries)
print(result)  # {"share_of_model": "50%"} — agent mentioned us in 2 of 4 queries`,
    practice: "Write a JSON-LD schema for a coffee machine. Include structured attributes that would help an agent match it to specific user needs (brew methods, capacity, grind settings, water filter type, dimensions for counter space).",
    solution: `coffee_machine_schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "BrewMaster Pro 5000",
    "brand": {"@type": "Brand", "name": "BrewMaster"},
    "sku": "BM-PRO-5000",
    "description": "Professional-grade bean-to-cup coffee machine",
    "offers": {
        "@type": "Offer",
        "price": "599.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1203"
    },
    "additionalProperty": [
        {"@type": "PropertyValue", "name": "brew_methods",
         "value": "espresso,americano,latte,cappuccino,cold_brew"},
        {"@type": "PropertyValue", "name": "grinder", "value": "built_in_ceramic_burr"},
        {"@type": "PropertyValue", "name": "grind_settings", "value": "15"},
        {"@type": "PropertyValue", "name": "water_tank_oz", "value": "67"},
        {"@type": "PropertyValue", "name": "bean_hopper_oz", "value": "10"},
        {"@type": "PropertyValue", "name": "cups_per_day", "value": "20+"},
        {"@type": "PropertyValue", "name": "water_filter", "value": "built_in_charcoal"},
        {"@type": "PropertyValue", "name": "dimensions_inches", "value": "14x10x16"},
        {"@type": "PropertyValue", "name": "weight_lbs", "value": "22"},
        {"@type": "PropertyValue", "name": "milk_frother", "value": "automatic_steam"},
        {"@type": "PropertyValue", "name": "self_cleaning", "value": "yes"},
        {"@type": "PropertyValue", "name": "smart_features", "value": "wifi,app_control"},
        {"@type": "PropertyValue", "name": "best_for",
         "value": "home_barista,office,coffee_enthusiast"}
    ]
}`,
  },
  {
    time: "Hour 9",
    title: "Trust, Security & Governance",
    concept: [
      "**Trust is the unlock.** Consumers will only let AI agents spend their money if they trust the system. And merchants will only open their APIs to agents if they trust the security model. Every layer of agentic commerce — from protocols to payments to data — must be designed trust-first.",
      "**Authentication & Authorization:** Agents authenticate via OAuth 2.0 / API keys with scoped permissions. A shopping agent for Alice has DIFFERENT permissions than a shopping agent for Bob, even if they're the same underlying AI. Each SPT (Shared Payment Token) is bound to a specific user-agent pair with explicit spending limits. No agent can impersonate another or exceed its authorized scope.",
      "**Data privacy & consent:** Agents access sensitive data — purchase history, preferences, addresses, payment methods. GDPR, CCPA, and similar regulations apply. Best practices: (1) Minimize data collection — ask only what's needed. (2) Encrypt data in transit and at rest. (3) Give users a dashboard to see exactly what data each agent has access to. (4) One-click revocation of any agent's access.",
      "**Fraud prevention in agent transactions:** AI agents could be weaponized — a malicious prompt injection could trick an agent into buying unwanted items. Defenses: (1) Hard spending limits enforced at the Stripe/payment level (not by the agent itself). (2) Transaction velocity monitoring — flag unusual purchase patterns. (3) Human-in-the-loop for first-time merchants or unusual categories. (4) Agent behavior auditing — log every decision for review.",
      "**Anti-hallucination guardrails:** An agent might 'hallucinate' product features, misquote prices, or misrepresent return policies. In commerce, this has LEGAL consequences (false advertising, consumer protection laws). Defenses: (1) Ground all product claims in structured data from authoritative sources (UCP manifests). (2) Never let the agent 'guess' a price — always query the live API. (3) Include citation/source tracking for every recommendation.",
      "**Governance framework for enterprises:** (1) **Agent registry** — maintain a catalog of all authorized agents with version history. (2) **Policy engine** — codify purchasing policies as machine-readable rules that agents enforce automatically. (3) **Audit trail** — every agent action is logged: what it queried, what it recommended, what the user approved, what was purchased. (4) **Kill switch** — ability to immediately disable any agent across all threads.",
    ],
    code: `# === Security Architecture for Agentic Commerce ===

# 1. Agent Authentication & Scoped Permissions
agent_config = {
    "agent_id": "agent_shopping_alice_001",
    "owner": "user_alice_123",
    "platform": "openai_chatgpt",
    "created_at": "2026-04-01T10:00:00Z",
    "permissions": {
        "can_search": True,
        "can_compare": True,
        "can_purchase": True,           # Requires SPT
        "can_access_address": True,     # For shipping calculations
        "can_access_history": True,     # For personalization
        "can_negotiate": False,         # B2C agent doesn't negotiate
        "max_concurrent_sessions": 3,
    },
    "restrictions": {
        "blocked_merchants": ["shady_store_123"],
        "blocked_categories": ["weapons", "adult"],
        "require_approval_for": ["first_time_merchant", "international"],
    },
    "audit": {
        "log_all_queries": True,
        "log_recommendations": True,
        "log_purchases": True,
        "retention_days": 365,
    }
}

# 2. Transaction Audit Trail
audit_log_entry = {
    "timestamp": "2026-04-13T18:00:00Z",
    "agent_id": "agent_shopping_alice_001",
    "action": "purchase_executed",
    "details": {
        "merchant": "TrailRunner Pro Shop",
        "product_sku": "TRP-SHOE-001",
        "product_name": "CloudTrail Ultra Running Shoe",
        "price_quoted": 89.99,
        "price_charged": 89.99,  # Must match!
        "discount_applied": "TRAIL10 (10%)",
        "final_total": 80.99,
        "payment_token": "spt_abc123 (last 4: 7890)",
        "user_approved": True,
        "approval_timestamp": "2026-04-13T17:59:45Z",
    },
    "data_sources_consulted": [
        "ucp://trailrunner.shopify.com/manifest.json",
        "mcp://inventory.trailrunner.com/check_stock"
    ],
    "recommendation_reasoning": "Highest value score: 4.6 rating, free shipping, "
                                "matches user's trail running preference and size 10.5",
}

# 3. Anti-Hallucination: Ground Claims in Structured Data
class GroundedRecommendation:
    """Every claim must trace back to a source."""
    def __init__(self, product, source_url):
        self.product = product
        self.source = source_url
        self.claims = []  # Each claim has a source field

    def add_claim(self, claim: str, source_field: str, source_value):
        self.claims.append({
            "claim": claim,
            "source": self.source,
            "field": source_field,
            "verified_value": source_value,
            "agent_interpretation": claim,  # If differs → FLAG
        })

# If the agent says "Free shipping!" but the UCP says shipping=$4.99
# → MISMATCH DETECTED → agent is corrected automatically`,
    practice: "Design an audit dashboard specification for agentic commerce. What metrics would you track? What alerts would you set? How would you visualize agent behavior over time?",
    solution: `audit_dashboard_spec = {
    "real_time_metrics": {
        "active_agents": "Count of currently active shopping agents",
        "transactions_today": "Total purchases made by agents today",
        "total_spend_today": "Cumulative $ amount spent by all agents",
        "approval_queue": "Pending human approvals",
        "blocked_transactions": "Transactions rejected by spending controls",
    },
    "alerts": [
        {"trigger": "spend_velocity", "condition": "> 3x daily average",
         "action": "notify_owner + pause_agent"},
        {"trigger": "new_merchant", "condition": "first_purchase_from_merchant",
         "action": "require_manual_approval"},
        {"trigger": "failed_auth", "condition": "> 3 failed SPT validations",
         "action": "lock_agent + notify_security"},
        {"trigger": "price_mismatch", "condition": "quoted != charged",
         "action": "flag_for_review + hold_payment"},
        {"trigger": "hallucination_detected", "condition": "claim != source_data",
         "action": "log_warning + correct_user"},
    ],
    "historical_views": {
        "spend_by_category": "Pie chart: where is money going?",
        "agent_accuracy": "% of recommendations accepted by user",
        "savings_tracker": "$ saved vs. retail price per month",
        "merchant_distribution": "Which merchants are agents choosing?",
        "return_rate_by_agent": "Are agent purchases returned less often?",
    }
}`,
  },
  {
    time: "Hour 10",
    title: "Business ROI, Strategy & The Future",
    concept: [
      "**Agentic commerce is not a feature — it's a business model shift.** For merchants, it means moving from human-optimized websites to agent-optimized APIs. For enterprises, it means automating procurement and vendor management. For consumers, it means delegating routine purchasing to trusted AI agents. The businesses that adapt first will capture outsized market share.",
      "**ROI framework for merchants:** (1) **Revenue uplift** — agents access your products through new channels (ChatGPT, Gemini, Copilot), reaching users who never visited your website. Early data shows 15-25% incremental revenue from agent channels. (2) **Conversion improvement** — agents don't abandon carts. Once they select a product, checkout is programmatic. Cart abandonment drops from 70% (human) to ~5% (agent). (3) **Reduced CAC** — agents find products based on merit (data quality, price, reviews), not ad spend. Customer acquisition cost shifts from marketing budget to data infrastructure investment.",
      "**ROI framework for enterprises:** (1) **Procurement savings** — 10-15% cost reduction through better price comparison and contract compliance. (2) **Time savings** — purchase cycle time drops from 3-5 days to under 1 hour. (3) **Compliance** — near-zero maverick spending, automatic policy enforcement. (4) **Headcount efficiency** — procurement team focuses on strategic vendor relationships instead of transactional processing.",
      "**Strategic playbook:** (1) **Audit your data** — is your product catalog in structured format? Can an agent parse your attributes, pricing, inventory, and policies? (2) **Implement protocols** — start with JSON-LD/Schema.org, then adopt ACP/UCP endpoints. (3) **Build an MCP server** — expose your product catalog and inventory as agent-callable tools. (4) **Monitor Share of Model** — test regularly how often agents recommend you. (5) **Start with B2B** — procurement automation has the fastest, most measurable ROI.",
      "**The future: 2027 and beyond.** Predicted evolution: (1) **Agent marketplaces** — curated directories of specialized shopping agents (grocery agent, travel agent, fashion stylist agent). (2) **Agent loyalty programs** — brands offer incentives to agents that consistently recommend their products (the ad model reimagined). (3) **Predictive purchasing** — agents buy things BEFORE you need them based on consumption patterns. (4) **Multi-agent orchestration** — your personal agent coordinates with specialized category agents, each expert in their domain.",
      "**The bottom line:** Agentic commerce isn't replacing e-commerce — it's EVOLVING it. The same way mobile commerce didn't kill desktop shopping but fundamentally changed how people buy things, agentic commerce will fundamentally change WHO (or what) does the buying. The question isn't whether to adopt it — it's how fast you can move.",
    ],
    code: `# === ROI Calculator for Agentic Commerce ===

def calculate_merchant_roi(
    monthly_revenue: float,
    current_cart_abandonment: float,
    current_cac: float,
    agent_channel_traffic_pct: float = 0.10,
    agent_conversion_rate: float = 0.95,
    data_infrastructure_cost: float = 50000,
):
    """Calculate projected ROI of enabling agentic commerce."""

    # Revenue from agent channel
    agent_sessions = monthly_revenue / 100 * agent_channel_traffic_pct * 100
    agent_revenue = agent_sessions * agent_conversion_rate
    human_recovery = monthly_revenue * current_cart_abandonment * 0.15
    total_new_revenue = agent_revenue + human_recovery

    # CAC savings (agents find you organically through data quality)
    cac_savings = current_cac * 0.30  # 30% reduction in CAC

    # ROI calculation
    annual_benefit = (total_new_revenue * 12) + (cac_savings * 12)
    roi_pct = ((annual_benefit - data_infrastructure_cost)
               / data_infrastructure_cost * 100)

    return {
        "monthly_agent_revenue": "$" + f"{total_new_revenue:,.2f}",
        "annual_benefit": "$" + f"{annual_benefit:,.2f}",
        "infrastructure_cost": "$" + f"{data_infrastructure_cost:,.2f}",
        "roi_percentage": f"{roi_pct:.0f}%",
        "payback_months": round(data_infrastructure_cost / (annual_benefit / 12), 1),
    }

# Example: Mid-size retailer
result = calculate_merchant_roi(
    monthly_revenue=500000,
    current_cart_abandonment=0.70,
    current_cac=45,
    agent_channel_traffic_pct=0.10,
)
print(result)
# roi_percentage: ~800%+, payback_months: ~1.5

# === Agent-Readiness Scorecard ===
def assess_agent_readiness(merchant: dict) -> dict:
    """Score a merchant's readiness for agentic commerce (0-100)."""
    score = 0
    checks = []

    # Data quality (40 points)
    if merchant.get("json_ld_markup"):
        score += 15; checks.append("✅ JSON-LD product markup")
    else:
        checks.append("❌ Missing JSON-LD markup")

    if merchant.get("structured_attributes"):
        score += 15; checks.append("✅ Structured product attributes")
    else:
        checks.append("❌ Generic product descriptions only")

    if merchant.get("real_time_inventory"):
        score += 10; checks.append("✅ Real-time inventory API")
    else:
        checks.append("❌ No programmatic inventory access")

    # Protocol support (30 points)
    if merchant.get("acp_endpoint"):
        score += 15; checks.append("✅ ACP checkout endpoint")
    else:
        checks.append("❌ No agent checkout API")

    if merchant.get("ucp_manifest"):
        score += 10; checks.append("✅ UCP store manifest")
    else:
        checks.append("❌ No machine-readable store policies")

    if merchant.get("mcp_server"):
        score += 5; checks.append("✅ MCP tool server")
    else:
        checks.append("⚠️ No MCP server (optional)")

    # Payment (20 points)
    if merchant.get("spt_support"):
        score += 20; checks.append("✅ Stripe SPT payment support")
    else:
        checks.append("❌ No tokenized agent payment")

    # Reviews & Trust (10 points)
    if merchant.get("avg_rating", 0) >= 4.0 and merchant.get("review_count", 0) >= 100:
        score += 10; checks.append("✅ Strong reviews (4.0+ / 100+)")
    else:
        checks.append("⚠️ Insufficient reviews for agent trust")

    grade = "A" if score >= 85 else "B" if score >= 65 else "C" if score >= 45 else "F"
    return {"score": score, "grade": grade, "checks": checks}`,
    practice: "Create an agent-readiness scorecard for your own business or a business you know. Evaluate each dimension (data, protocols, payments, reviews) and create a concrete 90-day roadmap to move from your current grade to an 'A'.",
    solution: `# Example: "Bella's Boutique" — a small fashion retailer

current_state = {
    "json_ld_markup": False,
    "structured_attributes": False,    # Only has name + price
    "real_time_inventory": False,      # Manual stock counts
    "acp_endpoint": False,
    "ucp_manifest": False,
    "mcp_server": False,
    "spt_support": False,              # Stripe but no SPT
    "avg_rating": 4.2,
    "review_count": 89,
}
# Score: 0/100, Grade: F

roadmap_90_days = {
    "days_1_to_30": {
        "focus": "Data Foundation",
        "actions": [
            "Add JSON-LD Schema.org markup to all product pages",
            "Enrich product attributes: material, fit, occasion, style",
            "Integrate Shopify real-time inventory API",
            "Target score: +40 points → Grade C",
        ]
    },
    "days_31_to_60": {
        "focus": "Protocol Enablement",
        "actions": [
            "Enable Shopify Agentic Storefronts (generates UCP manifest)",
            "Implement ACP checkout endpoint via Shopify's agent toolkit",
            "Register with Stripe Agentic Commerce Suite for SPT support",
            "Target score: +45 points → Grade B",
        ]
    },
    "days_61_to_90": {
        "focus": "Optimization & Monitoring",
        "actions": [
            "Build MCP server exposing search + inventory tools",
            "Launch review collection campaign (target: 100+ reviews)",
            "Start measuring Share of Model weekly",
            "A/B test product attribute richness vs. agent recommendation rate",
            "Target score: +15 points → Grade A (100/100)",
        ]
    }
}`,
  },
];
