import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, X, Sparkles, Info } from "lucide-react";
import {
  domainById,
  DOMAINS,
  SCORING,
  isCalibrated,
  type DomainDiff,
  type FreeState,
  type LastSession,
  type SessionResult,
} from "@/lib/freeUser";
import { useDailyFinalizeResult, useFreeState } from "@/lib/useFree";
import { evaluateAccessoryUnlocks } from "@/lib/accessoryUnlocks";
import { PredictedScore } from "@/components/PredictedScore";
import { MomentumGauge } from "@/components/MomentumGauge";
import { FreeShell } from "@/components/FreeShell";
import { UnlockReadyCard } from "@/components/UnlockReadyCard";
import { BonusUnlockModal } from "@/components/BonusUnlockModal";
import { MissedReviewModal } from "@/components/MissedReviewModal";

export const Route = createFileRoute("/_authenticated/daily/complete")({
  head: () => ({ meta: [{ title: "Session complete — TestPhi" }] }),
  component: DailyComplete,
});

const NO_MISS_LINES = [
  "Zero incorrect answers. Smart cookie.",
  "Perfect session. Your SAT doesn't know what's coming.",
  "Nothing missed. Keep that up.",
];

function DailyComplete() {
  const navigate = useNavigate();
  const { data: freeState } = useFreeState();
  const finalize = useDailyFinalizeResult();
  const [prev, setPrev] = useState<FreeState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const prevCapturedRef = useRef(false);

  const next = finalize.data ?? null;

  // Capture the pre-session FreeState snapshot the first time we have it, so
  // deltas render against the right baseline even if the prewarmed finalize
  // has already updated the freeState cache.
  useEffect(() => {
    if (prevCapturedRef.current) return;
    if (!freeState) return;
    prevCapturedRef.current = true;
    setPrev(freeState);
  }, [freeState]);

  // Evaluate accessory unlocks once we have both the pre-session baseline
  // and the finalized post-session state.
  const unlocksEvaluatedRef = useRef(false);
  useEffect(() => {
    if (unlocksEvaluatedRef.current) return;
    if (!next) return;
    unlocksEvaluatedRef.current = true;
    evaluateAccessoryUnlocks(prev, next);
  }, [prev, next]);

  // Handle errors coming out of the finalize query.
  useEffect(() => {
    const err = finalize.error as any;
    if (!err) {
      setErrorMsg(null);
      return;
    }
    const msg = String(err?.message ?? err ?? "");
    const m = msg.match(/Session incomplete:\s*(\d+)\/5/i);
    if (m) {
      const answered = parseInt(m[1], 10);
      if (answered === 0) {
        navigate({ to: "/home" as any, replace: true });
      } else {
        navigate({
          to: "/daily/question/$n" as any,
          params: { n: String(answered + 1) } as any,
          replace: true,
        });
      }
      return;
    }
    setErrorMsg(msg || "Something went wrong finalizing your session.");
  }, [finalize.error, navigate]);

  const runRetry = () => {
    setErrorMsg(null);
    setStuck(false);
    finalize.refetch();
  };

  // Safety net: if the query neither resolves nor errors within 20s,
  // surface an escape hatch so the user isn't frozen on "Wrapping up…".
  useEffect(() => {
    if (next || errorMsg) {
      setStuck(false);
      return;
    }
    const t = setTimeout(() => setStuck(true), 20_000);
    return () => clearTimeout(t);
  }, [next, errorMsg, prev]);

  if (errorMsg || stuck) {
    const displayMsg =
      errorMsg ??
      "This is taking longer than expected. Your answers were saved — you can retry or head home.";
    return (
      <div className="topo-bg min-h-screen flex items-center justify-center px-6">
        <div
          className="max-w-sm w-full rounded-2xl p-6 text-center"
          style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(255,77,109,0.5)" }}
        >
          <div className="text-sm font-bold text-[var(--lavender)]">
            {errorMsg ? "Couldn't wrap up your session" : "Still wrapping up…"}
          </div>
          <div className="mt-2 text-xs" style={{ color: "rgba(246,240,250,0.7)" }}>
            {displayMsg}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={runRetry}
              className="btn-volt flex-1 py-3 rounded-xl text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => navigate({ to: "/home" as any, replace: true })}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.2)" }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (!next || !prev || !next.lastSession) {
    return (
      <div className="topo-bg min-h-screen flex flex-col items-center justify-center px-6 text-[var(--lavender)]/70">
        <div className="relative size-14 mb-5" aria-hidden="true">
          <svg className="size-full animate-[spin_0.9s_linear_infinite]" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(246,240,250,0.12)"
              strokeWidth="5"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="var(--volt)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="94 32"
            />
          </svg>
        </div>
        <div className="text-sm font-medium">Wrapping up your session…</div>
      </div>
    );
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
  // Order: SCORE, MISSED, DOMAIN rows, MOMENTUM?, STREAK?, FINISH
  const missed = session.results.filter((r) => !r.correct);
  const missedCount = missed.length;
  const totalSteps =
    1 /* score */ +
    1 /* missed */ +
    diffs.length +
    (session.momentumIncreased ? 1 : 0) +
    (session.streakIncreased ? 1 : 0) +
    1; /* finish */
  const [step, setStep] = useState(0);
  const [bonusDomainId, setBonusDomainId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [openDomainId, setOpenDomainId] = useState<string | null>(null);
  useEffect(() => {
    if (step >= totalSteps) return;
    const delay = step === 0 ? 40 : 120;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, totalSteps]);

  const showMissed = step >= 1;
  const domainsStart = 2;
  const momentumStep = domainsStart + diffs.length;
  const streakStep = momentumStep + (session.momentumIncreased ? 1 : 0);
  const showMomentum = session.momentumIncreased && step >= momentumStep;
  const showStreak = session.streakIncreased && step >= streakStep;
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
            <CalibrationMilestone prevScore={session.prevOverall} newScore={session.newOverall} />
          ) : (
            <div
              className="rounded-3xl p-6 text-center"
              style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
                PREDICTED SAT SCORE
              </div>
              <div className="mt-3 flex justify-center">
                <PredictedScore
                  score={session.newOverall}
                  calibrated={calibrated}
                  animateFrom={session.prevOverall}
                  sizeClass="text-[72px] sm:text-[96px]"
                />
              </div>
              <div className="mt-3 flex flex-col items-center gap-2">
                {(() => {
                  const displayDelta = calibrated ? session.delta : 0;
                  return (
                    <div
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-extrabold"
                      style={{
                        background:
                          displayDelta > 0
                            ? "rgba(184,255,0,0.15)"
                            : displayDelta < 0
                              ? "rgba(255,77,109,0.15)"
                              : "rgba(246,240,250,0.08)",
                        color:
                          displayDelta > 0
                            ? "var(--volt)"
                            : displayDelta < 0
                              ? "var(--destructive)"
                              : "var(--lavender)",
                        border: `1px solid ${
                          displayDelta > 0
                            ? "var(--volt)"
                            : displayDelta < 0
                              ? "var(--destructive)"
                              : "rgba(246,240,250,0.25)"
                        }`,
                      }}
                    >
                      {displayDelta >= 0 ? "+" : ""}
                      {displayDelta} points{displayDelta > 0 ? "!" : ""}
                    </div>
                  );
                })()}
                {!calibrated && (
                  <div
                    className="text-[11px] leading-snug max-w-xs"
                    style={{ color: "rgba(246,240,250,0.6)" }}
                  >
                    Your score won't budge until all 8 domains are calibrated. Keep going to unlock live point changes!
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionFade>

        {/* 2. Missed Questions */}
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
                onClick={() => setReviewOpen(true)}
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

        {/* 3. Domain Progress */}
        <section className="space-y-3">
          {diffs.map((diff, i) => {
            const isBonusReady =
              !diff.nowInitialized && diff.newAnswered >= SCORING.THRESHOLD_QUESTIONS;
            return (
              <SectionFade key={diff.domainId} show={step >= domainsStart + i}>
                {isBonusReady ? (
                  <UnlockReadyCard
                    domainName={
                      domainById(diff.domainId)?.label.split(" · ").slice(1).join(" · ") ??
                      diff.domainId
                    }
                    onOpen={() => setBonusDomainId(diff.domainId)}
                  />
                ) : (
                  <DomainRow
                    diff={diff}
                    results={session.results}
                    momentumActive={
                      next.lastSession!.momentumAfter > 0 && diff.actualGain > diff.baseGain
                    }
                    isOpen={openDomainId === diff.domainId}
                    onToggle={() =>
                      setOpenDomainId((cur) => (cur === diff.domainId ? null : diff.domainId))
                    }
                  />
                )}
              </SectionFade>
            );
          })}
        </section>




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

      <BonusUnlockModal
        open={!!bonusDomainId}
        domainId={bonusDomainId}
        domainLabel={bonusDomainId ? (domainById(bonusDomainId)?.label ?? "") : ""}
        onClose={() => setBonusDomainId(null)}
      />

      <MissedReviewModal
        open={reviewOpen}
        missed={missed.map((r) => ({ slot: r.n }))}
        onClose={() => setReviewOpen(false)}
      />
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
  results,
  momentumActive,
  isOpen,
  onToggle,
}: {
  diff: DomainDiff;
  results: SessionResult[];
  momentumActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
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
  const tipOpen = isOpen;
  const momentumMult = diff.baseGain !== 0 ? diff.actualGain / diff.baseGain : 1;
  const positiveDelta = diff.newMastery - diff.prevMastery >= 0;
  const hasCorrectAnswer = results.some(
    (r) => r.domainId === diff.domainId && r.correct,
  );
  const showCeilingNote = hasCorrectAnswer && Math.abs(diff.actualGain) < 0.05;

  return (
    <div
      className="relative rounded-2xl p-4"
      style={{
        background: "#1a1230",
        border: justUnlocked ? "1.5px solid var(--volt)" : "1px solid rgba(246,240,250,0.1)",
        boxShadow: justUnlocked ? "0 0 40px -10px rgba(184,255,0,0.55)" : undefined,
        minHeight: tipOpen ? (showCeilingNote ? 210 : 155) : undefined,
        zIndex: tipOpen ? 100 : undefined,
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
        <div className="flex items-center gap-2 shrink-0">
          {nowInit ? (
            <>
              <span className="score-num text-base tabular-nums text-[var(--lavender)]">
                {Math.round(pct)}%
              </span>
              {deltaPct && (
                <DeltaBadge
                  delta={diff.newMastery - diff.prevMastery}
                  onToggle={onToggle}
                />
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
        <div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: SCORING.THRESHOLD_QUESTIONS }).map((_, i) => {
              const filled = i < maskShown;
              const isNewThisSession = i >= diff.prevAnswered && i < maskShown;
              return (
                <div
                  key={i}
                  className="flex-1 h-2.5 rounded-full"
                  style={{
                    background: filled
                      ? isNewThisSession
                        ? "var(--spark)"
                        : "var(--volt)"
                      : "rgba(246,240,250,0.12)",
                    transition: "background-color 300ms ease, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: isNewThisSession ? "scaleY(1.15)" : "scaleY(1)",
                    boxShadow: isNewThisSession ? "0 0 12px rgba(255,140,60,0.55)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <div
            className="mt-2 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "rgba(246,240,250,0.6)" }}
          >
            <span style={{ color: "var(--lavender)" }}>{Math.min(maskShown, SCORING.THRESHOLD_QUESTIONS)}</span>
            <span>/{SCORING.THRESHOLD_QUESTIONS} questions to calibration</span>
          </div>
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

      {tipOpen && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={onToggle}
          />
          <div
            className="absolute top-0 left-0 right-0 z-[100] rounded-2xl p-4 text-[12px] leading-relaxed"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              minHeight: "100%",
              height: "auto",
              background: "rgba(20,12,40,0.98)",
              border: "1px solid rgba(168,85,247,0.6)",
              color: "var(--lavender)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <div className="font-bold uppercase tracking-wider mb-2 text-[10px]" style={{ color: "var(--volt)" }}>
              Score change breakdown
            </div>
            <div className="space-y-1">
              <div>
                <span style={{ color: "rgba(246,240,250,0.6)" }}>Base {positiveDelta ? "gain" : "loss"}:</span>{" "}
                <span className="tabular-nums font-bold">{diff.baseGain >= 0 ? "+" : ""}{diff.baseGain.toFixed(1)}%</span>
              </div>
              {positiveDelta && (
                <div>
                  <span style={{ color: "rgba(246,240,250,0.6)" }}>Momentum multiplier:</span>{" "}
                  <span className="tabular-nums font-bold">×{momentumMult.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-1 border-t" style={{ borderColor: "rgba(246,240,250,0.15)" }}>
                <span style={{ color: "rgba(246,240,250,0.6)" }}>Total:</span>{" "}
                <span className="tabular-nums font-bold" style={{ color: positiveDelta ? "var(--volt)" : "var(--destructive)" }}>
                  {diff.actualGain >= 0 ? "+" : ""}{diff.actualGain.toFixed(1)}%
                </span>
              </div>
            </div>
            {showCeilingNote && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(246,240,250,0.15)" }}>
                <div className="text-[11px] leading-relaxed" style={{ color: "rgba(246,240,250,0.75)" }}>
                  You answered correctly, but the higher your mastery, the harder the questions need to be to improve your score further. Correct answers at any difficulty still help maintain your current level.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DeltaBadge({
  delta,
  onToggle,
}: {
  delta: number;
  onToggle: () => void;
}) {
  const positive = delta >= 0;
  const bg = positive ? "var(--volt)" : "var(--destructive)";
  const fg = positive ? "var(--ink)" : "var(--lavender)";
  const sign = positive ? "+" : "";
  const rounded = `${sign}${Math.abs(delta) < 10 ? delta.toFixed(1) : Math.round(delta)}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="score-num tabular-nums flex items-center justify-center rounded-full"
      style={{
        background: bg,
        color: fg,
        minWidth: 44,
        height: 28,
        padding: "0 8px",
        fontSize: 12,
        fontWeight: 800,
        boxShadow: `0 0 12px -2px ${bg}`,
      }}
      aria-label={`${rounded}% — tap for breakdown`}
    >
      {rounded}%
    </button>
  );
}

// Suppress unused import warnings — DOMAINS is referenced indirectly via diff list ordering.
void DOMAINS;
