import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { EloHeroCard } from "@/components/EloHeroCard";
import { Avatar } from "@/components/Avatar";
import { useHydration, useStore, weakestSkill, nextRecommendedNode } from "@/lib/store";
import { WORLDS, getNode } from "@/lib/content";
import { Flame, Target, BookOpen, Calculator, ChevronRight, Brain, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Home — TestPhi" }] }),
  component: Dashboard,
});

function Dashboard() {
  useHydration();
  const navigate = useNavigate();
  const state = useStore((s) => s);

  useEffect(() => {
    if (typeof window !== "undefined" && !state.hasOnboarded) {
      const t = setTimeout(() => { if (!state.hasOnboarded) navigate({ to: "/onboarding" as any }); }, 50);
      return () => clearTimeout(t);
    }
  }, [state.hasOnboarded, navigate]);

  const weak = weakestSkill(state);
  const next = nextRecommendedNode(state);
  const nextNodeInfo = next ? getNode(next.nodeId) : null;
  const goalProgress = Math.min(100, (state.xpToday / state.dailyGoalXp) * 100);

  return (
    <AppShell>
      <div className="topo-bg min-h-screen">
        <div className="mx-auto max-w-2xl p-5 space-y-5 animate-fade-up">
          {/* Greeting */}
          <header className="flex items-center justify-between">
            <Link to={"/profile" as any} className="flex items-center gap-3">
              <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.2)", border: "2px solid var(--neon)" }}>
                <Avatar config={state.avatar} size={48} animate />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--volt)" }}>Welcome back</div>
                <div className="display text-lg text-[var(--lavender)]">{state.name}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Stat icon={<Flame className="size-4" style={{ color: "var(--spark)" }} />} value={state.streak} label="streak" />
              <Stat icon={<Zap className="size-4" style={{ color: "var(--volt)" }} />} value={state.totalXp} label="XP" />
            </div>
          </header>

          <EloHeroCard rwElo={state.rwElo} mathElo={state.mathElo} />

          {/* Daily goal */}
          <div className="rounded-3xl p-5" style={{ background: "var(--lavender)", color: "var(--ink)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-5" style={{ color: "var(--neon)" }} />
                <span className="display text-base">Daily goal</span>
              </div>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: "var(--violet-deep)" }}>{state.xpToday} / {state.dailyGoalXp} XP</span>
            </div>
            <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: "#e6dcef" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${goalProgress}%`, background: "var(--volt)" }} />
            </div>
            {next && nextNodeInfo && (
              <button
                onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: next.nodeId } as any })}
                className="btn-volt mt-4 w-full py-3.5 flex items-center justify-center gap-2"
              >
                Continue: {nextNodeInfo.node.title}
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>

          {/* Weakness focus */}
          {weak && (
            <div className="rounded-3xl p-5" style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <div className="flex items-center gap-2">
                <Brain className="size-5" style={{ color: "var(--neon)" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--neon)" }}>Today's weak spot</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="display text-base text-[var(--lavender)]">{weak.name}</div>
                  <div className="text-xs font-bold" style={{ color: "rgba(246,240,250,0.6)" }}>Mastery {weak.mastery}%</div>
                </div>
                <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className="h-full" style={{ width: `${weak.mastery}%`, background: weak.mastery < 40 ? "var(--destructive)" : "var(--volt)" }} />
                </div>
              </div>
            </div>
          )}

          {/* Section maps */}
          <div className="grid gap-3 sm:grid-cols-2">
            {WORLDS.map((w) => (
              <Link
                key={w.id}
                to={(w.section === "rw" ? "/learn/reading-writing" : "/learn/math") as any}
                className="rounded-3xl p-5 transition-transform hover:-translate-y-1"
                style={{
                  background: w.section === "rw" ? "rgba(184,255,0,0.12)" : "rgba(168,85,247,0.15)",
                  border: `1.5px solid ${w.section === "rw" ? "var(--volt)" : "var(--neon)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {w.section === "rw" ? <BookOpen className="size-5" style={{ color: "var(--volt)" }} /> : <Calculator className="size-5" style={{ color: "var(--neon)" }} />}
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: w.section === "rw" ? "var(--volt)" : "var(--neon)" }}>{w.section === "rw" ? "Reading & Writing" : "Math"}</span>
                </div>
                <div className="mt-3 display text-xl text-[var(--lavender)]">{w.name}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: "rgba(246,240,250,0.7)" }}>{w.tagline}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(246,240,250,0.06)", border: "1px solid rgba(246,240,250,0.15)" }}>
      {icon}
      <span className="display text-sm tabular-nums text-[var(--lavender)]">{value}</span>
      <span className="text-[10px] font-bold uppercase" style={{ color: "rgba(246,240,250,0.55)" }}>{label}</span>
    </div>
  );
}
