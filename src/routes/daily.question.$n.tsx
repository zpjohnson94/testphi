import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { pickDailyQuestions, domainIdFor, type SessionResult } from "@/lib/freeUser";
import { loadFree } from "@/lib/freeUser";
import { PowerUpModal } from "@/components/PowerUpModal";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/daily/question/$n")({
  head: () => ({ meta: [{ title: "Daily 5 — TestPhi" }] }),
  component: DailyQuestion,
});

const SESSION_KEY = "testphi:daily-session:v1";

function loadSessionResults(): SessionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionResult[]) : [];
  } catch {
    return [];
  }
}

function saveSessionResults(r: SessionResult[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(r));
  } catch {}
}

function DailyQuestion() {
  const { n } = Route.useParams();
  const navigate = useNavigate();
  const questions = useMemo(() => pickDailyQuestions(), []);
  const idx = Math.max(1, Math.min(5, parseInt(n, 10) || 1));
  const question = questions[idx - 1];

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [streak] = useState(() => loadFree().streak);
  const startRef = useRef(Date.now());
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [bolts, setBolts] = useState<
    Array<{ id: number; sx: number; sy: number; ex: number; ey: number; angle: number; delay: number; rot: number }>
  >([]);
  const boltSeq = useRef(0);

  const isLast = idx === 5;
  const correct = submitted && selected === question.correctIndex;
  const incorrect = submitted && selected !== question.correctIndex;

  useEffect(() => {
    startRef.current = Date.now();
    setSelected(null);
    setSubmitted(false);
  }, [idx]);

  const fireBolts = (choiceIdx: number) => {
    const btn = choiceRefs.current[choiceIdx];
    const target = progressRef.current;
    if (!btn || !target) return;
    const b = btn.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sx = b.left + b.width / 2;
    const sy = b.top + b.height / 2;
    const nextPct = idx / 5;
    const ex = t.left + t.width * Math.min(1, nextPct);
    const ey = t.top + t.height / 2;
    const count = 14;
    const newBolts = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      return {
        id: ++boltSeq.current,
        sx,
        sy,
        ex,
        ey,
        angle,
        delay: Math.random() * 60,
        rot: Math.random() * 360,
      };
    });
    setBolts((prev) => [...prev, ...newBolts]);
    window.setTimeout(() => {
      setBolts((prev) => prev.filter((x) => !newBolts.find((n) => n.id === x.id)));
    }, 900);
  };

  const submit = (choiceIdx: number) => {
    if (submitted) return;
    setSelected(choiceIdx);
    setSubmitted(true);
    sfx.tap();
    const isCorrect = choiceIdx === question.correctIndex;
    if (isCorrect) fireBolts(choiceIdx);

    const elapsedSeconds = (Date.now() - startRef.current) / 1000;
    const domainId = domainIdFor(question.domainLabel) ?? "math-algebra";
    const record: SessionResult = {
      n: question.n,
      domainId,
      correct: isCorrect,
      elapsedSeconds,
    };
    const all = loadSessionResults().filter((r) => r.n !== question.n);
    all.push(record);
    saveSessionResults(all);
  };

  const goNext = () => {
    if (isLast) {
      navigate({ to: "/daily/complete" as any });
    } else {
      navigate({ to: "/daily/question/$n" as any, params: { n: String(idx + 1) } as any });
    }
  };

  const progressPct = (idx / 5) * 100;

  return (
    <div className="topo-bg topo-dim min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ background: "rgba(29,41,0,0.9)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
      >
        <div className="mx-auto max-w-3xl px-5 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div
              className="text-center text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(246,240,250,0.7)" }}
            >
              Question {idx} of 5
            </div>
            <div
              ref={progressRef}
              className="mt-1 h-1.5 rounded-full overflow-hidden relative"
              style={{ background: "rgba(246,240,250,0.1)" }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: "var(--volt)",
                  boxShadow: bolts.length
                    ? "0 0 14px #B8FF00, 0 0 28px rgba(184,255,0,0.6)"
                    : undefined,
                }}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 shrink-0"
            style={{ background: "rgba(255,230,0,0.12)", border: "1px solid rgba(255,230,0,0.3)" }}
          >
            <Flame className="size-4" style={{ color: "var(--spark)" }} />
            <span className="display text-sm tabular-nums text-[var(--lavender)]">{streak}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-8 pb-12">
        <div
          className="rounded-2xl p-6 sm:p-8 animate-fade-up"
          style={{ background: "var(--lavender)", color: "var(--ink)" }}
        >
          <div
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ background: "rgba(74,6,136,0.12)", color: "var(--violet-deep)" }}
          >
            {question.domainLabel}
          </div>

          {question.passage && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b2f57" }}>
              {question.passage}
            </p>
          )}

          <h1 className="mt-3 text-base sm:text-lg font-bold" style={{ color: "var(--ink)" }}>
            {question.prompt}
          </h1>

          <div className="mt-5 grid gap-2.5">
            {question.choices.map((choice, i) => {
              const isSelected = selected === i;
              const isCorrectChoice = i === question.correctIndex;
              let bg = "#fff";
              let border = "1.5px solid rgba(29,41,0,0.12)";
              let color = "var(--ink)";
              let animClass = "";

              if (submitted) {
                if (isSelected && correct) {
                  bg = "var(--volt)";
                  border = "2px solid var(--volt)";
                  animClass = "animate-pop";
                } else if (isSelected && incorrect) {
                  bg = "#ff4d6d";
                  border = "2px solid #ff4d6d";
                  color = "#fff";
                  animClass = "animate-shake";
                } else if (incorrect && isCorrectChoice) {
                  bg = "#22c55e";
                  border = "2px solid #16a34a";
                  color = "#fff";
                }
              } else if (isSelected) {
                bg = "rgba(168,85,247,0.18)";
                border = "2px solid var(--neon)";
              }

              return (
                <button
                  key={i}
                  ref={(el) => {
                    choiceRefs.current[i] = el;
                  }}
                  disabled={submitted}
                  onClick={() => submit(i)}
                  className={`text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3 ${animClass}`}
                  style={{ background: bg, border, color }}
                >
                  <span className="font-bold mt-0.5 shrink-0 opacity-80">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-semibold">{choice}</span>
                </button>
              );
            })}
          </div>

          {/* Reveal action buttons */}
          {submitted && (
            <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up">
              <button
                onClick={goNext}
                className="btn-volt py-3.5 text-base rounded-2xl"
              >
                {isLast ? "See results →" : "Next question →"}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className={`py-3.5 text-base font-bold rounded-2xl ${
                  incorrect ? "pulse-soft" : ""
                }`}
                style={{
                  background: "var(--violet-deep)",
                  color: "var(--lavender)",
                  border: "2px solid var(--neon)",
                }}
              >
                Answer explanation
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Lightning bolt overlay */}
      <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
        {bolts.map((b) => {
          const burstDist = 60 + Math.random() * 40;
          const midX = b.sx + Math.cos(b.angle) * burstDist;
          const midY = b.sy + Math.sin(b.angle) * burstDist;
          const style: React.CSSProperties = {
            position: "absolute",
            left: 0,
            top: 0,
            willChange: "transform, opacity",
            animation: `bolt-fly 600ms cubic-bezier(0.4, 0, 0.2, 1) ${b.delay}ms forwards`,
            ["--sx" as any]: `${b.sx - 7}px`,
            ["--sy" as any]: `${b.sy - 9}px`,
            ["--mx" as any]: `${midX - 7}px`,
            ["--my" as any]: `${midY - 9}px`,
            ["--ex" as any]: `${b.ex - 7}px`,
            ["--ey" as any]: `${b.ey - 9}px`,
            ["--r0" as any]: `${b.rot}deg`,
            ["--r1" as any]: `${b.rot + 180}deg`,
          };
          return (
            <svg key={b.id} width="14" height="18" viewBox="0 0 14 18" style={style}>
              <path
                d="M8 0 L0 10 L5 10 L4 18 L14 7 L8 7 Z"
                fill="#B8FF00"
                style={{
                  filter:
                    "drop-shadow(0 0 4px #B8FF00) drop-shadow(0 0 8px rgba(184,255,0,0.7))",
                }}
              />
            </svg>
          );
        })}
      </div>

      <PowerUpModal open={showModal} onClose={() => setShowModal(false)} />

      <style>{`
        @keyframes bolt-fly {
          0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--r0)) scale(0.4); opacity: 0; }
          15%  { transform: translate(var(--mx), var(--my)) rotate(var(--r0)) scale(1.15); opacity: 1; }
          100% { transform: translate(var(--ex), var(--ey)) rotate(var(--r1)) scale(0.5); opacity: 0; }
        }
        @keyframes pulse-soft {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(168,85,247,0); transform: scale(1.02); }
        }
        .pulse-soft { animation: pulse-soft 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
