import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Share2 } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";

type BattleResultSearch = {
  rank?: number | string;
  result?: "win" | "loss" | "tie" | "";
  correct?: number;
  wrong?: number;
  wins?: number;
  alert?: string;
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
  }),
  component: BattleResults,
});

function BattleResults() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/battle/results" });
  const { result, correct = 0, wrong = 0, wins = 0, rank, alert } = search;
  const rankNum = typeof rank === "number" && !isNaN(rank) ? rank : null;
  const showAlert = alert === "1" && rankNum !== null;
  const [dismissed, setDismissed] = useState(false);

  const headline =
    result === "win" ? "You won!" : result === "loss" ? "So close." : result === "tie" ? "It's a tie." : "Battle complete";
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

          <div
            className="rounded-3xl p-6 backdrop-blur-md"
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: "2px solid var(--neon)",
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                  Correct
                </div>
                <div className="display text-4xl text-[var(--volt)] tabular-nums">{correct}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                  Wrong
                </div>
                <div className="display text-4xl text-[var(--destructive)] tabular-nums">{wrong}</div>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl p-5 backdrop-blur-md flex items-center justify-between"
            style={{
              background: "color-mix(in oklab, var(--violet-deep) 45%, transparent)",
              border: "2px solid var(--neon)",
            }}
          >
            <div className="flex items-center gap-3">
              <Trophy className="size-6" style={{ color: "var(--spark)" }} />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                  Total wins
                </div>
                <div className="display text-2xl text-[var(--lavender)] tabular-nums">{wins}</div>
              </div>
            </div>
            {rankNum !== null && (
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)]/70">
                  Today's rank
                </div>
                <div className="display text-2xl text-[var(--volt)] tabular-nums">#{rankNum}</div>
              </div>
            )}
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
