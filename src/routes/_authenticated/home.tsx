import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Info } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { useStore, useHydration } from "@/lib/store";
import { PredictedScore } from "@/components/PredictedScore";
import { PredictedScoreHistory } from "@/components/PredictedScoreHistory";
import { MomentumGauge } from "@/components/MomentumGauge";
import { UnlockReadyCard } from "@/components/UnlockReadyCard";
import { BonusUnlockModal } from "@/components/BonusUnlockModal";
import {
  hasCompletedToday,
  DOMAINS,
  SCORING,
  domainById,
  isCalibrated,
  sectionScore,
} from "@/lib/freeUser";
import { useFreeState } from "@/lib/useFree";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — TestPhi" }] }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  useHydration();
  const { data: state } = useFreeState();
  const avatar = useStore((s) => s.avatar);
  const overall = state?.overall ?? 800;
  const streak = state?.streak ?? 0;
  const done = state ? hasCompletedToday(state) : false;
  const lastSession = state?.lastSession ?? null;
  const [animatedScore, setAnimatedScore] = useState(overall);

  useEffect(() => {
    if (!state) return;
    const target = state.overall;
    const start = 800;
    const duration = 1800;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state?.overall]);

  const answeredCount = done ? 5 : 0;
  const mathScore = state ? sectionScore(state, "math") : 400;
  const rwScore = state ? sectionScore(state, "rw") : 400;
  const monthDelta = lastSession?.delta ?? 0;
  const name = (state?.name || "champ").split(" ")[0];
  const calibrated = state ? isCalibrated(state) : false;
  const isPerfect = (state?.overall ?? 800) === 1600;
  const [momentumOpen, setMomentumOpen] = useState(false);
  const momentumRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!momentumOpen) return;
    const handleTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (momentumRef.current && !momentumRef.current.contains(target)) {
        setMomentumOpen(false);
      }
    };
    document.addEventListener("mousedown", handleTap);
    document.addEventListener("touchstart", handleTap);
    return () => {
      document.removeEventListener("mousedown", handleTap);
      document.removeEventListener("touchstart", handleTap);
    };
  }, [momentumOpen]);

  
  const [bonusDomainId, setBonusDomainId] = useState<string | null>(null);

  const bonusReadyDomains = useMemo(() => {
    if (!state) return [] as { id: string; name: string; label: string }[];
    return DOMAINS.filter((d) => {
      const s = state.domainStats[d.id];
      return s && !s.initialized && s.answered >= SCORING.THRESHOLD_QUESTIONS && s.bonusStep < 3;
    }).map((d) => {
      const parts = d.label.split(" · ");
      return { id: d.id, name: parts.slice(1).join(" · "), label: d.label };
    });
  }, [state]);


  return (
    <FreeShell>
      <div className="topo-bg">
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
        >
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="display text-base text-[var(--lavender)]">TestPhi</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 pt-8 pb-10 space-y-6">
          {/* Profile box — mirrors landing page hero card */}
          <section
            className={`rounded-3xl p-4 sm:p-7 backdrop-blur-md ${isPerfect ? "gold-shine" : ""}`}
            style={
              isPerfect
                ? undefined
                : {
                    background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
                    border: "1.5px solid var(--neon)",
                  }
            }
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="text-left min-w-0">
                <div className="display text-lg sm:text-2xl text-[var(--lavender)]">
                  {`Hey ${name}!`}
                </div>
                <div className="display text-2xl text-[var(--lavender)]">
                  Your predicted score:
                </div>
                <div className="mt-2 sm:mt-3">
                  <PredictedScore
                    score={state?.overall ?? 800}
                    calibrated={calibrated}
                    animateFrom={800}
                    theme={isPerfect ? "gold" : "default"}
                  />
                </div>
                {monthDelta !== 0 && (
                  <div
                    className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{
                      background: monthDelta >= 0 ? "rgba(184,255,0,0.15)" : "rgba(255,77,109,0.15)",
                      color: monthDelta >= 0 ? "var(--volt)" : "var(--destructive)",
                      border: `1px solid ${monthDelta >= 0 ? "var(--volt)" : "var(--destructive)"}`,
                    }}
                  >
                    {monthDelta >= 0 ? "+" : ""}
                    {monthDelta} pts last session
                  </div>
                )}

              </div>
              <div
                className="shrink-0 size-16 sm:size-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(184,255,0,0.15)", border: "2px solid var(--volt)" }}
              >
                <Avatar config={avatar} size={56} animate />
              </div>
            </div>
            <div className="mt-3 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3 text-left">
              <div
                className="rounded-2xl p-2.5 sm:p-3"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--volt)" }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--volt)" }}
                >
                  R&W
                </div>
                <div className="score-num text-2xl sm:text-3xl text-[var(--lavender)]">{rwScore}</div>
              </div>
              <div
                className="rounded-2xl p-2.5 sm:p-3"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--neon)" }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--neon)" }}
                >
                  Math
                </div>
                <div className="score-num text-2xl sm:text-3xl text-[var(--lavender)]">{mathScore}</div>
              </div>
            </div>
            {state && <PredictedScoreHistory state={state} />}
          </section>

          {/* Bonus round unlock cards (one per domain that's ready) */}
          {bonusReadyDomains.length > 0 && (
            <section className="space-y-2.5">
              {bonusReadyDomains.map((d) => (
                <UnlockReadyCard
                  key={d.id}
                  domainName={d.name}
                  onOpen={() => setBonusDomainId(d.id)}
                />
              ))}
            </section>
          )}

          {/* Daily 5 card */}
          <section
            className={`rounded-3xl p-6 backdrop-blur-md ${!done ? "daily-pulse" : ""}`}
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: `2px solid ${done ? "var(--neon)" : "var(--volt)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="display text-2xl text-[var(--lavender)]">
                  Daily 5
                </div>
                <div
                  className="text-sm font-semibold mt-1"
                  style={{ color: done ? "var(--neon)" : "rgba(246,240,250,0.7)" }}
                >
                  {done ? "Daily 5 complete." : "Complete 5 questions every day to build momentum"}
                </div>
                {done && (
                  <div className="text-sm font-semibold mt-1" style={{ color: "var(--neon)" }}>
                    Nice work!
                  </div>
                )}
              </div>
            </div>

            {/* Five circle indicators */}
            <div className="mt-5 flex items-center gap-3 justify-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const result = done ? lastSession?.results?.[i] : undefined;
                const answered = i < answeredCount;
                const hasResult = result !== undefined;
                const incorrect = hasResult && result?.correct === false;
                // When done but result data is missing, still render the circle as filled/correct.
                const correct = hasResult ? result?.correct === true : answered;
                const bg = correct
                  ? "var(--volt)"
                  : incorrect
                    ? "var(--destructive)"
                    : "transparent";
                const border = correct
                  ? "var(--volt)"
                  : incorrect
                    ? "var(--destructive)"
                    : "rgba(246,240,250,0.25)";
                const glow = correct
                  ? "0 0 14px rgba(184,255,0,0.45)"
                  : incorrect
                    ? "0 0 14px rgba(255,77,109,0.45)"
                    : undefined;
                return (
                  <div
                    key={i}
                    className="size-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: bg,
                      border: `2.5px solid ${border}`,
                      boxShadow: glow,
                    }}
                  >
                    {correct && (
                      <span className="font-extrabold text-sm" style={{ color: "var(--ink)" }}>
                        ✓
                      </span>
                    )}
                    {incorrect && (
                      <span className="font-extrabold text-sm" style={{ color: "var(--lavender)" }}>
                        ✕
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!done ? (
              <button
                onClick={() => navigate({ to: "/daily/question/$n" as any, params: { n: "1" } as any })}
                className="btn-volt mt-6 w-full py-4 text-base rounded-2xl"
              >
                Start Daily 5 →
              </button>
            ) : (
              <Link
                to={"/domains" as any}
                className="block text-center mt-6 w-full py-3.5 text-base font-bold rounded-2xl"
                style={{
                  border: "1.5px solid rgba(246,240,250,0.25)",
                  color: "var(--lavender)",
                }}
              >
                See your Domains
              </Link>
            )}
          </section>

          {/* Momentum module */}
          <section
            ref={momentumRef}
            className="rounded-3xl p-6 backdrop-blur-md flex flex-col relative"
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: "2px solid var(--neon)",
            }}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setMomentumOpen((v) => !v)}
                className="inline-flex rounded-full p-1"
                style={{ color: "rgba(246,240,250,0.55)" }}
                aria-label="What is momentum?"
              >
                <Info className="size-3.5" />
              </button>
              {momentumOpen && (
                <div
                  className="absolute z-40 right-0 top-full mt-2 w-64 sm:w-72 rounded-xl p-3 text-xs leading-relaxed"
                  style={{
                    background: "rgba(20,12,40,0.97)",
                    border: "1px solid rgba(168,85,247,0.5)",
                    color: "rgba(246,240,250,0.92)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--volt)" }}>
                    Momentum
                  </div>
                  Momentum rewards consistency. Complete the Daily 5 to raise it by 1. Miss a day and it decays by 1.
                  <br />
                  <br />
                  Higher momentum means higher gains for correct answers. Each level adds +0.05 to your mastery multiplier.
                </div>
              )}
            </div>

            <div className="relative mb-1 flex items-center gap-1.5 w-full justify-start">
              <div className="display text-2xl text-[var(--lavender)] mt-1 text-left">
                Momentum multiplies your progress
              </div>
            </div>
            <div className="flex justify-center w-full">
              <MomentumGauge needle={state?.momentumNeedle ?? 0} size={180} />
            </div>
          </section>

          {/* Streak pill */}
          <div className="flex items-center justify-center">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: "rgba(255,230,0,0.12)", border: "1px solid rgba(255,230,0,0.35)" }}
            >
              <Flame className="size-4" style={{ color: "var(--spark)" }} />
              <span className="display text-base tabular-nums text-[var(--lavender)]">{streak}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(246,240,250,0.7)" }}>
                day streak
              </span>
            </div>
          </div>

        </main>
      </div>

      <BonusUnlockModal
        open={!!bonusDomainId}
        domainId={bonusDomainId}
        domainLabel={bonusDomainId ? (domainById(bonusDomainId)?.label ?? "") : ""}
        onClose={() => setBonusDomainId(null)}
      />
    </FreeShell>
  );
}
