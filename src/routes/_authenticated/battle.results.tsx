import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, defaultAvatar, ANIMALS, COLOR_SWATCHES, type AvatarConfig } from "@/components/Avatar";
import { useStore } from "@/lib/store";
import { useFreeState } from "@/lib/useFree";

type BattleResultSearch = {
  rank?: number | string;
  result?: "win" | "loss" | "tie" | "";
  correct?: number;
  wrong?: number;
  wins?: number;
  alert?: string;
  opponentName?: string;
  opponentAnimalSeed?: number | string;
  opponentColorSeed?: number | string;
  opponentCorrect?: number | string;
  opponentWrong?: number | string;
};

export const Route = createFileRoute("/_authenticated/battle/results")({
  head: () => ({ meta: [{ title: "Battle results — TestPhi" }] }),
  validateSearch: (s: Record<string, unknown>): BattleResultSearch => ({
    rank: s.rank === "" || s.rank == null ? undefined : Number(s.rank),
    result: (s.result as any) ?? "",
    correct: s.correct == null ? 0 : Number(s.correct),
    wrong: s.wrong == null ? 0 : Number(s.wrong),
    wins: s.wins == null ? 0 : Number(s.wins),
    alert: (s.alert as string) ?? "",
    opponentName: (s.opponentName as string) ?? "Opponent",
    opponentAnimalSeed: s.opponentAnimalSeed == null ? undefined : Number(s.opponentAnimalSeed),
    opponentColorSeed: s.opponentColorSeed == null ? undefined : Number(s.opponentColorSeed),
    opponentCorrect: s.opponentCorrect == null ? undefined : Number(s.opponentCorrect),
    opponentWrong: s.opponentWrong == null ? undefined : Number(s.opponentWrong),
  }),
  component: BattleResults,
});

function opponentAvatarConfig(seedAnimal?: number, seedColor?: number): AvatarConfig | null {
  if (seedAnimal == null || seedColor == null) return null;
  const animal = ANIMALS[seedAnimal % ANIMALS.length]?.id ?? "bear";
  const color = COLOR_SWATCHES[seedColor % COLOR_SWATCHES.length] ?? "#A855F7";
  return { animal, color, accessory: "none" };
}

function BattleResults() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/battle/results" });
  const { result, correct = 0, wrong = 0, wins = 0, rank, alert } = search;
  const rankNum = typeof rank === "number" && !isNaN(rank) ? rank : null;
  const showAlert = alert === "1" && rankNum !== null;
  const [dismissed, setDismissed] = useState(false);

  const myAvatar = useStore((s) => s.avatar) ?? defaultAvatar();
  const { data: freeState } = useFreeState();
  const myName = (freeState?.name || "You").split(" ")[0];

  const oppName = search.opponentName || "Opponent";
  const oppAvatar = opponentAvatarConfig(
    search.opponentAnimalSeed as number | undefined,
    search.opponentColorSeed as number | undefined,
  );
  const oppCorrect = typeof search.opponentCorrect === "number" ? search.opponentCorrect : null;
  const oppWrong = typeof search.opponentWrong === "number" ? search.opponentWrong : null;

  const headline =
    result === "win" ? "You win!" : result === "loss" ? "Nice try" : result === "tie" ? "It's a tie" : "Battle complete";
  const headlineColor = result === "win" ? "var(--volt)" : result === "loss" ? "var(--destructive)" : "var(--lavender)";

  const share = async () => {
    const text = `I just landed at #${rankNum} on today's TestPhi Battle Mode leaderboard!`;
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "TestPhi Battle Mode" });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen px-5 py-10">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="display text-4xl" style={{ color: headlineColor }}>
            {headline}
          </div>

          {/* Matchup card: avatars + correct/wrong */}
          <div
            className="rounded-3xl p-6 backdrop-blur-md"
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: "2px solid var(--neon)",
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* User */}
              <div className="flex flex-col items-center">
                <Avatar config={myAvatar} size={84} animate />
                <div className="mt-2 display text-lg text-[var(--lavender)] truncate max-w-full px-2">
                  {myName}
                </div>
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                    Correct
                  </div>
                  <div className="display text-4xl text-[var(--volt)] tabular-nums">{correct}</div>
                </div>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="size-6 rounded-md flex items-center justify-center"
                      style={{
                        border: "1.5px solid rgba(246,240,250,0.3)",
                        background: i < wrong ? "var(--destructive)" : "transparent",
                        boxShadow: i < wrong ? "0 0 8px rgba(255,77,109,0.55)" : undefined,
                      }}
                    >
                      {i < wrong && <span className="text-xs font-bold text-white">✕</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center">
                {oppAvatar ? (
                  <Avatar config={oppAvatar} size={84} animate />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{ width: 84, height: 84, background: "rgba(246,240,250,0.15)", border: "2px dashed rgba(246,240,250,0.4)" }}
                  >
                    <span className="display text-3xl text-[var(--lavender)]">?</span>
                  </div>
                )}
                <div className="mt-2 display text-lg text-[var(--lavender)] truncate max-w-full px-2">
                  {oppName}
                </div>
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                    Correct
                  </div>
                  <div className="display text-4xl text-[var(--volt)] tabular-nums">
                    {oppCorrect ?? "—"}
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const filled = oppWrong != null ? i < oppWrong : false;
                    return (
                      <div
                        key={i}
                        className="size-6 rounded-md flex items-center justify-center"
                        style={{
                          border: "1.5px solid rgba(246,240,250,0.3)",
                          background: filled ? "var(--destructive)" : "transparent",
                          boxShadow: filled ? "0 0 8px rgba(255,77,109,0.55)" : undefined,
                        }}
                      >
                        {filled && <span className="text-xs font-bold text-white">✕</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Top 100 pulsing CTA */}
          {rankNum !== null && rankNum <= 100 && (
            <button
              onClick={() => navigate({ to: "/battle/leaderboard" as any })}
              className="unlock-pulse relative w-full overflow-hidden text-left rounded-2xl"
              style={{
                background: "var(--volt)",
                color: "var(--ink)",
                border: "2px solid #6e9c00",
                boxShadow:
                  "0 0 40px -6px rgba(184,255,0,0.6), 0 6px 0 0 #6e9c00",
                padding: "16px 18px",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏆</div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="display text-base sm:text-lg leading-tight">
                    You hit the Top 100 today!
                  </div>
                  <div className="text-sm font-bold opacity-80 leading-tight mt-0.5">
                    See where you rank
                  </div>
                </div>
                <div className="shrink-0 text-sm font-extrabold">→</div>
              </div>
            </button>
          )}

          {/* Total wins box */}
          <div
            className="rounded-3xl p-5 backdrop-blur-md flex items-center gap-4"
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: "2px solid var(--neon)",
            }}
          >
            <Avatar config={myAvatar} size={48} />
            <div className="flex-1 text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                Total wins
              </div>
              <div className="display text-2xl text-[var(--lavender)] tabular-nums">{wins}</div>
            </div>
          </div>


          <button
            onClick={() => navigate({ to: "/home" as any })}
            className="btn-volt w-full py-4 rounded-2xl"
          >
            Back to home
          </button>
        </div>

        {showAlert && !dismissed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setDismissed(true)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-3xl p-6 text-center"
              style={{
                background: "var(--violet-deep)",
                border: "2px solid var(--volt)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div className="text-5xl">🎉</div>
              <div className="display text-2xl mt-3 text-[var(--lavender)]">Top 100!</div>
              <div className="mt-2 text-sm text-[var(--lavender)]/80">
                You just landed at #{rankNum} on today's leaderboard.
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={share}
                  className="btn-volt flex-1 py-3 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Share2 className="size-4" /> Share
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="flex-1 py-3 rounded-2xl font-bold text-[var(--lavender)]"
                  style={{ border: "1.5px solid rgba(246,240,250,0.25)" }}
                >
                  Nice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FreeShell>
  );
}
