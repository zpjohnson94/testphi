import { tierFromOverall, sectionEloToSAT, overallProjected } from "@/lib/elo";
import { Trophy, TrendingUp } from "lucide-react";

// Estimate percentile from projected SAT (rough College Board curve approximation).
function percentile(sat: number): number {
  if (sat >= 1550) return 99;
  if (sat >= 1500) return 98;
  if (sat >= 1450) return 96;
  if (sat >= 1400) return 94;
  if (sat >= 1350) return 91;
  if (sat >= 1300) return 87;
  if (sat >= 1250) return 81;
  if (sat >= 1200) return 74;
  if (sat >= 1150) return 66;
  if (sat >= 1100) return 58;
  if (sat >= 1050) return 49;
  if (sat >= 1000) return 40;
  if (sat >= 950) return 32;
  if (sat >= 900) return 24;
  if (sat >= 850) return 17;
  return Math.max(1, Math.round((sat - 400) / 30));
}

export function EloHeroCard({ rwElo, mathElo }: { rwElo: number; mathElo: number }) {
  const overall = overallProjected(rwElo, mathElo);
  const t = tierFromOverall(overall);
  const pct = percentile(overall);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}
    >
      {/* topo overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><g fill='none' stroke='%23B8FF00' stroke-width='1'><path d='M0 60 Q100 20 200 60 T400 60'/><path d='M0 90 Q100 50 200 90 T400 90'/><path d='M0 120 Q100 80 200 120 T400 120'/><path d='M0 150 Q100 110 200 150 T400 150'/></g></svg>\")",
          backgroundSize: "cover",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em] font-bold"
            style={{ color: "var(--volt)" }}
          >
            Projected SAT
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="score-num text-7xl text-[var(--lavender)]">{overall}</div>
            <div className="text-base font-bold" style={{ color: "rgba(246,240,250,0.6)" }}>
              / 1600
            </div>
          </div>
          <div
            className="mt-1 flex items-center gap-2 text-xs font-bold"
            style={{ color: "var(--volt)" }}
          >
            <TrendingUp className="size-3.5" />
            Top {100 - pct}% · {pct}th percentile
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-2"
          style={{ background: "rgba(184,255,0,0.15)", border: "1px solid var(--volt)" }}
        >
          <Trophy className="size-4" style={{ color: "var(--volt)" }} />
          <span className="text-sm font-extrabold" style={{ color: "var(--volt)" }}>
            {t.tier}
          </span>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <SectionMini label="Reading & Writing" sat={sectionEloToSAT(rwElo)} accent="var(--volt)" />
        <SectionMini label="Math" sat={sectionEloToSAT(mathElo)} accent="var(--neon)" />
      </div>

      {t.next && (
        <div className="relative mt-5">
          <div
            className="flex justify-between text-[11px] font-bold mb-1.5"
            style={{ color: "rgba(246,240,250,0.85)" }}
          >
            <span>{t.tier} tier</span>
            <span>Next: {t.next}</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(246,240,250,0.15)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((overall - (t.next - 150)) / 150) * 100)}%`,
                background: "var(--volt)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionMini({ label, sat, accent }: { label: string; sat: number; accent: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(246,240,250,0.1)" }}
    >
      <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="score-num text-3xl text-[var(--lavender)]">{sat}</div>
        <div className="text-[11px] font-bold" style={{ color: "rgba(246,240,250,0.5)" }}>
          / 800
        </div>
      </div>
    </div>
  );
}
