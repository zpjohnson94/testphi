import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import {
  DOMAINS,
  loadFree,
  tierColor,
  tierLabel,
  tierOf,
  SCORING,
  type FreeState,
  type Tier,
} from "@/lib/freeUser";
import { PowerUpModal } from "@/components/PowerUpModal";


export const Route = createFileRoute("/skill-map")({
  head: () => ({ meta: [{ title: "Skill Map — TestPhi" }] }),
  component: SkillMap,
});

function DomainPill({ section }: { section: string }) {
  const isMath = section === "Math";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: isMath ? "var(--neon)" : "var(--volt)",
        color: isMath ? "var(--lavender)" : "var(--ink)",
      }}
    >
      {section}
    </span>
  );
}

function SkillMap() {
  const [state, setState] = useState<FreeState | null>(() =>
    typeof window === "undefined" ? null : loadFree(),
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!state) setState(loadFree());
  }, []);

  const grouped = useMemo(() => {
    const all = DOMAINS.map((d) => {
      const stat = state?.domainStats[d.id];
      return {
        ...d,
        mastery: stat?.mastery ?? 0,
        initialized: stat?.initialized ?? false,
      };
    }).sort((a, b) => a.mastery - b.mastery);
    const groups: Record<Tier, typeof all> = { locked: [], weak: [], developing: [], strong: [] };
    for (const d of all) groups[tierOf(d.mastery, d.initialized)].push(d);
    return groups;
  }, [state]);

  const order: Tier[] = ["weak", "developing", "strong", "locked"];

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen">
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
        >
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-2">
            <Logo size={28} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-10 space-y-8">
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--volt)" }}
            >
              <br />
            </div>
            <h1 className="mt-1 display text-3xl text-[var(--lavender)]">
              Skill map
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
              Review your level of mastery over 8 SAT domains, sorted from weakest to strongest.
            </p>
          </div>

          {order.map((tier) => {
            const items = grouped[tier];
            if (!items.length) return null;
            const color = tierColor(tier);
            return (
              <section key={tier} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block size-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    {tierLabel(tier)}
                    <span className="ml-2 opacity-60">({items.length})</span>
                  </h2>
                </div>

                <div className="grid gap-3">
                  {items.map((d) => {
                    const parts = d.label.split(" · ");
                    const section = parts[0];
                    const name = parts.slice(1).join(" · ");
                    return (
                      <div
                        key={d.id}
                        className="w-full rounded-2xl p-5"
                        style={{
                          background: "#1a1230",
                          border: `1.5px solid ${color}`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 text-left">
                            <DomainPill section={section} />
                            <div className="mt-2 display text-lg text-[var(--lavender)] leading-tight">
                              {name}
                            </div>
                          </div>
                          <div
                            className="score-num text-lg tabular-nums shrink-0"
                            style={{ color }}
                          >
                            {d.initialized ? `${Math.round(d.mastery)}%` : "—"}
                          </div>
                        </div>

                        <div
                          className="mt-4 h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(0,0,0,0.3)" }}
                        >
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: d.initialized ? `${d.mastery}%` : "0%",
                              background: color,
                            }}
                          />
                        </div>
                        {!d.initialized && (
                          <div
                            className="mt-2 text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: "rgba(246,240,250,0.55)" }}
                          >
                            Calibrating — practice to unlock
                          </div>
                        )}

                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-4 w-full btn-volt py-3 text-sm font-bold text-center"
                        >
                          Drill this domain
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      </div>

      <PowerUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Power Up to drill specific domains"
      />
    </FreeShell>
  );
}
