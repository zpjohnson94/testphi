import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, defaultAvatar, ANIMALS, COLOR_SWATCHES, type AvatarConfig } from "@/components/Avatar";
import { useBattleBundle } from "@/lib/useBattle";
import { useFreeState } from "@/lib/useFree";
import { useStore } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { STATIC_GHOST } from "@/lib/staticGhostProfile";

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

  const [introDone, setIntroDone] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Stage 1: reveal the matchup in three beats, then start the countdown.
  useEffect(() => {
    if (!bundle || bundle.alreadyCompleted) return;
    const id = setTimeout(() => setIntroDone(true), 3200);
    return () => clearTimeout(id);
  }, [bundle?.battleDate]);

  // Stage 2: 3-2-1-Go! countdown.
  useEffect(() => {
    if (!introDone) return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 900);
    return () => clearInterval(id);
  }, [introDone]);

  // Navigate after the "Go!" flash so the player can see it.
  useEffect(() => {
    if (countdown !== 0) return;
    const id = setTimeout(() => {
      navigate({ to: "/battle/play" as any });
    }, 900);
    return () => clearTimeout(id);
  }, [countdown, navigate]);

  // Resume the audio context as soon as the intro animation begins.
  useEffect(() => {
    if (introDone) sfx.resume();
  }, [introDone]);

  // Play a short tick for every visible countdown number (3, 2, 1).
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      sfx.countdown();
    }
  }, [countdown]);


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

  const useStaticGhost = !!(bundle.useStaticGhost || import.meta.env.DEV);
  const opp = bundle.opponent;
  const oppAvatar: AvatarConfig | null = useStaticGhost
    ? { animal: STATIC_GHOST.animal, color: STATIC_GHOST.color, accessory: STATIC_GHOST.accessory }
    : opp
      ? opponentAvatar(opp.animalSeed, opp.colorSeed)
      : null;
  const oppLabel = useStaticGhost
    ? STATIC_GHOST.name
    : opp
      ? opp.firstName
      : bundle.firstEver
        ? "Solo"
        : "Ghost";

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen flex flex-col items-center justify-center px-6">
        <div className="display text-3xl sm:text-4xl text-[var(--lavender)] text-center">
          Let's battle!
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
          <div
            className="flex flex-col items-center gap-2"
            style={{ animation: "intro-fade 0.6s ease-out 0s both" }}
          >
            <Avatar config={myAvatar} size={104} animate />
            <div className="display text-lg text-[var(--lavender)]">{myName}</div>
          </div>
          <div
            className="display text-4xl sm:text-5xl text-[var(--volt)]"
            style={{ animation: "intro-fade 0.6s ease-out 1s both" }}
          >
            vs.
          </div>
          <div
            className="flex flex-col items-center gap-2"
            style={{ animation: "intro-fade 0.6s ease-out 2s both" }}
          >
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
              {oppLabel}
            </div>
          </div>
        </div>



        <div className="mt-10 h-28 flex items-center justify-center">
          {countdown !== null && countdown > 0 && (
            <div
              key={countdown}
              className="display text-8xl sm:text-9xl text-[var(--volt)]"
              style={{ animation: "count-pop 0.8s ease-out" }}
            >
              {countdown}
            </div>
          )}
        </div>

        <style>{`
          @keyframes intro-fade {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
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
