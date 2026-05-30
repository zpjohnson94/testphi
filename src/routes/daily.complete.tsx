import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Lock } from "lucide-react";
import {
  applySession,
  loadFree,
  saveFree,
  pickHeadline,
  domainById,
  type SessionResult,
  type FreeState,
} from "@/lib/freeUser";
import { PowerUpModal } from "@/components/PowerUpModal";

export const Route = createFileRoute("/daily/complete")({
  head: () => ({ meta: [{ title: "Daily 5 complete — TestPhi" }] }),
  component: DailyComplete;
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

function DailyComplete() {
  const navigate = useNavigate();
  const [computed, setComputed] = useState<{
    state: FreeState;
    results: SessionResult[];
    prevOverall: number;
    newOverall: number;
    delta: number;
  } | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Apply the session ONCE on mount.
  useEffect(() => {
    const results = loadSessionResults();
    if (results.length === 0) {
      navigate({ to: "/home" as any, replace: true });
      return;
    }
    const prev = loadFree();
    const next = applySession(prev, results);
    saveFree(next);
    clearSession();
    setComputed({
      state: next,
      results,
      prevOverall: prev.overall,
      newOverall: next.overall,
      delta: next.overall - prev.overall,
    });
    setAnimatedScore(prev.overall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!computed) return;
    const { prevOverall, newOverall } = computed;
    const duration = 1800;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(prevOverall + (newOverall - prevOverall) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [computed]);

  const headline = useMemo(() => {
    if (!computed) return "";
    return pickHeadline(computed.delta >= 0, computed.state.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed?.delta, computed?.state.name]);

  if (!computed) return null;

  const { state, results, delta } = computed;

  const missedDomains = Array.from(
    new Set(results.filter((r) => !r.correct).map((r) => r.domainId)),
  );

  const positive = delta > 0;
  const neutral = delta === 0;
  const deltaColor = positive
    ? "var(--volt)"
    : neutral
      ? "rgba(246,240,250,0.65)"
      : "var(--destructive)";
  const deltaText = neutral
    ? "No change"
    : `${positive ? "+" : ""}${delta} points`;

  return (
    <div className="topo-bg min-h-screen pb-12">
      <main className="mx-auto max-w-2xl px-5 pt-10 space-y-7 animate-fade-up">
        {/* Headline */}
        <div className="text-center">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: positive ? "var(--volt)" : neutral ? "rgba(246,240,250,0.6)" : "var(--destructive)" }}
          >
            Daily 5 complete
          </div>
          <h1 className="mt-2 display text-3xl sm:text-4xl text-[var(--lavender)]">{headline}</h1>
        </div>

        {/* New score */}
        <section
          className="rounded-3xl p-6 text-center"
          style={{
            background: "var(--violet-deep)",
            border: "1.5px solid rgba(168,85,247,0.4)",
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--volt)" }}
          >
            New Predicted Score
          </div>
          <div className="mt-3 flex items-end justify-center gap-2">
            <div
              className="score-num text-[80px] sm:text-[100px] leading-none"
              style={{ color: "var(--volt)" }}
            >
              {animatedScore}
            </div>
            <div className="score-num text-2xl mb-3" style={{ color: "rgba(184,255,0,0.6)" }}>
              /1600
            </div>
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold"
            style={{
              background: `color-mix(in oklab, ${deltaColor} 15%, transparent)`,
              color: deltaColor,
              border: `1px solid ${deltaColor}`,
            }}
          >
            {deltaText}
          </div>
        </section>

        {/* Result circles + streak */}
        <section
          className="rounded-3xl p-5"
          style={{
            background: "rgba(246,240,250,0.04)",
            border: "1px solid rgba(246,240,250,0.1)",
          }}
        >
          <div className="flex items-center gap-3 justify-center">
            {results
              .sort((a, b) => a.n - b.n)
              .map((r, i) => (
                <div
                  key={i}
                  className="size-10 rounded-full flex items-center justify-center"
                  style={{
                    background: r.correct ? "var(--volt)" : "var(--destructive)",
                    color: r.correct ? "var(--ink)" : "#fff",
                  }}
                >
                  <span className="font-extrabold text-sm">{r.correct ? "✓" : "✕"}</span>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Flame className="size-5" style={{ color: "var(--spark)" }} />
            <span className="display text-base text-[var(--lavender)]">
              {state.streak} day streak
            </span>
          </div>
        </section>

        {/* Missed domains — locked */}
        {missedDomains.length > 0 && (
          <section>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.18em] px-1"
              style={{ color: "rgba(246,240,250,0.7)" }}
            >
              Domains to review
            </div>
            <div className="mt-3 space-y-2">
              {missedDomains.map((id) => {
                const d = domainById(id);
                if (!d) return null;
                return (
                  <div
                    key={id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{
                      background: "rgba(255,77,109,0.08)",
                      border: "1px solid rgba(255,77,109,0.35)",
                    }}
                  >
                    <span className="text-sm font-bold text-[var(--lavender)]">{d.label}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="mt-3 w-full rounded-2xl p-4 flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
              style={{
                background: "rgba(74,6,136,0.4)",
                border: "1.5px solid var(--neon)",
              }}
            >
              <div className="flex items-center gap-3 text-left">
                <div
                  className="size-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,230,0,0.18)", border: "2px solid var(--spark)" }}
                >
                  <Lock className="size-4" style={{ color: "var(--spark)" }} />
                </div>
                <div>
                  <div className="display text-base text-[var(--lavender)]">
                    Drill the domains you missed
                  </div>
                  <div
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: "rgba(246,240,250,0.7)" }}
                  >
                    Unlock with Power Up
                  </div>
                </div>
              </div>
              <span className="text-lg" style={{ color: "var(--volt)" }}>
                →
              </span>
            </button>
          </section>
        )}

        <Link
          to={"/home" as any}
          className="btn-volt block text-center mt-4 py-3.5 text-base rounded-2xl"
        >
          Back to Home
        </Link>
      </main>

      <PowerUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Power Up to drill your weak domains"
      />
    </div>
  );
}
