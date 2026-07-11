import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import {
  DOMAINS,
  tierColor,
  tierLabel,
  tierOf,
  SCORING,
  domainById,
  type Tier,
} from "@/lib/freeUser";
import { useFreeState } from "@/lib/useFree";
import { PowerUpModal } from "@/components/PowerUpModal";
import { UnlockReadyCard } from "@/components/UnlockReadyCard";
import { BonusUnlockModal } from "@/components/BonusUnlockModal";


export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({ meta: [{ title: "Domains — TestPhi" }] }),
  component: Domains,
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

function Domains() {
  const { data: state } = useFreeState();
  const [showModal, setShowModal] = useState(false);
  const [bonusDomainId, setBonusDomainId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const all = DOMAINS.map((d) => {
      const stat = state?.domainStats[d.id];
      return {
        ...d,
        mastery: stat?.mastery ?? 0,
        initialized: stat?.initialized ?? false,
        answered: stat?.answered ?? 0,
        bonusStep: stat?.bonusStep ?? 0,
        bonusReady: !!stat && !stat.initialized && stat.answered >= SCORING.THRESHOLD_QUESTIONS,
      };
    }).sort((a, b) => {
      if (a.initialized !== b.initialized) return a.initialized ? -1 : 1;
      return a.mastery - b.mastery;
    });
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
              Domains
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
                    // Bonus-ready: replace the mastery card entirely with the
                    // chartreuse "unlock ready" card.
                    if (d.bonusReady) {
                      return (
                        <UnlockReadyCard
                          key={d.id}
                          domainName={name}
                          onOpen={() => setBonusDomainId(d.id)}
                        />
                      );
                    }
                    return (
                      <div
                        key={d.id}
                        className="w-full rounded-2xl p-5"
                        style={{
                          background: d.initialized && Math.round(d.mastery) === 100
                            ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                            : "#1a1230",
                          border: d.initialized && Math.round(d.mastery) === 100
                            ? "2px solid #B8860B"
                            : `1.5px solid ${color}`,
                          boxShadow: d.initialized && Math.round(d.mastery) === 100
                            ? "0 0 40px -4px rgba(255, 215, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.35)"
                            : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 text-left">
                            <DomainPill section={section} />
                            <div
                              className="mt-2 display text-lg leading-tight"
                              style={{ color: d.initialized && Math.round(d.mastery) === 100 ? "#1a1230" : "var(--lavender)" }}
                            >
                              {name}
                            </div>
                          </div>
                          <div
                            className="score-num text-lg tabular-nums shrink-0"
                            style={{ color: d.initialized && Math.round(d.mastery) === 100 ? "#1a1230" : color }}
                          >
                            {d.initialized ? `${Math.round(d.mastery)}%` : ""}
                          </div>
                        </div>

                        {d.initialized ? (
                          <div
                            className="mt-4 h-2 rounded-full overflow-hidden"
                            style={{
                              background: d.initialized && Math.round(d.mastery) === 100 ? "rgba(26,18,48,0.25)" : "rgba(0,0,0,0.3)",
                              border: `1px solid ${d.initialized && Math.round(d.mastery) === 100 ? "#1a1230" : `color-mix(in srgb, ${color}, transparent 75%)`}`,
                            }}
                          >
                            <div
                              className="mastery-swirl-fill h-full rounded-full transition-all duration-700"
                              style={{ width: `${d.mastery}%`, ["--swirl-color" as any]: d.initialized && Math.round(d.mastery) === 100 ? "#1a1230" : color }}
                            />
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="flex gap-1.5">
                              {Array.from({ length: SCORING.THRESHOLD_QUESTIONS }).map((_, i) => {
                                const filled = i < d.answered;
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 h-2 rounded-full"
                                    style={{
                                      background: filled ? "var(--volt)" : "rgba(246,240,250,0.12)",
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div
                              className="mt-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                              style={{ color: "rgba(246,240,250,0.55)" }}
                            >
                              {d.answered} / {SCORING.THRESHOLD_QUESTIONS} questions to calibration
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-4 w-full py-3 text-sm font-bold text-center rounded-2xl"
                          style={{
                            background: d.initialized && Math.round(d.mastery) === 100 ? "#1a1230" : "var(--volt)",
                            color: d.initialized && Math.round(d.mastery) === 100 ? "var(--volt)" : "var(--ink)",
                            boxShadow: d.initialized && Math.round(d.mastery) === 100 ? "0 4px 0 0 #0f0a1c" : "var(--shadow-pop)",
                          }}
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

      <BonusUnlockModal
        open={!!bonusDomainId}
        domainId={bonusDomainId}
        domainLabel={bonusDomainId ? (domainById(bonusDomainId)?.label ?? "") : ""}
        onClose={() => setBonusDomainId(null)}
      />
    </FreeShell>
  );
}
