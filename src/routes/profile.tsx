import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useHydration, useStore, resetAll } from "@/lib/store";
import { SKILLS } from "@/lib/content";
import { sectionEloToSAT, overallProjected, tierFromOverall } from "@/lib/elo";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SAT Quest" }] }),
  component: Profile,
});

function Profile() {
  useHydration();
  const state = useStore((s) => s);
  const overall = overallProjected(state.rwElo, state.mathElo);
  const t = tierFromOverall(overall);

  const data = state.eloHistory.map((h) => ({
    date: h.date.slice(5),
    rwSAT: sectionEloToSAT(h.rw),
    mathSAT: sectionEloToSAT(h.math),
    overall: sectionEloToSAT(h.rw) + sectionEloToSAT(h.math),
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-5 space-y-5 animate-fade-up">
        {/* Header */}
        <div className="rounded-3xl border border-border bg-card p-6 flex items-center gap-4" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="size-20 rounded-3xl flex items-center justify-center text-5xl border-2 border-border bg-secondary">{state.avatar}</div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold">{state.name}</div>
            <div className="text-sm text-muted-foreground font-semibold">{t.tier} tier · {overall} projected</div>
            <div className="mt-2 flex gap-2 text-xs font-bold">
              <Pill label={`${state.totalXp} total XP`} />
              <Pill label={`${state.streak}d streak`} />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-3xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Score history</div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[400, 1600]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill mastery */}
        <div className="rounded-3xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-3">Skill mastery</div>
          <div className="space-y-3">
            {SKILLS.map((s) => {
              const m = state.mastery[s.id] ?? 0;
              const color = m >= 70 ? "var(--success)" : m >= 40 ? "var(--xp)" : "var(--destructive)";
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span>{s.name}</span>
                    <span className="tabular-nums" style={{ color }}>{m}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${m}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => { if (confirm("Reset all progress?")) resetAll(); }}
          className="w-full rounded-2xl border border-border bg-card py-3 font-bold text-sm text-muted-foreground hover:bg-muted"
        >
          Reset progress
        </button>
      </div>
    </AppShell>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{label}</span>;
}
