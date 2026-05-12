import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, BookOpen, Code2, CheckCircle2,
  Clock, Lightbulb, ArrowLeft, Cloud, Shield, Activity
} from "lucide-react";

import { awsLessons as lessons } from "./awsLessons";

const TOPIC_ICONS = [Cloud, Shield, Activity];
const ACCENT_COLORS = [
  { pill: "text-orange-400", bar: "from-orange-400 to-amber-500",  glow: "from-orange-500/10 via-transparent" },
  { pill: "text-blue-400",   bar: "from-blue-400 to-cyan-500",    glow: "from-blue-500/10 via-transparent"   },
  { pill: "text-emerald-400",bar: "from-emerald-400 to-teal-500", glow: "from-emerald-500/10 via-transparent" },
];


function renderConcept(paragraphs) {
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-slate-300 leading-relaxed text-sm sm:text-base mb-4 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j} className="text-yellow-300 font-semibold">{part.slice(2, -2)}</strong>;
          if (part.startsWith("`") && part.endsWith("`"))
            return <code key={j} className="px-1.5 py-0.5 rounded bg-slate-800 text-green-300 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function AwsCloudTraining() {
  const [idx, setIdx]               = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted]   = useState({});

  const lesson   = lessons[idx];
  const colors   = ACCENT_COLORS[idx % ACCENT_COLORS.length];
  const TopicIcon = TOPIC_ICONS[idx % TOPIC_ICONS.length];
  const progress = ((idx + 1) / lessons.length) * 100;

  const go = (d) => {
    setShowSolution(false);
    setIdx((i) => Math.max(0, Math.min(lessons.length - 1, i + d)));
  };
  const toggleComplete = () => setCompleted((c) => ({ ...c, [idx]: !c[idx] }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── subtle hero gradient ── */}
      <div className={`fixed inset-0 pointer-events-none bg-gradient-to-br ${colors.glow} to-transparent opacity-60 transition-all duration-700`} />

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-14 py-8">

        {/* ── back link ── */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-yellow-400 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Trainings
        </Link>

        {/* ── course header ── */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Cloud size={22} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                AWS Cloud Foundations
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 uppercase tracking-wider">
                Core AWS Concepts · Growing Curriculum
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-sm mt-3 max-w-3xl">
            Start here before touching any AWS service. Understand the global infrastructure model, account isolation,
            and IAM — the access control layer that governs every API call you will ever make on AWS.
          </p>

          {/* progress bar */}
          <div className="mt-5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bar} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-500">
            <span>Lesson {idx + 1} of {lessons.length}</span>
            <span>{Object.values(completed).filter(Boolean).length} of {lessons.length} completed</span>
          </div>
        </header>

        {/* ── lesson dot nav ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {lessons.map((l, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setShowSolution(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${i === idx
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                  : completed[i]
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
            >
              {completed[i] && <CheckCircle2 size={11} />}
              {l.time}
            </button>
          ))}
        </div>

        {/* ── lesson card ── */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* card top strip */}
          <div className={`h-1 bg-gradient-to-r ${colors.bar}`} />

          <div className="p-6 sm:p-8">
            <div className={`flex items-center gap-2 text-xs ${colors.pill} uppercase tracking-wider font-semibold mb-2`}>
              <Clock size={13} /> {lesson.time}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <TopicIcon size={20} className={colors.pill} />
              {lesson.title}
            </h2>

            {/* ── CONCEPT ── */}
            <section className="mt-6 mb-6">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
                <Lightbulb size={16} /> Concept
              </div>
              <div className="space-y-1">
                {renderConcept(lesson.concept)}
              </div>
            </section>

            <div className="border-t border-slate-800 pt-6 mb-6" />

            {/* ── CODE ── */}
            <section className="mb-6">
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-3">
                <Code2 size={16} /> Sample Code & Commands
              </div>
              <pre className="bg-black/70 border border-slate-800 rounded-xl p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre leading-relaxed">
                {lesson.code}
              </pre>
            </section>

            <div className="border-t border-slate-800 pt-6 mb-6" />

            {/* ── PRACTICE ── */}
            <section className="mb-6">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-3">
                💡 Practice Scenario
              </div>
              <div className="bg-purple-900/10 border border-purple-900/30 rounded-xl p-4">
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{lesson.practice}</p>
              </div>
              <button
                onClick={() => setShowSolution((s) => !s)}
                className="mt-3 text-xs px-4 py-2 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-all"
              >
                {showSolution ? "Hide solution ▲" : "Show solution ▼"}
              </button>
              {showSolution && (
                <pre className="mt-3 bg-black/70 border border-purple-900/40 rounded-xl p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 whitespace-pre leading-relaxed">
                  {lesson.solution}
                </pre>
              )}
            </section>

            {/* ── COMPLETE BUTTON ── */}
            <button
              onClick={toggleComplete}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                ${completed[idx]
                  ? "bg-green-500/15 text-green-300 border-green-500/40 hover:bg-green-500/20"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
            >
              <CheckCircle2 size={16} />
              {completed[idx] ? "Marked as complete ✓" : "Mark as complete"}
            </button>
          </div>
        </div>

        {/* ── prev / next nav ── */}
        <nav className="flex justify-between mt-5">
          <button
            onClick={() => go(-1)}
            disabled={idx === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <button
            onClick={() => go(1)}
            disabled={idx === lessons.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-500 text-slate-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400 transition"
          >
            Next <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}
