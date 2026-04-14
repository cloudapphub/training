import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Clock, ArrowRight, Sparkles, Code2, Brain, Search, Server, CloudUpload, Database, FileCode, Boxes, Shield, Workflow, ShoppingBag } from "lucide-react";

const courses = [
  {
    id: "python-one-day",
    path: "/python-one-day",
    title: "Python in One Day",
    subtitle: "Mid-Level Fundamentals",
    description:
      "Eight focused hours covering data structures, comprehensions, decorators, generators, and more. Read, code, practice.",
    duration: "8 hours",
    lessons: 9,
    icon: Code2,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    glowColor: "rgba(245,158,11,0.15)",
    tags: ["Data Structures", "OOP", "Generators", "Decorators"],
  },
  {
    id: "prompt-engineering",
    path: "/prompt-engineering",
    title: "Prompt Engineering",
    subtitle: "A One-Day Curriculum",
    description:
      "Nine lessons on crafting precise, effective prompts — from anatomy and clarity to chain-of-thought, structured output, and evaluation.",
    duration: "9 hours",
    lessons: 10,
    icon: Brain,
    gradient: "from-rose-500 via-pink-500 to-purple-500",
    glowColor: "rgba(244,63,94,0.15)",
    tags: ["Few-Shot", "Chain-of-Thought", "Structured Output", "Evaluation"],
  },
  {
    id: "terraform-one-day",
    path: "/terraform-one-day",
    title: "Terraform for AWS",
    subtitle: "Mid-Level Infrastructure as Code",
    description:
      "Eight hours mastering HCL, provider configuration, VPC networking, security groups, ECS Fargate, state management, modules, and CI/CD pipelines — all focused on AWS.",
    duration: "8 hours",
    lessons: 9,
    icon: Server,
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    glowColor: "rgba(20,184,166,0.15)",
    tags: ["VPC", "ECS Fargate", "IAM", "Modules", "CI/CD"],
  },
  {
    id: "migration-eks",
    path: "/migration-eks",
    title: "Migration to AWS EKS",
    subtitle: "On-Prem to Cloud with Terraform",
    description:
      "Eight hours covering the full migration journey — assessment, hybrid networking, EKS clusters, IRSA, containerization, data migration, Kubernetes ingress, and production cutover.",
    duration: "8 hours",
    lessons: 9,
    icon: CloudUpload,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glowColor: "rgba(245,158,11,0.15)",
    tags: ["EKS", "VPN/Transit GW", "IRSA", "ECR", "Blue-Green Cutover"],
  },
  {
    id: "springboot-eks-aurora",
    path: "/springboot-eks-aurora",
    title: "Spring Boot on EKS + Aurora",
    subtitle: "Database Connectivity & Credential Rotation",
    description:
      "Eight hours connecting Spring Boot to Aurora PostgreSQL on EKS — Secrets Manager, IRSA, HikariCP tuning, automatic credential rotation, Flyway migrations, and production monitoring.",
    duration: "8 hours",
    lessons: 9,
    icon: Database,
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    glowColor: "rgba(16,185,129,0.15)",
    tags: ["Spring Boot", "Aurora PostgreSQL", "Secrets Manager", "Credential Rotation", "Flyway"],
  },
  {
    id: "terraform-hcl",
    path: "/terraform-hcl",
    title: "Terraform HCL Deep Dive",
    subtitle: "Language, State & Recovery",
    description:
      "Eight hours mastering HCL syntax, types, loops, functions, state internals, locking, accidental deletion recovery, drift detection, imports, and production state management.",
    duration: "8 hours",
    lessons: 9,
    icon: FileCode,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "rgba(139,92,246,0.15)",
    tags: ["HCL Syntax", "State Locking", "Drift Recovery", "Import", "Workspaces"],
  },
  {
    id: "genai-llm",
    path: "/genai-llm",
    title: "Generative AI & LLM Concepts",
    subtitle: "Mid-Level Practitioner Course",
    description:
      "Eight hours covering transformers, API integration (OpenAI/Bedrock), embeddings, RAG pipelines, function calling, structured output, LangChain agents, fine-tuning, and production patterns.",
    duration: "8 hours",
    lessons: 9,
    icon: Sparkles,
    gradient: "from-sky-500 via-indigo-500 to-violet-500",
    glowColor: "rgba(99,102,241,0.15)",
    tags: ["Transformers", "RAG", "Embeddings", "Function Calling", "LangChain"],
  },
  {
    id: "eks-managed-nodes",
    path: "/eks-managed-nodes",
    title: "AWS EKS Managed Nodes",
    subtitle: "Deep Dive & Best Practices",
    description:
      "Ten hours mastering EKS managed node groups — architecture, VPC CNI networking, Cluster Autoscaler vs Karpenter, IRSA, security hardening, AMI upgrades, cost optimization, and production patterns.",
    duration: "10 hours",
    lessons: 10,
    icon: Boxes,
    gradient: "from-blue-500 via-sky-500 to-cyan-500",
    glowColor: "rgba(14,165,233,0.15)",
    tags: ["EKS", "Managed Nodes", "Karpenter", "IRSA", "VPC CNI", "Security"],
  },
  {
    id: "hsm-swift",
    path: "/hsm-swift",
    title: "HSM & SWIFT Payments",
    subtitle: "Cross-Border Payment Security",
    description:
      "Ten hours covering HSM architecture, PKCS#11, key ceremonies, SWIFT infrastructure (SAA/SAG/SNL), XML Digital Signatures, three cryptographic layers, and hands-on SoftHSM2 signing.",
    duration: "10 hours",
    lessons: 10,
    icon: Shield,
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    glowColor: "rgba(20,184,166,0.15)",
    tags: ["HSM", "SWIFT", "PKCS#11", "XMLDSig", "pacs.008", "Cryptography"],
  },
  {
    id: "langgraph",
    path: "/langgraph",
    title: "LangGraph Agents",
    subtitle: "Stateful AI Workflows",
    description:
      "Ten hours mastering LangGraph — StateGraph, reducers, conditional routing, ReAct tool calling, checkpointing, human-in-the-loop, streaming, error handling, map-reduce with Send, and production deployment.",
    duration: "10 hours",
    lessons: 10,
    icon: Workflow,
    gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
    glowColor: "rgba(139,92,246,0.15)",
    tags: ["LangGraph", "Agents", "StateGraph", "HITL", "Streaming", "Tools"],
  },
  {
    id: "agentic-commerce",
    path: "/agentic-commerce",
    title: "Agentic Commerce",
    subtitle: "AI-Driven Shopping & Procurement",
    description:
      "Ten hours mastering Agentic Commerce — ACP, UCP, MCP & A2A protocols, Stripe tokenized payments (SPTs), Shopify Agentic Storefronts, shopping agents, hyper-personalization, B2B procurement automation, agent-ready SEO, trust & security, and ROI strategy.",
    duration: "10 hours",
    lessons: 10,
    icon: ShoppingBag,
    gradient: "from-emerald-500 via-amber-500 to-orange-500",
    glowColor: "rgba(16,185,129,0.15)",
    tags: ["ACP", "UCP", "MCP", "Stripe SPT", "Shopify", "B2B Procurement"],
  },
  {
    id: "react",
    path: "/react",
    title: "React 19",
    subtitle: "Complete Modern Development Guide",
    description:
      "Ten hours mastering React 19 — JSX, hooks (useState, useReducer, useEffect, useContext), React 19 APIs (useActionState, useOptimistic, use), routing, performance, Server Components, production Vite+TypeScript setup, and backend integration with Spring Boot, FastAPI & Docker Compose.",
    duration: "10 hours",
    lessons: 10,
    icon: Code2,
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    glowColor: "rgba(6,182,212,0.15)",
    tags: ["React 19", "Hooks", "RSC", "Vite", "TypeScript", "TanStack Query"],
  },
  {
    id: "core-java",
    path: "/core-java",
    title: "Core Java",
    subtitle: "Production-Grade Mastery",
    description:
      "Fifteen hours mastering Java 21+ — JVM internals, OOP, records, sealed classes, generics, HashMap internals, equals/hashCode, collections, Streams, functional programming, Runnable/Callable, locks/synchronizers, CompletableFuture, virtual threads, design patterns, memory/GC tuning, reflection, and interview essentials.",
    duration: "15 hours",
    lessons: 15,
    icon: FileCode,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    glowColor: "rgba(245,158,11,0.15)",
    tags: ["Java 21", "OOP", "Streams", "Concurrency", "Virtual Threads", "Records"],
  },
];

export default function TrainingHome() {
  const [query, setQuery] = useState("");

  const filtered = courses.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>

      {/* Animated background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)" }} />
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div className="font-mono text-xs tracking-widest uppercase text-slate-500">
              Training Hub
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-white">Level up your </span>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              skills
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-400 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            Structured, hands-on training courses. Pick a track, work through the lessons at your own pace, and build real muscle memory.

          </p>

          <div className="mt-8 flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles size={16} className="text-purple-400" />
              <span>{courses.length} courses available</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={16} className="text-indigo-400" />
              <span>{courses.reduce((s, c) => s + parseInt(c.duration), 0)} hours of content</span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses by name, topic, or tag…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 backdrop-blur-sm transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>
          {query && (
            <div className="mt-2 text-xs text-slate-500 font-mono">
              {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
            </div>
          )}
        </div>

        {/* Course Cards */}
        <section>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const Icon = course.icon;
              return (
                <Link
                  key={course.id}
                  to={course.path}
                  className="group relative block rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 transition-all duration-500 hover:border-slate-700/80 hover:bg-slate-900/80 hover:shadow-2xl hover:-translate-y-1"
                  style={{ "--glow": course.glowColor }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 30%), ${course.glowColor}, transparent 60%)` }} />

                  <div className="relative z-10">
                    {/* Icon + Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${course.gradient} shadow-lg`}
                        style={{ boxShadow: `0 8px 30px ${course.glowColor}` }}>
                        <Icon size={28} className="text-white" />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50">
                        <Clock size={12} />
                        {course.duration} · {course.lessons} lessons
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">
                      {course.subtitle}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 group-hover:text-white transition-colors"
                      style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {course.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm sm:text-[15px] text-slate-400 leading-relaxed mb-6"
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      {course.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {course.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800/70 text-slate-400 border border-slate-700/50">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      <span>Start training</span>
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 text-center py-16">
                <p className="text-slate-500 text-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                  No courses match "<span className="text-slate-300">{query}</span>"
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-600 font-mono tracking-wider uppercase">
            More courses coming soon
          </p>
        </footer>
      </div>
    </div>
  );
}
