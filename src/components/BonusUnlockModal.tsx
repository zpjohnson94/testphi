// Full-screen modal: intro → 3 questions (E/M/H) → chest reveal.
// Reuses the question card look from `daily.question.$n.tsx` — inlined for
// scope isolation rather than extracting a shared component this pass.
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  useServeBonusRound,
  useSubmitBonusRound,
  type BonusSubmitAnswer,
} from "@/lib/useBonusRound";
import { ChestReveal } from "./ChestReveal";
import { CHEST_IMAGE, preloadImage } from "@/lib/images";
import { sfx } from "@/lib/sfx";

interface Props {
  open: boolean;
  domainId: string | null;
  domainLabel: string;
  onClose: () => void;
}

type Phase = "intro" | "q" | "chest";

export function BonusUnlockModal({ open, domainId, domainLabel, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0); // 0..2
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<BonusSubmitAnswer[]>([]);
  const [masteryPct, setMasteryPct] = useState<number>(0);
  const [bonusSummary, setBonusSummary] = useState<{
    correct: number;
    total: number;
    domainAnswered: number;
    domainCorrect: number;
    results: boolean[];
  } | null>(null);
  const startRef = useRef(Date.now());
  const { data: round, isLoading, error } = useServeBonusRound(open ? domainId : null);
  const submit = useSubmitBonusRound();

  const domainName = domainLabel.split(" · ").slice(1).join(" · ") || domainLabel;

  useEffect(() => {
    if (!open) {
      setPhase("intro");
      setQIndex(0);
      setSelected(null);
      setAnswers([]);
      setMasteryPct(0);
      setBonusSummary(null);
    }
  }, [open]);

  // Fetch the chest art up front so the reveal doesn't stall on it. The user
  // spends several seconds on the three questions first, which is ample.
  useEffect(() => {
    if (open) preloadImage(CHEST_IMAGE);
  }, [open]);

  useEffect(() => {
    if (phase === "q") startRef.current = Date.now();
  }, [phase, qIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = round?.questions[qIndex];

  const beginRound = () => setPhase("q");

  const pickChoice = (i: number) => {
    if (selected !== null || !q) return;
    setSelected(i);
    sfx.tap();
    const next: BonusSubmitAnswer = {
      step: q.step,
      questionId: q.questionId,
      selectedPosition: i,
      shuffleSeed: q.shuffleSeed,
      elapsedMs: Date.now() - startRef.current,
    };
    const allAnswers = [...answers, next];
    setAnswers(allAnswers);

    window.setTimeout(async () => {
      if (qIndex < 2) {
        setQIndex((n) => n + 1);
        setSelected(null);
      } else {
        // Submit all 3
        try {
          const result = await submit.mutateAsync({
            domainId: domainId!,
            answers: allAnswers,
          });
          const m = result.state.domainStats[domainId!]?.mastery ?? 0;
          setMasteryPct(m);
          setBonusSummary(result.bonusSummary);
          setPhase("chest");
        } catch (e) {
          console.error("bonus submit failed", e);
          onClose();
        }
      }
    }, 650);
  };

  const difficultyLabel = q?.difficulty === 1 ? "Easy" : q?.difficulty === 3 ? "Hard" : "Medium";

  return (
    <div
      className="fixed inset-0 z-[105] flex flex-col animate-fade-up"
      style={{ background: "rgba(10,5,26,0.94)", backdropFilter: "blur(6px)" }}
    >
      {phase !== "chest" && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 size-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(246,240,250,0.2)",
            color: "var(--lavender)",
          }}
        >
          <X className="size-5" />
        </button>
      )}

      {/* Loading / error */}
      {isLoading && phase === "intro" && (
        <div className="flex-1 flex items-center justify-center text-[var(--lavender)]/70 text-sm">
          Getting your questions ready. Good luck!
        </div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="text-sm text-[var(--destructive)]">
            Couldn't load bonus questions. Please try again in a moment.
          </div>
        </div>
      )}

      {/* Intro */}
      {phase === "intro" && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div
            className="w-full max-w-md rounded-3xl p-7 text-center"
            style={{
              background: "linear-gradient(140deg, #2a0e54 0%, #1a0b2e 100%)",
              border: "2px solid var(--volt)",
              boxShadow: "0 0 60px -10px rgba(184,255,0,0.5)",
            }}
          >
            <div
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--volt)" }}
            >
              UNLOCK YOUR MASTERY SCORE
            </div>
            <h2 className="mt-3 display text-2xl text-[var(--lavender)]">{domainName}</h2>
            <p
              className="mt-4 text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(246,240,250,0.85)" }}
            >
              {`Answer 3 more questions (1 easy, 1 medium, 1 hard) and you'll unlock your mastery score for this domain.\u00a0\n\n\nYou'll keep improving your mastery score over time after you unlock it.`}
            </p>
            <button
              onClick={beginRound}
              disabled={!round}
              className="btn-volt w-full mt-7 py-4 rounded-2xl text-base disabled:opacity-60"
            >
              Begin!
            </button>
          </div>
        </div>
      )}

      {/* Question screens */}
      {phase === "q" && q && (
        <div className="flex-1 flex flex-col">
          <header className="px-5 pt-4">
            <div className="mx-auto max-w-2xl">
              <div
                className="text-center text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(246,240,250,0.7)" }}
              >
                Bonus · {difficultyLabel} · {qIndex + 1} of 3
              </div>
              <div
                className="mt-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(246,240,250,0.1)" }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${((qIndex + (selected !== null ? 1 : 0)) / 3) * 100}%`,
                    background: "var(--volt)",
                  }}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto mx-auto max-w-2xl w-full px-5 pt-6 pb-10">
            <div
              className="rounded-2xl p-6 sm:p-8 animate-fade-up"
              style={{ background: "var(--lavender)", color: "var(--ink)" }}
            >
              <div
                className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ background: "rgba(74,6,136,0.12)", color: "var(--violet-deep)" }}
              >
                {domainLabel}
              </div>
              {q.passage && (
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b2f57" }}>
                  {q.passage}
                </p>
              )}
              <h1 className="mt-3 text-base sm:text-lg font-bold" style={{ color: "var(--ink)" }}>
                {q.question}
              </h1>

              <div className="mt-5 grid gap-2.5">
                {q.choices.map((choice, i) => {
                  const isSelected = selected === i;
                  let bg = "#fff";
                  let border = "1.5px solid rgba(29,41,0,0.12)";
                  let color: string = "var(--ink)";
                  if (isSelected) {
                    bg = "rgba(168,85,247,0.25)";
                    border = "2px solid var(--neon)";
                    color = "var(--violet-deep)";
                  }
                  return (
                    <button
                      key={i}
                      disabled={selected !== null}
                      onClick={() => pickChoice(i)}
                      className="text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3"
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
            </div>
          </main>
        </div>
      )}

      {/* Chest */}
      {phase === "chest" && domainId && (
        <ChestReveal
          domainName={domainName}
          masteryPct={masteryPct}
          bonusSummary={bonusSummary}
          onDone={onClose}
        />
      )}
    </div>
  );
}
