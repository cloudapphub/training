import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2, Clock, Lightbulb, ArrowLeft } from "lucide-react";
import { migrationLessons as lessons } from "./migrationLessons";

function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
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

export default function MigrationEKS() {
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
            <h1 className="text-2xl sm:text-3xl font-bold">Migration to AWS EKS — Mid-Level</h1>
          </div>
          <p className="text-slate-400 text-sm">
            8 focused hours. Migrate on-prem applications to AWS using Terraform and EKS, from assessment to cutover.
          </p>
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Lesson {idx + 1} of {lessons.length}</span>
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
                onClick={() => { setIdx(i); setShowSolution(false); }}
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
