import { tierFromOverall, sectionEloToSAT, overallProjected } from "@/lib/elo";
import { Trophy } from "lucide-react";

export function EloHeroCard({ rwElo, mathElo }: { rwElo: number; mathElo: number }) {
  const overall = overallProjected(rwElo, mathElo);
  const t = tierFromOverall(overall);
  const progressToNext = t.next ? Math.min(100, Math.max(0, ((overall - (t.next - 150)) / 150) * 100)) : 100;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-primary-foreground"
      style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
    >
      <div className="absolute -top-12 -right-12 size-48 rounded-full opacity-20" style={{ background: "white" }} />
      <div className="absolute -bottom-16 -left-8 size-40 rounded-full opacity-10" style={{ background: "white" }} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-80 font-bold">Projected SAT</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-6xl font-extrabold tabular-nums">{overall}</div>
            <div className="text-base opacity-80 font-semibold">/ 1600</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-2 backdrop-blur"
          style={{ background: "oklch(1 0 0 / 0.18)" }}
        >
          <Trophy className="size-4" style={{ color: t.color }} />
          <span className="text-sm font-bold">{t.tier}</span>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <SectionMini label="Reading & Writing" elo={rwElo} sat={sectionEloToSAT(rwElo)} />
        <SectionMini label="Math" elo={mathElo} sat={sectionEloToSAT(mathElo)} />
      </div>

      {t.next && (
        <div className="relative mt-5">
          <div className="flex justify-between text-[11px] font-semibold opacity-90 mb-1.5">
            <span>{t.tier} tier</span>
            <span>Next: {t.next}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(1 0 0 / 0.2)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressToNext}%`, background: "white" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionMini({ label, elo, sat }: { label: string; elo: number; sat: number }) {
  return (
    <div className="rounded-2xl p-3 backdrop-blur" style={{ background: "oklch(1 0 0 / 0.15)" }}>
      <div className="text-[11px] uppercase tracking-wide opacity-90 font-bold">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-2xl font-extrabold tabular-nums">{sat}</div>
        <div className="text-[11px] opacity-80">SAT</div>
      </div>
      <div className="text-[11px] opacity-80 font-semibold">ELO {elo}</div>
    </div>
  );
}
