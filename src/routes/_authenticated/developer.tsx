import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wrench, Lock, Unlock, ChevronLeft } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { useFreeState, useResetDemo, useResetDailyToday, useDevPatchState } from "@/lib/useFree";
import { DOMAINS, SCORING, type FreeState } from "@/lib/freeUser";
import { hasDevAccess } from "@/lib/devAccess";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({ meta: [{ title: "Developer mode — TestPhi" }] }),
  component: DeveloperPage,
});

function DeveloperPage() {
  const { data: free } = useFreeState();

  if (!free) return <FreeShell><div className="mx-auto max-w-2xl p-5" /></FreeShell>;

  const allowed = hasDevAccess(free.email);

  return (
    <FreeShell>
      <div className="topo-bg topo-dim min-h-screen">
        <div className="mx-auto max-w-2xl p-5 space-y-4 pb-28">
          <div className="flex items-center gap-2">
            <Link
              to={"/account" as any}
              className="size-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(246,240,250,0.06)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.15)" }}
            >
              <ChevronLeft className="size-4" />
            </Link>
            <h1 className="display text-2xl" style={{ color: "var(--destructive)" }}>Developer mode</h1>
          </div>

          {allowed ? (
            <DeveloperMenu state={free} />
          ) : (
            <div className="rounded-2xl p-5 text-sm font-medium" style={{ background: "rgba(255,77,109,0.08)", border: "1px dashed rgba(255,77,109,0.5)", color: "var(--lavender)" }}>
              You don't have access to developer mode.
            </div>
          )}
        </div>
      </div>
    </FreeShell>
  );
}

// ============================= Developer Menu =============================

function DeveloperMenu({ state }: { state: FreeState }) {
  const dev = useDevPatchState();
  const resetDemo = useResetDemo();
  const resetDaily = useResetDailyToday();

  const [momentum, setMomentum] = useState(state.momentumNeedle);
  const [masteryDraft, setMasteryDraft] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const d of DOMAINS) m[d.id] = Math.round(state.domainStats[d.id]?.mastery ?? 0);
    return m;
  });

  const domainRows = useMemo(() => DOMAINS.map((d) => {
    const st = state.domainStats[d.id];
    const locked = !st?.initialized;
    const remaining = Math.max(0, SCORING.THRESHOLD_QUESTIONS - (st?.answered ?? 0));
    return { ...d, locked, answered: st?.answered ?? 0, remaining };
  }), [state]);

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,77,109,0.06)", border: "1.5px dashed rgba(255,77,109,0.55)" }}>
      <div className="flex items-center gap-2 px-5 py-4">
        <Wrench className="size-4" style={{ color: "var(--destructive)" }} />
        <span className="display text-base" style={{ color: "var(--destructive)" }}>Developer mode</span>
      </div>

      <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: "rgba(255,77,109,0.25)" }}>


          {/* Plan */}
          <section className="pt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(246,240,250,0.6)" }}>Plan</div>
            <div className="grid grid-cols-2 gap-2">
              {(["free", "powerup"] as const).map((p) => {
                const active = state.plan === p;
                return (
                  <button
                    key={p}
                    onClick={() => dev.mutate({ plan: p })}
                    disabled={dev.isPending}
                    className="rounded-xl py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    style={{
                      background: active ? "var(--volt)" : "rgba(246,240,250,0.05)",
                      color: active ? "var(--ink)" : "var(--lavender)",
                      border: active ? "1px solid var(--volt)" : "1px solid rgba(246,240,250,0.15)",
                    }}
                  >
                    {p === "free" ? "Free" : "Power Up"}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Momentum */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(246,240,250,0.6)" }}>Momentum needle</div>
              <div className="text-xs tabular-nums" style={{ color: "var(--lavender)" }}>
                {momentum} / 10 · ×{(1 + 0.05 * momentum).toFixed(2)}
              </div>
            </div>
            <input
              type="range" min={0} max={10} step={1}
              value={momentum}
              onChange={(e) => setMomentum(Number(e.target.value))}
              className="w-full"
            />
            <button
              onClick={() => dev.mutate({ momentumNeedle: momentum })}
              disabled={dev.isPending || momentum === state.momentumNeedle}
              className="mt-2 w-full rounded-xl py-2 text-xs font-bold disabled:opacity-40"
              style={{ background: "rgba(184,255,0,0.15)", color: "var(--volt)", border: "1px solid rgba(184,255,0,0.4)" }}
            >
              Set momentum
            </button>
          </section>

          {/* Domain mastery + lock */}
          <section>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(246,240,250,0.6)" }}>Domains</div>
            <div className="space-y-2">
              {domainRows.map((d) => {
                const val = masteryDraft[d.id];
                return (
                  <div key={d.id} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.08)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold truncate" style={{ color: "var(--lavender)" }}>{d.label}</div>
                      <div className="flex items-center gap-1">
                        {d.locked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--destructive)" }}>
                            <Lock className="size-3" /> Locked · {d.remaining} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--volt)" }}>
                            <Unlock className="size-3" /> Unlocked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="range" min={0} max={100} step={1}
                        value={val}
                        onChange={(e) => setMasteryDraft((s) => ({ ...s, [d.id]: Number(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-xs tabular-nums w-10 text-right" style={{ color: "var(--lavender)" }}>{val}%</span>
                      <button
                        onClick={() => dev.mutate({ domainMastery: [{ domainId: d.id, mastery: val }] })}
                        disabled={dev.isPending}
                        className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"
                        style={{ background: "var(--volt)", color: "var(--ink)" }}
                      >
                        Set
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {d.locked ? (
                        <>
                          <label className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(246,240,250,0.5)" }}>
                            Answered
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={SCORING.THRESHOLD_QUESTIONS - 1}
                            value={d.answered}
                            onChange={(e) => {
                              const answered = Math.max(0, Math.min(SCORING.THRESHOLD_QUESTIONS - 1, Number(e.target.value) || 0));
                              dev.mutate({ domainLock: [{ domainId: d.id, locked: true, answered }] });
                            }}
                            className="w-14 rounded-md px-2 py-1 text-xs"
                            style={{ background: "rgba(0,0,0,0.4)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.15)" }}
                          />
                          <span className="text-[10px]" style={{ color: "rgba(246,240,250,0.5)" }}>
                            of {SCORING.THRESHOLD_QUESTIONS}
                          </span>
                          <button
                            onClick={() => dev.mutate({ domainLock: [{ domainId: d.id, locked: false }] })}
                            disabled={dev.isPending}
                            className="ml-auto rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"
                            style={{ background: "rgba(184,255,0,0.15)", color: "var(--volt)", border: "1px solid rgba(184,255,0,0.4)" }}
                          >
                            Unlock
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => dev.mutate({ domainLock: [{ domainId: d.id, locked: true, answered: 0 }] })}
                          disabled={dev.isPending}
                          className="ml-auto rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"
                          style={{ background: "rgba(255,77,109,0.15)", color: "var(--destructive)", border: "1px solid rgba(255,77,109,0.4)" }}
                        >
                          Lock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          {/* Battle mode results preview */}
          <BattleModeDevSection />

          {/* Reset */}
          <section>
            <button
              type="button"
              onClick={() => {
                if (resetDemo.isPending) return;
                if (confirm("Reset demo account? This wipes all Daily 5 progress, sessions, streak, and mastery for your account.")) {
                  resetDemo.mutate();
                }
              }}
              disabled={resetDemo.isPending}
              className="w-full text-[11px] font-bold uppercase tracking-[0.18em] rounded-full px-4 py-3 disabled:opacity-50"
              style={{
                background: "rgba(255,77,109,0.12)",
                border: "1px dashed rgba(255,77,109,0.6)",
                color: "var(--destructive)",
              }}
            >
              {resetDemo.isPending ? "Resetting…" : "Reset demo account"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (resetDaily.isPending) return;
                if (confirm("Reset today's Daily 5? This clears today's answered questions so you can retake Daily 5. Mastery and momentum already earned today are kept.")) {
                  resetDaily.mutate();
                }
              }}
              disabled={resetDaily.isPending}
              className="w-full mt-2 text-[11px] font-bold uppercase tracking-[0.18em] rounded-full px-4 py-3 disabled:opacity-50"
              style={{
                background: "rgba(184,255,0,0.12)",
                border: "1px dashed rgba(184,255,0,0.6)",
                color: "var(--volt)",
              }}
            >
              {resetDaily.isPending ? "Resetting…" : "Reset today's Daily 5"}
            </button>
          </section>
        </div>
    </div>

  );
}

// ============================= Battle mode dev preview =============================

function BattleModeDevSection() {
  const navigate = useNavigate();
  const [useDummyOpp, setUseDummyOpp] = useState(true);
  const [fakeStatus, setFakeStatus] = useState<string>("");
  const [fakeBusy, setFakeBusy] = useState(false);

  const regenerateFakes = async () => {
    if (fakeBusy) return;
    setFakeBusy(true);
    setFakeStatus("");
    try {
      const { devRegenerateFakeRuns } = await import("@/lib/battle.functions");
      const res = await devRegenerateFakeRuns();
      setFakeStatus(`Generated ${res.inserted} fake runs for ${res.battleDate}`);
    } catch (e: any) {
      setFakeStatus(`Failed: ${e?.message ?? "error"}`);
    } finally {
      setFakeBusy(false);
    }
  };
  const [oppName, setOppName] = useState("Ghost");
  const [oppCorrect, setOppCorrect] = useState(4);
  const [oppWrong, setOppWrong] = useState(2);
  const [oppAnimalSeed, setOppAnimalSeed] = useState(1);
  const [oppColorSeed, setOppColorSeed] = useState(2);

  const [overrideUser, setOverrideUser] = useState(true);
  const [userCorrect, setUserCorrect] = useState(6);
  const [userWrong, setUserWrong] = useState(1);

  const [wins, setWins] = useState(1);
  const [rank, setRank] = useState<number | "">(42);
  const [alert, setAlert] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | "tie" | "auto">("auto");

  const openResults = () => {
    const my = overrideUser ? userCorrect : 0;
    const myW = overrideUser ? userWrong : 0;
    const oc = useDummyOpp ? oppCorrect : 0;
    const ow = useDummyOpp ? oppWrong : 0;
    const finalResult: "win" | "loss" | "tie" =
      result !== "auto" ? result : my > oc ? "win" : my < oc ? "loss" : "tie";
    navigate({
      to: "/battle/results" as any,
      search: {
        rank: rank === "" ? "" : rank,
        result: finalResult,
        correct: my,
        wrong: myW,
        wins,
        alert: alert ? "1" : "",
        opponentName: useDummyOpp ? oppName : "Ghost",
        opponentAnimalSeed: useDummyOpp ? oppAnimalSeed : null,
        opponentColorSeed: useDummyOpp ? oppColorSeed : null,
        opponentCorrect: useDummyOpp ? oc : null,
        opponentWrong: useDummyOpp ? ow : null,
      } as any,
    });
  };

  return (
    <section>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(246,240,250,0.6)" }}>
        Battle mode preview
      </div>

      {/* Dummy opponent */}
      <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.08)" }}>
        <DevToggle label="Dummy opponent" checked={useDummyOpp} onChange={setUseDummyOpp} />
        {useDummyOpp && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <LabeledText label="Name" value={oppName} onChange={setOppName} />
            <LabeledNumber label="Correct" value={oppCorrect} onChange={setOppCorrect} min={0} max={99} />
            <LabeledNumber label="Wrong" value={oppWrong} onChange={setOppWrong} min={0} max={3} />
            <LabeledNumber label="Animal seed" value={oppAnimalSeed} onChange={setOppAnimalSeed} min={0} max={20} />
            <LabeledNumber label="Color seed" value={oppColorSeed} onChange={setOppColorSeed} min={0} max={20} />
          </div>
        )}
      </div>

      {/* Override user score */}
      <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.08)" }}>
        <DevToggle label="Set user score" checked={overrideUser} onChange={setOverrideUser} />
        {overrideUser && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <LabeledNumber label="Correct" value={userCorrect} onChange={setUserCorrect} min={0} max={99} />
            <LabeledNumber label="Wrong" value={userWrong} onChange={setUserWrong} min={0} max={3} />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="grid grid-cols-2 gap-2">
          <LabeledNumber label="Total wins" value={wins} onChange={setWins} min={0} max={999} />
          <LabeledNumber
            label="Rank"
            value={typeof rank === "number" ? rank : 0}
            onChange={(v) => setRank(v)}
            min={0}
            max={9999}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <DevToggle label="Top-100 alert" checked={alert} onChange={setAlert} />
        </div>
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(246,240,250,0.5)" }}>
            Result
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(["auto", "win", "loss", "tie"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResult(r)}
                className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: result === r ? "var(--volt)" : "rgba(246,240,250,0.05)",
                  color: result === r ? "var(--ink)" : "var(--lavender)",
                  border: result === r ? "1px solid var(--volt)" : "1px solid rgba(246,240,250,0.15)",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={openResults}
        className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider"
        style={{ background: "rgba(184,255,0,0.15)", color: "var(--volt)", border: "1px solid rgba(184,255,0,0.4)" }}
      >
        Open battle results
      </button>

      <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(246,240,250,0.5)" }}>
          Fake leaderboard runs (today)
        </div>
        <button
          onClick={regenerateFakes}
          disabled={fakeBusy}
          className="w-full rounded-lg py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-40"
          style={{ background: "rgba(255,77,109,0.15)", color: "var(--destructive)", border: "1px solid rgba(255,77,109,0.4)" }}
        >
          {fakeBusy ? "Generating…" : "Generate fake runs"}
        </button>
        {fakeStatus && (
          <div className="mt-2 text-[10px]" style={{ color: "var(--lavender)" }}>{fakeStatus}</div>
        )}
      </div>
    </section>
  );
}

function DevToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-2"
    >
      <span className="text-xs font-bold" style={{ color: "var(--lavender)" }}>{label}</span>
      <span
        className="relative inline-block h-5 w-9 rounded-full transition-colors"
        style={{ background: checked ? "var(--volt)" : "rgba(246,240,250,0.15)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </span>
    </button>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(246,240,250,0.5)" }}>
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="rounded-md px-2 py-1 text-xs"
        style={{ background: "rgba(0,0,0,0.4)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.15)" }}
      />
    </label>
  );
}

function LabeledText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(246,240,250,0.5)" }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md px-2 py-1 text-xs"
        style={{ background: "rgba(0,0,0,0.4)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.15)" }}
      />
    </label>
  );
}
