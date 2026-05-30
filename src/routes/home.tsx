import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Zap } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import { loadFree, hasCompletedToday, type FreeState } from "@/lib/freeUser";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — TestPhi" }] }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<FreeState | null>(() =>
    typeof window === "undefined" ? null : loadFree(),
  );
  const overall = state?.overall ?? 800;
  const streak = state?.streak ?? 0;
  const done = state ? hasCompletedToday(state) : false;
  const lastSession = state?.lastSession ?? null;
  const [animatedScore, setAnimatedScore] = useState(overall);

  useEffect(() => {
    if (!state) setState(loadFree());
  }, []);

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

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen">
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
        >
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="display text-base text-[var(--lavender)]">TestPhi</span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "rgba(255,230,0,0.12)", border: "1px solid rgba(255,230,0,0.35)" }}
            >
              <Flame className="size-4" style={{ color: "var(--spark)" }} />
              <span className="display text-sm tabular-nums text-[var(--lavender)]">{streak}</span>
              <span className="text-[10px] font-bold uppercase" style={{ color: "rgba(246,240,250,0.7)" }}>
                day streak
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 pt-10 pb-10 space-y-8 animate-fade-up">
          {/* Hero: predicted score */}
          <section className="text-center">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--volt)" }}
            >
              Predicted Score
            </div>
            <div className="mt-3 flex items-end justify-center gap-2">
              <div
                className="score-num text-[96px] sm:text-[120px] leading-none"
                style={{ color: "var(--volt)" }}
              >
                {animatedScore}
              </div>
              <div className="score-num text-2xl mb-3" style={{ color: "rgba(184,255,0,0.6)" }}>
                /1600
              </div>
            </div>
            {lastSession && lastSession.delta !== 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                style={{
                  background: lastSession.delta > 0 ? "rgba(184,255,0,0.15)" : "rgba(255,77,109,0.15)",
                  color: lastSession.delta > 0 ? "var(--volt)" : "var(--destructive)",
                  border: `1px solid ${lastSession.delta > 0 ? "var(--volt)" : "var(--destructive)"}`,
                }}
              >
                <Zap className="size-3.5" />
                {lastSession.delta > 0 ? "+" : ""}
                {lastSession.delta} pts last session
              </div>
            )}
          </section>

          {/* Daily 5 card */}
          <section
            className="rounded-3xl p-6"
            style={{
              background: "var(--violet-deep)",
              border: `2px solid ${done ? "var(--volt)" : "var(--neon)"}`,
              boxShadow: done ? "0 0 60px -10px rgba(184,255,0,0.4)" : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: done ? "var(--volt)" : "var(--neon)" }}
                >
                  Daily 5
                </div>
                <div className="display text-2xl text-[var(--lavender)] mt-1">
                  {done ? "Daily 5 complete." : "5 questions to keep your streak."}
                </div>
                {done && (
                  <div className="text-sm font-semibold mt-1" style={{ color: "var(--volt)" }}>
                    Nice work!
                  </div>
                )}
              </div>
            </div>

            {/* Five circle indicators */}
            <div className="mt-5 flex items-center gap-3 justify-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < answeredCount;
                return (
                  <div
                    key={i}
                    className="size-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: filled ? "var(--volt)" : "transparent",
                      border: `2.5px solid ${filled ? "var(--volt)" : "rgba(246,240,250,0.25)"}`,
                      boxShadow: filled ? "0 0 14px rgba(184,255,0,0.45)" : undefined,
                    }}
                  >
                    {filled && (
                      <span className="font-extrabold text-sm" style={{ color: "var(--ink)" }}>
                        ✓
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
                to={"/skill-map" as any}
                className="block text-center mt-6 w-full py-3.5 text-base font-bold rounded-2xl"
                style={{
                  border: "1.5px solid rgba(246,240,250,0.25)",
                  color: "var(--lavender)",
                }}
              >
                See your Skill Map
              </Link>
            )}
          </section>
        </main>
      </div>
    </FreeShell>
  );
}
