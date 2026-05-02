import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, TOTAL_QUESTIONS, formatTime, loadDiag, saveDiag, type AnswerRecord } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/diagnostic/question/$n")({
  head: () => ({ meta: [{ title: "Diagnostic — TestPhi" }] }),
  component: DiagQuestion,
});

function DiagQuestion() {
  const { n } = Route.useParams();
  const navigate = useNavigate();
  const idx = Math.max(1, Math.min(TOTAL_QUESTIONS, parseInt(n, 10) || 1));
  const question = QUESTIONS[idx - 1];

  const [diag, setDiag] = useState(() => loadDiag());
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // If user has no name set, send them back to setup.
  useEffect(() => {
    const s = loadDiag();
    setDiag(s);
    if (!s.name) {
      navigate({ to: "/diagnostic/avatar" as any });
    }
  }, [navigate]);

  // Reset timer + selection on question change.
  useEffect(() => {
    startRef.current = Date.now();
    setSelected(null);
    setSubmitted(false);
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [idx]);

  const isLast = idx === TOTAL_QUESTIONS;

  const submit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const elapsedSeconds = (Date.now() - startRef.current) / 1000;
    const correct = selected === question.correctIndex;
    const record: AnswerRecord = { n: question.n, choice: selected, correct, elapsedSeconds };
    const next = { ...diag, answers: [...diag.answers.filter(a => a.n !== question.n), record].sort((a, b) => a.n - b.n) };
    saveDiag(next);
    setDiag(next);

    // Auto-advance after 1000ms
    setTimeout(() => {
      if (isLast) {
        navigate({ to: "/diagnostic/results" as any });
      } else {
        navigate({ to: "/diagnostic/question/$n" as any, params: { n: String(idx + 1) } });
      }
    }, 1000);
  };

  const overTime = elapsed > question.expectedSeconds;
  const progressPct = (idx / TOTAL_QUESTIONS) * 100;

  return (
    <div className="topo-bg topo-dim min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.9)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-3xl px-5 py-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-9 rounded-full flex items-center justify-center text-xl shrink-0"
              style={{ background: diag.color, border: "2px solid rgba(255,255,255,0.25)" }}>
              {diag.emoji}
            </div>
            <span className="text-sm font-bold text-[var(--lavender)] truncate">{diag.name || "You"}</span>
          </div>

          {/* Progress center */}
          <div className="flex-1">
            <div className="text-center text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(246,240,250,0.7)" }}>
              Question {idx} of {TOTAL_QUESTIONS}
            </div>
            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(246,240,250,0.1)" }}>
              <div className="h-full transition-all duration-500" style={{ width: `${progressPct}%`, background: "var(--volt)" }} />
            </div>
          </div>

          {/* Timer */}
          <div
            className="text-sm font-semibold tabular-nums shrink-0 w-12 text-right transition-opacity"
            style={{ color: "rgba(246,240,250,1)", opacity: overTime ? 0.7 : 0.4 }}
          >
            {formatTime(elapsed)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-8 pb-12">
        {/* Question card */}
        <div className="rounded-2xl p-6 sm:p-8 animate-fade-up"
          style={{ background: "var(--lavender)", color: "var(--ink)" }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#5a4a72" }}>
            {question.domainLabel}
          </div>

          {question.passage && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#3b2f57" }}>
              {question.passage}
            </p>
          )}

          <h1 className="mt-3 text-base sm:text-lg font-bold" style={{ color: "var(--ink)" }}>
            {question.prompt}
          </h1>

          <div className="mt-5 grid gap-2.5">
            {question.choices.map((choice, i) => {
              const isSelected = selected === i;
              const isCorrect = i === question.correctIndex;
              const showCorrect = submitted && isCorrect;
              const showWrong = submitted && isSelected && !isCorrect;

              let bg = "#fff";
              let border = "1.5px solid rgba(29,41,0,0.12)";
              let textColor = "var(--ink)";
              if (showCorrect) {
                bg = "rgba(184,255,0,0.35)"; border = "2px solid var(--volt)";
              } else if (showWrong) {
                bg = "rgba(255,77,109,0.2)"; border = "2px solid #ff4d6d";
              } else if (isSelected) {
                bg = "rgba(74,6,136,0.12)"; border = "2px solid var(--neon)";
              }

              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setSelected(i)}
                  className="text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3"
                  style={{ background: bg, border, color: textColor }}
                >
                  <span className="font-bold mt-0.5 shrink-0" style={{ color: "#5a4a72" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-semibold">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={selected === null || submitted}
          className="btn-volt w-full mt-6 py-4 text-base rounded-2xl"
          style={{ opacity: selected === null || submitted ? 0.4 : 1, cursor: selected === null ? "not-allowed" : "pointer" }}
        >
          {isLast ? "See my results →" : "Next →"}
        </button>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs" style={{ color: "rgba(246,240,250,0.4)" }}>
            Exit diagnostic
          </Link>
        </div>
      </main>
    </div>
  );
}
