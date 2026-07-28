import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, ANIMALS, COLOR_SWATCHES, type AvatarConfig } from "@/components/Avatar";
import { getBattleLeaderboard } from "@/lib/battle.functions";

type Search = { date?: string };

export const Route = createFileRoute("/_authenticated/battle/leaderboard")({
  head: () => ({ meta: [{ title: "Battle leaderboard — TestPhi" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    date: typeof s.date === "string" && s.date ? (s.date as string) : undefined,
  }),
  component: BattleLeaderboard,
});

function seedAvatar(animalSeed: number, colorSeed: number): AvatarConfig {
  return {
    animal: ANIMALS[animalSeed % ANIMALS.length]?.id ?? "bear",
    color: COLOR_SWATCHES[colorSeed % COLOR_SWATCHES.length] ?? "#A855F7",
    accessory: "none",
  };
}

function BattleLeaderboard() {
  const navigate = useNavigate();
  const { date } = useSearch({ from: "/_authenticated/battle/leaderboard" });
  const fn = useServerFn(getBattleLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["battle-leaderboard", date ?? "today"],
    queryFn: () => fn({ data: { date } }),
    staleTime: 60_000,
  });

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen px-5 py-8">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => navigate({ to: ".." as any })}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--lavender)]/80 hover:text-[var(--lavender)]"
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          <div className="display text-3xl text-[var(--lavender)]">Today's Top 100</div>
          <div className="mt-1 text-sm text-[var(--lavender)]/70">
            Battle Mode leaderboard
            {data?.myRank ? ` • you're #${data.myRank}` : ""}
          </div>

          <div className="mt-6 space-y-2">
            {isLoading && (
              <div className="text-center text-[var(--lavender)]/70 py-8">Loading…</div>
            )}
            {!isLoading && (data?.entries.length ?? 0) === 0 && (
              <div className="text-center text-[var(--lavender)]/70 py-8">
                No runs recorded yet.
              </div>
            )}
            {data?.entries.map((e) => {
              const cfg = seedAvatar(e.animalSeed, e.colorSeed);
              return (
                <div
                  key={e.userId + e.rank}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-md"
                  style={{
                    background: e.isMe
                      ? "color-mix(in oklab, var(--volt) 22%, transparent)"
                      : "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
                    border: e.isMe
                      ? "2px solid var(--volt)"
                      : "1.5px solid color-mix(in oklab, var(--neon) 45%, transparent)",
                    boxShadow: e.isMe
                      ? "0 0 24px -4px rgba(184,255,0,0.5)"
                      : undefined,
                  }}
                >
                  <div
                    className="display text-lg tabular-nums w-8 text-right"
                    style={{ color: e.isMe ? "var(--volt)" : "var(--lavender)" }}
                  >
                    {e.rank}
                  </div>
                  <Avatar config={cfg} size={40} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold truncate"
                      style={{ color: e.isMe ? "var(--ink)" : "var(--lavender)" }}
                    >
                      {e.isMe ? `${e.firstName} (you)` : e.firstName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="display text-xl tabular-nums"
                      style={{ color: e.isMe ? "var(--ink)" : "var(--volt)" }}
                    >
                      {e.questionsCorrect}
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        color: e.isMe
                          ? "color-mix(in oklab, var(--ink) 70%, transparent)"
                          : "rgba(246,240,250,0.6)",
                      }}
                    >
                      correct
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate({ to: "/home" as any })}
            className="btn-volt mt-6 w-full py-4 text-base rounded-2xl"
          >
            Go Home
          </button>
        </div>
      </div>
    </FreeShell>
  );
}
