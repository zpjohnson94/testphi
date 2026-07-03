import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, X, Sparkles } from "lucide-react";
import {
  domainById,
  DOMAINS,
  SCORING,
  isCalibrated,
  type SessionResult,
  type FreeState,
  type LastSession,
} from "@/lib/freeUser";
import { useApplySession, useFreeState } from "@/lib/useFree";
import { PredictedScore } from "@/components/PredictedScore";
import { MomentumGauge } from "@/components/MomentumGauge";
import { FreeShell } from "@/components/FreeShell";

export const Route = createFileRoute("/_authenticated/daily/complete")({
  head: () => ({ meta: [{ title: "Session complete — TestPhi" }] }),
  component: DailyComplete,
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

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {}
}

const NO_MISS_LINES = [
  "Zero incorrect answers. Smart cookie.",
  "Perfect session. Your SAT doesn't know what's coming.",
  "Nothing missed. Keep that up.",
];

function DailyComplete() {
  const navigate = useNavigate();
  const { data: freeState } = useFreeState();
  const applyMutation = useApplySession();
  const [prev, setPrev] = useState<FreeState | null>(null);
  const [next, setNext] = useState<FreeState | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    if (!freeState) return;
    const results = loadSessionResults();
    if (results.length === 0) {
      navigate({ to: "/home" as any, replace: true });
      return;
    }
    submittedRef.current = true;
    setPrev(freeState);
    applyMutation.mutate(results, {
      onSuccess: (after) => {
        setNext(after);
        clearSession();
      },
      onError: () => {
        submittedRef.current = false;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeState]);

  if (!next || !prev || !next.lastSession) {
    return <div className="topo-bg min-h-screen" />;
  }
  const session = next.lastSession;

  return (
    <FreeShell>
      <CompleteContent prev={prev} next={next} session={session} onExit={() => navigate({ to: "/home" as any })} />
    </FreeShell>
  );
}

interface ContentProps {
  prev: FreeState;
  next: FreeState;
  session: LastSession;
  onExit: () => void;
}

// Sequenced reveal indices
const SEQ = {
  SCORE: 0,
  DOMAINS_START: 1, // each domain occupies one slot
};

function CompleteContent({ prev, next, session, onExit }: ContentProps) {
  const calibrated = isCalibrated(next);
  const wasCalibrated = session.wasCalibrated;
  const calibrationMoment = session.calibrationMilestone;

  const diffs = session.domainDiffs;
  // Reveal each section in turn. We use a simple time-based step.
  const totalSteps = 1 /* score */ + diffs.length + 3 /* missed, momentum?, streak?, finish */;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= totalSteps) return;
    const delay = step === 0 ? 200 : 650;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, totalSteps]);

  const missed = session.results.filter((r) => !r.correct);
  const missedCount = missed.length;
  const showMissed = step >= 1 + diffs.length;
  const showMomentum = session.momentumIncreased && step >= 2 + diffs.length;
  const showStreak = session.streakIncreased && step >= 2 + diffs.length + (session.momentumIncreased ? 1 : 0);
  const showFinish = step >= totalSteps;

  const noMissLine = useMemo(
    () => NO_MISS_LINES[Math.floor(Math.random() * NO_MISS_LINES.length)],
    [],
  );

  return (
    <div className="topo-bg min-h-screen pb-28 relative">
      {/* X button */}
      <button
        onClick={onExit}
        className="fixed top-4 right-4 z-40 size-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(246,240,250,0.18)", color: "var(--lavender)" }}
        aria-label="Close session summary"
      >
        <X className="size-5" />
      </button>

      <main className="mx-auto max-w-2xl px-5 pt-10 space-y-7">
        {/* 1. Predicted Score */}
        <SectionFade show={step >= 0}>
          {calibrationMoment ? (
            <CalibrationMilestone prevScore={prev.overall} newScore={next.overall} />
          ) : (
            <div
              className="rounded-3xl p-6 text-center"
              style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
                {wasCalibrated ? "Predicted SAT score" : "Predicted SAT score · low confidence"}
              </div>
              <div className="mt-3 flex justify-center">
                <PredictedScore
                  score={next.overall}
                  calibrated={calibrated}
                  animateFrom={prev.overall}
                  sizeClass="text-[72px] sm:text-[96px]"
                />
              </div>
              {session.delta !== 0 && (
                <div
                  className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-extrabold"
                  style={{
                    background: session.delta > 0 ? "rgba(184,255,0,0.15)" : "rgba(255,77,109,0.15)",
                    color: session.delta > 0 ? "var(--volt)" : "var(--destructive)",
                    border: `1px solid ${session.delta > 0 ? "var(--volt)" : "var(--destructive)"}`,
                  }}
                >
                  {session.delta > 0 ? "+" : ""}
                  {session.delta} points
                </div>
              )}
            </div>
          )}
        </SectionFade>

        {/* 2. Domain Progress */}
        <section className="space-y-3">
          {diffs.map((diff, i) => (
            <SectionFade key={diff.domainId} show={step >= 1 + i}>
              <DomainRow diff={diff} momentumActive={next.lastSession!.momentumAfter > 0 && diff.actualGain > diff.baseGain} />
            </SectionFade>
          ))}
        </section>

        {/* 3. Missed Questions */}
        <SectionFade show={showMissed}>
          {missedCount > 0 ? (
            <div
              className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.35)" }}
            >
              <div className="text-sm font-bold text-[var(--lavender)]">
                {missedCount} question{missedCount === 1 ? "" : "s"} incorrect
              </div>
              <button
                className="rounded-xl px-4 py-2 text-sm font-bold"
                style={{ background: "rgba(74,6,136,0.5)", color: "var(--lavender)", border: "1px solid rgba(168,85,247,0.5)" }}
                onClick={() => {/* review flow placeholder */}}
              >
                Review →
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(184,255,0,0.08)", border: "1px solid rgba(184,255,0,0.35)" }}
            >
              <div className="text-sm font-bold" style={{ color: "var(--volt)" }}>
                {noMissLine}
              </div>
            </div>
          )}
        </SectionFade>

        {/* 4. Momentum (conditional) */}
        {session.momentumIncreased && (
          <SectionFade show={showMomentum}>
            <div
              className="rounded-3xl p-5 flex flex-col items-center"
              style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}
            >
              <MomentumGauge needle={session.momentumAfter} size={200} />
              <div className="mt-2 text-sm font-bold" style={{ color: "var(--lavender)" }}>
                Momentum increased{" "}
                <span style={{ color: "var(--volt)" }}>
                  +{((session.momentumAfter - session.momentumBefore) * SCORING.MOMENTUM_STEP).toFixed(2)}
                </span>{" "}
                → {(1 + session.momentumAfter * SCORING.MOMENTUM_STEP).toFixed(2)}x
              </div>
            </div>
          </SectionFade>
        )}

        {/* 5. Streak (conditional) */}
        {session.streakIncreased && (
          <SectionFade show={showStreak}>
            <div className="flex items-center justify-center gap-2">
              <Flame className="size-6" style={{ color: "var(--spark)" }} />
              <span className="display text-2xl text-[var(--lavender)]">
                {session.streakAfter}-day streak
              </span>
            </div>
          </SectionFade>
        )}

        {/* 6. Finish Session */}
        <SectionFade show={showFinish}>
          <button onClick={onExit} className="btn-volt w-full py-4 text-base rounded-2xl">
            Finish Session
          </button>
        </SectionFade>
      </main>
    </div>
  );
}

function SectionFade({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 420ms ease, transform 420ms ease",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

function CalibrationMilestone({ prevScore, newScore }: { prevScore: number; newScore: number }) {
  return (
    <div
      className="rounded-3xl p-6 text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(140deg, #2a0e54 0%, #1a0b2e 100%)",
        border: "2px solid var(--volt)",
        boxShadow: "0 0 60px -10px rgba(184,255,0,0.6)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(184,255,0,0.3), transparent 60%)",
          animation: "calibPulse 2.4s ease-in-out infinite",
        }}
      />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
          <Sparkles className="size-4" /> Calibration Milestone <Sparkles className="size-4" />
        </div>
        <h2 className="mt-3 display text-3xl text-[var(--lavender)]">Your score is now calibrated</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(246,240,250,0.55)" }}>
              Diagnostic
            </div>
            <div className="score-num text-4xl mt-1" style={{ color: "rgba(246,240,250,0.65)" }}>
              {prevScore}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--volt)" }}>
              Calibrated
            </div>
            <PredictedScore
              score={newScore}
              calibrated
              animateFrom={prevScore}
              sizeClass="text-[40px] sm:text-[56px]"
            />
          </div>
        </div>
      </div>
      <style>{`@keyframes calibPulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }`}</style>
    </div>
  );
}

function DomainRow({
  diff,
  momentumActive,
}: {
  diff: ReturnType<() => FreeState["lastSession"]> extends infer T ? any : never;
  momentumActive: boolean;
}) {
  const d = domainById(diff.domainId);
  if (!d) return null;
  const parts = d.label.split(" · ");
  const sectionName = parts[0];
  const name = parts.slice(1).join(" · ");
  const isMath = sectionName === "Math";

  const wasInit = diff.wasInitialized;
  const nowInit = diff.nowInitialized;
  const justUnlocked = diff.justUnlocked;

  // Animated progress bar fill
  const [pct, setPct] = useState(wasInit ? diff.prevMastery : 0);
  const [maskShown, setMaskShown] = useState(0);

  useEffect(() => {
    if (nowInit) {
      const start = wasInit ? diff.prevMastery : 0;
      const end = diff.newMastery;
      const dur = 1100;
      const t0 = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setPct(start + (end - start) * eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    } else {
      // Animate block fills left to right
      const newCount = diff.newAnswered;
      const prevCount = diff.prevAnswered;
      let i = prevCount;
      setMaskShown(prevCount);
      const tick = () => {
        if (i >= newCount) return;
        i += 1;
        setMaskShown(i);
        setTimeout(tick, 220);
      };
      setTimeout(tick, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deltaSign = diff.newMastery >= diff.prevMastery ? "+" : "";
  const deltaPct = nowInit && wasInit ? `${deltaSign}${(diff.newMastery - diff.prevMastery).toFixed(1)}%` : "";

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#1a1230",
        border: justUnlocked ? "1.5px solid var(--volt)" : "1px solid rgba(246,240,250,0.1)",
        boxShadow: justUnlocked ? "0 0 40px -10px rgba(184,255,0,0.55)" : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: isMath ? "var(--neon)" : "var(--volt)",
              color: isMath ? "var(--lavender)" : "var(--ink)",
            }}
          >
            {sectionName}
          </span>
          <span className="text-sm font-bold text-[var(--lavender)] truncate">{name}</span>
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          {nowInit ? (
            <>
              <span className="score-num text-base tabular-nums text-[var(--lavender)]">
                {Math.round(pct)}%
              </span>
              {deltaPct && (
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{
                    color: diff.newMastery >= diff.prevMastery ? "var(--volt)" : "var(--destructive)",
                  }}
                >
                  {deltaPct}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>

      {nowInit ? (
        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="h-full" style={{ width: `${pct}%`, background: "var(--volt)" }} />
        </div>
      ) : (
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: SCORING.THRESHOLD_QUESTIONS }).map((_, i) => {
            const filled = i < maskShown;
            return (
              <div
                key={i}
                className="flex-1 h-2.5 rounded-full transition-colors"
                style={{ background: filled ? "var(--volt)" : "rgba(246,240,250,0.12)" }}
              />
            );
          })}
        </div>
      )}

      {justUnlocked && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--volt)" }}
        >
          <Sparkles className="size-3.5" /> Mastery unlocked
        </div>
      )}

      {!nowInit && diff.bonusUnlockedThisSession && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--spark)" }}
        >
          <Sparkles className="size-3.5" /> Bonus round unlocked
        </div>
      )}

      {momentumActive && nowInit && wasInit && diff.baseGain > 0 && (
        <div className="mt-2 text-[11px] font-medium" style={{ color: "rgba(246,240,250,0.65)" }}>
          +{diff.baseGain.toFixed(1)}% ×{" "}
          {(diff.actualGain / Math.max(0.0001, diff.baseGain)).toFixed(2)}x = +
          {diff.actualGain.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

// Suppress unused import warnings — DOMAINS is referenced indirectly via diff list ordering.
void DOMAINS;
