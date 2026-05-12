import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft, MessageSquare, ChevronDown, ChevronUp, Zap, Layers } from "lucide-react";
import { eksCfnLessons as lessons, eksCfnInterviewQA } from "./eksCfnLessons";

function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-slate-300 leading-relaxed text-sm sm:text-base mb-3 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j} className="text-blue-300 font-semibold">{part.slice(2, -2)}</strong>;
          if (part.startsWith("`") && part.endsWith("`"))
            return <code key={j} className="px-1.5 py-0.5 rounded bg-slate-800 text-green-300 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

function QACard({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left bg-slate-900/60 hover:bg-slate-900 transition-colors">
        <span className="text-slate-200 text-sm font-medium leading-relaxed">{item.q}</span>
        {open ? <ChevronUp size={16} className="text-blue-400 mt-0.5 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 mt-0.5 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-slate-950/40">
          <p className="text-slate-300 text-sm leading-relaxed mb-3">{item.a}</p>
          <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            <Zap size={13} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-blue-300 text-xs leading-relaxed">{item.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EksCfnTraining() {
  const [tab, setTab] = useState("lessons");
  const [idx, setIdx] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState({});

  const lesson = lessons[idx];
  const progress = ((idx + 1) / lessons.length) * 100;
  const go = (d) => { setShowSolution(false); setIdx(i => Math.max(0, Math.min(lessons.length - 1, i + d))); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="w-full px-4 sm:px-10 lg:px-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Trainings
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Layers size={22} />
            <h1 className="text-2xl sm:text-3xl font-bold">EKS + CloudFormation — 3-Tier App Deployment</h1>
          </div>
          <p className="text-slate-400 text-sm">8 end-to-end lessons deploying a secure, resilient 3-tier app (React frontend, Spring Boot backend, Aurora PostgreSQL) on EKS using CloudFormation. Covers VPC, IRSA, Secrets Store CSI, ALB Ingress, HPA, PDB, and Interview Q&A.</p>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setTab("lessons")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "lessons" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              <BookOpen size={15} /> Lessons
            </button>
            <button onClick={() => setTab("qa")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "qa" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              <MessageSquare size={15} /> Interview Q&A
            </button>
          </div>
        </header>

        {tab === "lessons" && (
          <>
            <div className="mb-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>Lesson {idx + 1} of {lessons.length}</span>
                <span>{Object.values(completed).filter(Boolean).length} completed</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-blue-400 uppercase tracking-wider mb-2">
                <Clock size={14} /> {lesson.time}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{lesson.title}</h2>

              <section className="mb-5">
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-2"><Lightbulb size={16} /> Concept</div>
                <div>{renderConcept(lesson.concept)}</div>
              </section>

              <section className="mb-5">
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2"><Code2 size={16} /> Code & CLI Examples</div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre">{lesson.code}</pre>
              </section>

              <section className="mb-5">
                <div className="text-purple-400 text-sm font-semibold mb-2">Practice Exercise</div>
                <p className="text-slate-300 text-sm sm:text-base mb-3">{lesson.practice}</p>
                <button onClick={() => setShowSolution(s => !s)} className="text-xs px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30">
                  {showSolution ? "Hide solution" : "Show solution"}
                </button>
                {showSolution && (
                  <pre className="mt-3 bg-black/60 border border-purple-900/50 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre">{lesson.solution}</pre>
                )}
              </section>

              <button onClick={() => setCompleted(c => ({ ...c, [idx]: !c[idx] }))}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${completed[idx] ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>
                <CheckCircle2 size={16} /> {completed[idx] ? "Completed" : "Mark as complete"}
              </button>
            </div>

            <nav className="flex justify-between mt-5">
              <button onClick={() => go(-1)} disabled={idx === 0} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700">
                <ChevronLeft size={18} /> Prev
              </button>
              <div className="flex gap-1.5 items-center flex-wrap justify-center">
                {lessons.map((_, i) => (
                  <button key={i} onClick={() => { setIdx(i); setShowSolution(false); }}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? "bg-blue-400 w-6" : completed[i] ? "bg-green-500" : "bg-slate-700"}`}
                    aria-label={`Lesson ${i + 1}`} />
                ))}
              </div>
              <button onClick={() => go(1)} disabled={idx === lessons.length - 1} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500">
                Next <ChevronRight size={18} />
              </button>
            </nav>
          </>
        )}

        {tab === "qa" && (
          <div>
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 text-sm font-medium mb-1">AWS DevOps Interview Prep — EKS & CloudFormation</p>
              <p className="text-slate-400 text-xs">Click any question to reveal the answer and interview tip. Covers architecture, security, operations, and resilience.</p>
            </div>
            {eksCfnInterviewQA.map((section) => (
              <div key={section.category} className="mb-8">
                <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-5 bg-blue-400 rounded-full inline-block" />
                  {section.category}
                </h2>
                {section.questions.map((item, i) => <QACard key={i} item={item} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
