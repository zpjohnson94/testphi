import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { EloHeroCard } from "@/components/EloHeroCard";
import { useHydration, useStore, weakestSkill, nextRecommendedNode } from "@/lib/store";
import { WORLDS, getNode } from "@/lib/content";
import { Flame, Target, BookOpen, Calculator, ChevronRight, Brain } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Home — SAT Quest" }] }),
  component: Dashboard,
});

function Dashboard() {
  useHydration();
  const navigate = useNavigate();
  const state = useStore((s) => s);

  useEffect(() => {
    if (typeof window !== "undefined" && !state.hasOnboarded) {
      // Soft redirect to onboarding after hydration
      const t = setTimeout(() => {
        if (!state.hasOnboarded) navigate({ to: "/onboarding" as any });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [state.hasOnboarded, navigate]);

  const weak = weakestSkill(state);
  const next = nextRecommendedNode(state);
  const nextNodeInfo = next ? getNode(next.nodeId) : null;
  const goalProgress = Math.min(100, (state.xpToday / state.dailyGoalXp) * 100);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-5 space-y-5 animate-fade-up">
        {/* Greeting */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl flex items-center justify-center text-2xl border-2 border-border bg-card">{state.avatar}</div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Welcome back</div>
              <div className="font-extrabold text-lg">{state.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={<Flame className="size-4" style={{ color: "var(--streak)" }} />} value={state.streak} label="day streak" />
          </div>
        </header>

        {/* ELO hero */}
        <EloHeroCard rwElo={state.rwElo} mathElo={state.mathElo} />

        {/* Daily goal */}
        <div className="rounded-3xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-5" style={{ color: "var(--xp)" }} />
              <span className="font-extrabold">Daily goal</span>
            </div>
            <span className="text-sm font-bold text-muted-foreground tabular-nums">{state.xpToday} / {state.dailyGoalXp} XP</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${goalProgress}%`, background: "var(--gradient-xp)" }} />
          </div>
          {next && nextNodeInfo && (
            <button
              onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: next.nodeId } as any })}
              className="mt-4 w-full rounded-2xl py-3.5 font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
            >
              Continue: {nextNodeInfo.node.title}
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>

        {/* Weakness focus */}
        {weak && (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Brain className="size-5" style={{ color: "var(--primary)" }} />
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Today's weak spot</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold">{weak.name}</div>
                <div className="text-xs text-muted-foreground font-semibold">Mastery {weak.mastery}%</div>
              </div>
              <div className="w-28 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full" style={{ width: `${weak.mastery}%`, background: weak.mastery < 40 ? "var(--destructive)" : "var(--success)" }} />
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
              className="rounded-3xl p-5 text-primary-foreground transition-transform hover:-translate-y-1"
              style={{ background: w.section === "rw" ? "var(--gradient-rw)" : "var(--gradient-math)", boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex items-center gap-2">
                {w.section === "rw" ? <BookOpen className="size-5" /> : <Calculator className="size-5" />}
                <span className="text-xs uppercase tracking-widest font-bold opacity-90">{w.section === "rw" ? "Reading & Writing" : "Math"}</span>
              </div>
              <div className="mt-3 text-2xl font-extrabold">{w.emoji} {w.name}</div>
              <div className="mt-1 text-sm opacity-90 font-semibold">{w.tagline}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      {icon}
      <span className="font-extrabold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground font-semibold">{label}</span>
    </div>
  );
}
