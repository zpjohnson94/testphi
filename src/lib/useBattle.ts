// Client-side hooks for Battle Mode.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getBattleBundle,
  getBattleStatus,
  finalizeBattleRun,
  type BattleBundle,
} from "./battle.functions";

export const battleStatusKey = ["battle-status"] as const;
export const battleBundleKey = ["battle-bundle"] as const;

export function useBattleStatus() {
  const fn = useServerFn(getBattleStatus);
  return useQuery({
    queryKey: battleStatusKey,
    queryFn: () => fn(),
    staleTime: 60_000,
  });
}

export function useBattleBundle(enabled = true) {
  const fn = useServerFn(getBattleBundle);
  return useQuery<BattleBundle>({
    queryKey: battleBundleKey,
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    enabled,
    retry: false,
  });
}

export function usePrefetchBattleBundle() {
  const fn = useServerFn(getBattleBundle);
  const qc = useQueryClient();
  return () =>
    qc.prefetchQuery({ queryKey: battleBundleKey, queryFn: () => fn(), staleTime: 5 * 60_000 });
}

export function useFinalizeBattle() {
  const fn = useServerFn(finalizeBattleRun);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      opponentRunId: string | null;
      questionsCorrect: number;
      questionsWrong: number;
      totalTimeMs: number;
      eventLog: { question_index: number; correct: boolean; elapsed_ms: number }[];
    }) => fn({ data: vars }),
    onSuccess: (result, variables) => {
      // Update both battle caches synchronously before the results screen is
      // shown. This prevents Home from briefly (or indefinitely, while the
      // previous query is still fresh) rendering the pre-battle CTA.
      qc.setQueryData(battleStatusKey, (previous: any) => ({
        ...previous,
        alreadyCompleted: true,
        totalWins: result.totalWins,
        myRun: {
          id: result.runId,
          questions_correct: variables.questionsCorrect,
          questions_wrong: variables.questionsWrong,
          result: result.result,
          daily_rank: result.dailyRank,
          total_time_ms: variables.totalTimeMs,
          opponent_run_id: variables.opponentRunId,
        },
      }));
      qc.setQueryData(battleBundleKey, (previous: BattleBundle | undefined) =>
        previous
          ? { ...previous, alreadyCompleted: true, myRunId: result.runId, totalWins: result.totalWins }
          : previous,
      );
      void qc.invalidateQueries({ queryKey: battleStatusKey });
    },
  });
}
