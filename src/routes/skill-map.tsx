import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import {
  DOMAINS,
  loadFree,
  tierColor,
  tierLabel,
  tierOf,
  type FreeState,
} from "@/lib/freeUser";
import { PowerUpModal } from "@/components/PowerUpModal";

export const Route = createFileRoute("/skill-map")({
  head: () => ({ meta: [{ title: "Skill Map — TestPhi" }] }),
  component: SkillMap,
});

function SkillMap() {
  const [state, setState] = useState<FreeState | null>(() =>
    typeof window === "undefined" ? null : loadFree(),
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!state) setState(loadFree());
  }, []);

  const sorted = useMemo(() => {
    return [...DOMAINS]
      .map((d) => ({ ...d, mastery: state?.domainScores[d.id] ?? 40 }))
      .sort((a, b) => a.mastery - b.mastery);
  }, [state]);

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

        <main className="mx-auto max-w-2xl px-5 pt-8 pb-10 space-y-6 animate-fade-up">
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--volt)" }}
            >
              Skill Map
            </div>
            <h1 className="mt-1 display text-3xl text-[var(--lavender)]">
              All 8 SAT domains
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
              Sorted from weakest to strongest. Focus where the upside is biggest.
            </p>
          </div>

          <div className="grid gap-3">
            {sorted.map((d) => {
              const tier = tierOf(d.mastery);
              const color = tierColor(tier);
              return (
                <div
                  key={d.id}
                  className="rounded-2xl p-5"
                  style={{
                    background: "rgba(246,240,250,0.04)",
                    border: `1.5px solid ${color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color }}
                      >
                        {tierLabel(tier)}
                      </div>
                      <div className="mt-1 display text-base text-[var(--lavender)] truncate">
                        {d.label}
                      </div>
                    </div>
                    <div
                      className="score-num text-lg tabular-nums shrink-0"
                      style={{ color }}
                    >
                      {Math.round(d.mastery)}%
                    </div>
                  </div>

                  <div
                    className="mt-3 h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${d.mastery}%`, background: color }}
                    />
                  </div>

                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    style={{
                      background: "rgba(74,6,136,0.4)",
                      color: "var(--lavender)",
                      border: "1px solid rgba(168,85,247,0.5)",
                    }}
                  >
                    <Lock className="size-3.5" style={{ color: "var(--spark)" }} />
                    Drill this domain
                  </button>
                </div>
              );
            })}
          </div>
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
