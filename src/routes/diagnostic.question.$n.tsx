import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, TOTAL_QUESTIONS, formatTime, loadDiag, saveDiag, type AnswerRecord } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { sfx } from "@/lib/sfx";
import { DiagAvatar, AVATAR_IMAGES, type AvatarId } from "@/components/DiagAvatar";

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
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const [bolts, setBolts] = useState<Array<{ id: number; sx: number; sy: number; ex: number; ey: number; angle: number; delay: number; rot: number }>>([]);
  const boltSeq = useRef(0);

  const fireBolts = (choiceIdx: number) => {
    const btn = choiceRefs.current[choiceIdx];
    const target = progressFillRef.current || progressRef.current;
    if (!btn || !target) return;
    const b = btn.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sx = b.left + b.width / 2;
    const sy = b.top + b.height / 2;
    // aim for the leading edge of the next progress fill
    const nextPct = ((idx) / TOTAL_QUESTIONS);
    const ex = t.left + t.width * Math.min(1, nextPct);
    const ey = t.top + t.height / 2;
    const count = 14;
    const newBolts = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      return {
        id: ++boltSeq.current,
        sx, sy, ex, ey, angle,
        delay: Math.random() * 60,
        rot: Math.random() * 360,
      };
    });
    setBolts(prev => [...prev, ...newBolts]);
    // cleanup
    window.setTimeout(() => {
      setBolts(prev => prev.filter(x => !newBolts.find(n => n.id === x.id)));
    }, 900);
  };

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

  const submit = (choiceIdx: number) => {
    if (submitted) return;
    setSelected(choiceIdx);
    setSubmitted(true);
    sfx.tap();
    fireBolts(choiceIdx);
    const elapsedSeconds = (Date.now() - startRef.current) / 1000;
    const correct = choiceIdx === question.correctIndex;
    const record: AnswerRecord = { n: question.n, choice: choiceIdx, correct, elapsedSeconds };
    const next = { ...diag, answers: [...diag.answers.filter(a => a.n !== question.n), record].sort((a, b) => a.n - b.n) };
    saveDiag(next);
    setDiag(next);

    setTimeout(() => {
      if (isLast) {
        navigate({ to: "/diagnostic/results" as any });
      } else {
        navigate({ to: "/diagnostic/question/$n" as any, params: { n: String(idx + 1) } as any });
      }
    }, 320);
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
            <DiagAvatar
              id={(diag.avatarId in AVATAR_IMAGES ? diag.avatarId : "fox") as AvatarId}
              color={diag.color}
              size={36}
              ringWidth={2}
            />
            <span className="text-sm font-bold text-[var(--lavender)] truncate">{diag.name || "You"}</span>
          </div>

          {/* Progress center */}
          <div className="flex-1">
            <div className="text-center text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(246,240,250,0.7)" }}>
              Question {idx} of {TOTAL_QUESTIONS}
            </div>
            <div ref={progressRef} className="mt-1 h-1.5 rounded-full overflow-hidden relative" style={{ background: "rgba(246,240,250,0.1)" }}>
              <div ref={progressFillRef} className="h-full transition-all duration-500 relative" style={{ width: `${progressPct}%`, background: "var(--volt)", boxShadow: bolts.length ? "0 0 14px #B8FF00, 0 0 28px rgba(184,255,0,0.6)" : undefined }} />
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
              let bg = "#fff";
              let border = "1.5px solid rgba(29,41,0,0.12)";
              if (isSelected) {
                bg = "rgba(168,85,247,0.18)";
                border = "2px solid var(--neon)";
              }

              return (
                <button
                  key={i}
                  ref={(el) => { choiceRefs.current[i] = el; }}
                  disabled={submitted}
                  onClick={() => submit(i)}
                  className="text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3"
                  style={{ background: bg, border, color: "var(--ink)" }}
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

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs" style={{ color: "rgba(246,240,250,0.4)" }}>
            Exit diagnostic
          </Link>
        </div>
      </main>
    </div>
  );
}
