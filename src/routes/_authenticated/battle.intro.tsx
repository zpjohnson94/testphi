import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, defaultAvatar, ANIMALS, COLOR_SWATCHES, type AvatarConfig } from "@/components/Avatar";
import { useBattleBundle } from "@/lib/useBattle";
import { useFreeState } from "@/lib/useFree";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/battle/intro")({
  head: () => ({ meta: [{ title: "Battle Mode — TestPhi" }] }),
  component: BattleIntro,
});

function opponentAvatar(animalSeed: number, colorSeed: number): AvatarConfig {
  const animal = ANIMALS[animalSeed % ANIMALS.length]?.id ?? "bear";
  const color = COLOR_SWATCHES[colorSeed % COLOR_SWATCHES.length] ?? "#A855F7";
  return { animal, color, accessory: "none" };
}

function BattleIntro() {
  const navigate = useNavigate();
  const { data: bundle, isLoading, error } = useBattleBundle();
  const { data: freeState } = useFreeState();
  const myAvatar = useStore((s) => s.avatar) ?? defaultAvatar();
  const myName = (freeState?.name || "You").split(" ")[0];

  const [countdown, setCountdown] = useState<number | null>(null);

  // Kick off countdown once bundle is ready.
  useEffect(() => {
    if (!bundle || bundle.alreadyCompleted) return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          clearInterval(id);
          navigate({ to: "/battle/play" as any });
          return 0;
        }
        return c - 1;
      });
    }, 800);
    return () => clearInterval(id);
  }, [bundle?.battleDate]);

  if (isLoading || !bundle) {
    return (
      <FreeShell>
        <div className="topo-bg min-h-screen flex items-center justify-center text-[var(--lavender)]/70">
          Getting your battle ready…
        </div>
      </FreeShell>
    );
  }

  if (error) {
    return (
      <FreeShell>
        <div className="topo-bg min-h-screen flex items-center justify-center text-[var(--lavender)]">
          Couldn't load Battle Mode. Try again in a moment.
        </div>
      </FreeShell>
    );
  }

  if (bundle.alreadyCompleted) {
    return (
      <FreeShell>
        <div className="topo-bg min-h-screen flex items-center justify-center px-6 text-center">
          <div>
            <div className="display text-3xl text-[var(--lavender)]">You already battled today</div>
            <div className="mt-2 text-sm text-[var(--lavender)]/70">Come back tomorrow for a fresh run.</div>
            <button
              onClick={() => navigate({ to: "/home" as any })}
              className="btn-volt mt-6 px-6 py-3 rounded-2xl"
            >
              Back to home
            </button>
          </div>
        </div>
      </FreeShell>
    );
  }

  const opp = bundle.opponent;
  const oppAvatar = opp ? opponentAvatar(opp.animalSeed, opp.colorSeed) : null;

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen flex flex-col items-center justify-center px-6">
        <div className="display text-3xl sm:text-4xl text-[var(--lavender)] text-center">
          Let's battle!
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-2">
            <Avatar config={myAvatar} size={104} animate />
            <div className="display text-lg text-[var(--lavender)]">{myName}</div>
          </div>
          <div className="display text-4xl sm:text-5xl text-[var(--volt)]">vs.</div>
          <div className="flex flex-col items-center gap-2">
            {oppAvatar ? (
              <Avatar config={oppAvatar} size={104} animate />
            ) : (
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 104, height: 104, background: "rgba(246,240,250,0.15)", border: "2px dashed rgba(246,240,250,0.4)" }}
              >
                <span className="display text-3xl text-[var(--lavender)]">?</span>
              </div>
            )}
            <div className="display text-lg text-[var(--lavender)]">
              {opp ? opp.firstName : bundle.firstEver ? "Solo" : "Ghost"}
            </div>
          </div>
        </div>

        {bundle.firstEver && (
          <div className="mt-6 max-w-md text-center text-sm text-[var(--lavender)]/70">
            Battle Mode just launched — come back tomorrow to race today's runs.
          </div>
        )}

        <div className="mt-10 h-24 flex items-center justify-center">
          {countdown !== null && countdown > 0 && (
            <div
              key={countdown}
              className="display text-7xl text-[var(--volt)]"
              style={{ animation: "count-pop 0.8s ease-out" }}
            >
              {countdown}
            </div>
          )}
        </div>

        <style>{`
          @keyframes count-pop {
            0% { transform: scale(0.4); opacity: 0; }
            30% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </FreeShell>
  );
}
