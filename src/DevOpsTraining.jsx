import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft, TerminalSquare } from "lucide-react";
import { devopsLessons as lessons } from "./devopsLessons";

function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-slate-300 leading-relaxed text-sm sm:text-base mb-3 last:mb-0" style={{ fontFamily: "'Inter', sans-serif" }}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} className="text-blue-300 font-semibold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("\`") && part.endsWith("\`")) {
            return <code key={j} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function DevOpsTraining() {
  const [idx, setIdx] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState({});

  const lesson = lessons[idx];
  const progress = ((idx + 1) / lessons.length) * 100;
  const go = (d) => { setShowSolution(false); setIdx((i) => Math.max(0, Math.min(lessons.length - 1, i + d))); };
  const toggleComplete = () => setCompleted((c) => ({ ...c, [idx]: !c[idx] }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 p-4 sm:p-8">
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>
      <div className="w-full px-6 sm:px-10 lg:px-16 relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-6 font-mono">
          <ArrowLeft size={16} /> Back to Trainings
        </Link>
        <header className="mb-6">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <TerminalSquare size={24} />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>AWS DevOps Concepts</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-4xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            10 robust enterprise lessons. Master CI/CD strategies, Trunk-Based Development, Immutable Infrastructure, robust Terraform IaC (with decoupled state), EKS deep dives, Karpenter scaling, and entirely stateless GitOps via ArgoCD — culminating in a complete end-to-end real project.
          </p>
          <div className="mt-6 h-2 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-3 text-xs font-mono text-slate-500">
            <span>Lesson {idx + 1} of {lessons.length}</span>
            <span>{Object.values(completed).filter(Boolean).length} completed</span>
          </div>
        </header>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: "radial-gradient(800px circle at 50% -20%, rgba(59,130,246,0.05), transparent)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest mb-3 bg-blue-500/10 w-max px-3 py-1 rounded-full border border-blue-500/20">
              <Clock size={14} /> {lesson.time}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{lesson.title}</h2>

            <section className="mb-8">
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3 tracking-wide uppercase"><Lightbulb size={16} /> Enterprise Concept</div>
              <div className="bg-slate-950/40 rounded-xl p-5 border border-slate-800/50 shadow-inner">
                {renderConcept(lesson.concept)}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-3 tracking-wide uppercase"><Code2 size={16} /> Blueprint Code Sample</div>
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-black/40 rounded-t-xl border-b border-white/5 flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <pre className="bg-black/80 border border-slate-800 rounded-xl p-5 pt-12 overflow-x-auto text-[13px] sm:text-sm text-slate-300 whitespace-pre shadow-2xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lesson.code}</pre>
              </div>
            </section>

            <section className="mb-8 border-t border-slate-800/50 pt-8 mt-8">
              <div className="text-amber-400 text-sm font-semibold mb-3 tracking-wide uppercase flex items-center gap-2">Architectural Challenge</div>
              <p className="text-amber-100/70 text-sm w-full bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl mb-4 italic leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>"{lesson.practice}"</p>
              
              <button onClick={() => setShowSolution((s) => !s)} className="text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                {showSolution ? "Hide architecture" : "Reveal architecture"}
              </button>
              
              {showSolution && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <pre className="bg-slate-950/90 border border-orange-900/40 border-l-2 border-l-orange-500 rounded-xl p-5 overflow-x-auto text-[13px] sm:text-sm text-slate-300 whitespace-pre shadow-inner" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lesson.solution}</pre>
                </div>
              )}
            </section>

            <button onClick={toggleComplete} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg ${completed[idx] ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10" : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-blue-600/20"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
              <CheckCircle2 size={18} /> {completed[idx] ? "Module Validated" : "Validate & Complete Module"}
            </button>
          </div>
        </div>

        <nav className="flex flex-col sm:flex-row gap-4 sm:justify-between items-center mt-8 pb-12">
          <button onClick={() => go(-1)} disabled={idx === 0} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 border border-slate-800/80 transition-colors">
            <ChevronLeft size={18} /> Previous Module
          </button>
          
          <div className="flex gap-1.5 items-center bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/50">
            {lessons.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); setShowSolution(false); }} title={`Jump to module ${i + 1}`} className={`h-2 rounded-full transition-all duration-300 ${i === idx ? "bg-blue-400 w-6" : completed[i] ? "bg-emerald-500 w-2.5" : "bg-slate-700 w-2.5 hover:bg-slate-500 hover:scale-110"}`} aria-label={`Go to lesson ${i + 1}`} />
            ))}
          </div>

          <button onClick={() => go(1)} disabled={idx === lessons.length - 1} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all">
            Next Module <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}
