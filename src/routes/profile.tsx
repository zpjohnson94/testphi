import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHydration, useStore, resetAll, updateAvatar } from "@/lib/store";
import { SKILLS } from "@/lib/content";
import { sectionEloToSAT, overallProjected, tierFromOverall } from "@/lib/elo";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Avatar, ANIMALS, COLOR_SWATCHES, ACCESSORIES, type AvatarConfig, type AnimalId, type AccessoryId } from "@/components/Avatar";
import { Lock } from "lucide-react";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SAT Quest" }] }),
  component: Profile,
});

function Profile() {
  useHydration();
  const state = useStore((s) => s);
  const overall = overallProjected(state.rwElo, state.mathElo);
  const t = tierFromOverall(overall);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar);

  const data = state.eloHistory.map((h) => ({
    date: h.date.slice(5),
    overall: sectionEloToSAT(h.rw) + sectionEloToSAT(h.math),
  }));

  const saveAvatar = () => { updateAvatar(draft); setEditing(false); sfx.levelUp(); };
  const startEdit = () => { setDraft(state.avatar); setEditing(true); };

  return (
    <AppShell>
      <div className="topo-bg topo-dim min-h-screen">
        <div className="mx-auto max-w-2xl p-5 space-y-5 animate-fade-up">
          {/* Header card */}
          <div className="rounded-3xl p-6 flex items-center gap-4" style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}>
            <button onClick={startEdit} className="size-24 rounded-3xl flex items-center justify-center transition-transform hover:scale-105" style={{ background: "rgba(184,255,0,0.12)", border: "2px solid var(--volt)" }}>
              <Avatar config={state.avatar} size={80} animate />
            </button>
            <div className="flex-1">
              <div className="display text-2xl text-[var(--lavender)]">{state.name}</div>
              <div className="text-sm font-bold" style={{ color: "var(--volt)" }}>{t.tier} · {overall} projected</div>
              <div className="mt-2 flex gap-2 text-xs font-bold flex-wrap">
                <Pill label={`${state.totalXp} XP`} />
                <Pill label={`${state.streak}d streak`} />
                <Pill label={`${state.unlockedAccessories.length} unlocks`} />
              </div>
            </div>
          </div>

          {editing && (
            <div className="rounded-3xl p-5 animate-pop" style={{ background: "var(--lavender)", color: "var(--ink)" }}>
              <div className="flex items-center justify-between">
                <h3 className="display text-lg">Customize</h3>
                <button onClick={() => setEditing(false)} className="text-xs font-bold uppercase" style={{ color: "#5a4a72" }}>Cancel</button>
              </div>
              <div className="mt-3 flex justify-center"><Avatar config={draft} size={120} animate /></div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Animal</div>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {ANIMALS.map((a) => (
                  <button key={a.id} onClick={() => setDraft({ ...draft, animal: a.id as AnimalId })} className="aspect-square rounded-2xl flex items-center justify-center" style={{
                    background: draft.animal === a.id ? "var(--violet-deep)" : "rgba(74,6,136,0.06)",
                    border: draft.animal === a.id ? "2px solid var(--neon)" : "2px solid transparent",
                  }}>
                    <Avatar config={{ ...draft, animal: a.id as AnimalId, accessory: "none" }} size={32} />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Color</div>
              <div className="mt-2 grid grid-cols-10 gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button key={c} onClick={() => setDraft({ ...draft, color: c })} className="aspect-square rounded-full" style={{
                    background: c,
                    border: draft.color === c ? "3px solid var(--ink)" : "2px solid rgba(0,0,0,0.15)",
                    boxShadow: draft.color === c ? "0 0 0 2px var(--neon)" : "none",
                  }} />
                ))}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Accessories</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {ACCESSORIES.map((a) => {
                  const unlocked = state.unlockedAccessories.includes(a.id);
                  const selected = draft.accessory === a.id;
                  return (
                    <button
                      key={a.id}
                      disabled={!unlocked}
                      onClick={() => setDraft({ ...draft, accessory: a.id as AccessoryId })}
                      className="rounded-2xl p-2 text-center disabled:opacity-50"
                      style={{
                        background: selected ? "var(--violet-deep)" : "rgba(74,6,136,0.06)",
                        border: selected ? "2px solid var(--neon)" : "2px solid transparent",
                      }}
                    >
                      <div className="aspect-square flex items-center justify-center">
                        {unlocked ? <Avatar config={{ ...draft, accessory: a.id as AccessoryId }} size={44} /> : <Lock className="size-5" style={{ color: "#5a4a72" }} />}
                      </div>
                      <div className="text-[10px] font-bold mt-1" style={{ color: selected ? "var(--volt)" : "#5a4a72" }}>{a.name}</div>
                      {!unlocked && <div className="text-[9px]" style={{ color: "#8a7aa0" }}>{a.unlock}</div>}
                    </button>
                  );
                })}
              </div>

              <button onClick={saveAvatar} className="btn-volt w-full mt-5 py-3.5">Save</button>
            </div>
          )}

          {/* Chart */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(246,240,250,0.05)", border: "1px solid rgba(246,240,250,0.1)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--volt)" }}>Score history</div>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(246,240,250,0.07)" />
                  <XAxis dataKey="date" stroke="rgba(246,240,250,0.5)" fontSize={11} />
                  <YAxis domain={[400, 1600]} stroke="rgba(246,240,250,0.5)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--violet-deep)", border: "1px solid var(--neon)", borderRadius: 12, color: "var(--lavender)" }} />
                  <Line type="monotone" dataKey="overall" stroke="var(--volt)" strokeWidth={3} dot={{ r: 4, fill: "var(--volt)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill mastery */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(246,240,250,0.05)", border: "1px solid rgba(246,240,250,0.1)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--neon)" }}>Skill mastery</div>
            <div className="space-y-3">
              {SKILLS.map((s) => {
                const m = state.mastery[s.id] ?? 0;
                const color = m >= 70 ? "var(--volt)" : m >= 40 ? "var(--spark)" : "var(--destructive)";
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm font-bold mb-1" style={{ color: "var(--lavender)" }}>
                      <span>{s.name}</span>
                      <span className="tabular-nums" style={{ color }}>{m}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <div className="h-full transition-all" style={{ width: `${m}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => { if (confirm("Reset all progress?")) resetAll(); }}
            className="w-full rounded-2xl py-3 font-bold text-sm"
            style={{ background: "rgba(246,240,250,0.05)", color: "rgba(246,240,250,0.6)", border: "1px solid rgba(246,240,250,0.1)" }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(184,255,0,0.15)", color: "var(--volt)", border: "1px solid rgba(184,255,0,0.3)" }}>{label}</span>;
}
