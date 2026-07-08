// Client-side hooks wrapping server functions. Uses TanStack Query.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  applySessionFn,
  getFreeState,
  migrateAnonymousDiagnostic,
  updateProfile,
} from "./free.functions";

import type { FreeState, SessionResult } from "./freeUser";
import type { DiagState } from "./diagnostic";

export const freeStateKey = ["free-state"] as const;

export function useFreeState() {
  const fetchFn = useServerFn(getFreeState);
  return useQuery<FreeState>({
    queryKey: freeStateKey,
    queryFn: () => fetchFn(),
    staleTime: 30_000,
  });
}

export function useApplySession() {
  const fn = useServerFn(applySessionFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (results: SessionResult[]) => fn({ data: { results } }),
    onSuccess: (next) => {
      qc.setQueryData(freeStateKey, next);
    },
  });
}

export function useUpdateProfile() {
  const fn = useServerFn(updateProfile);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; email?: string }) => fn({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: freeStateKey }),
  });
}

export function useMigrateDiagnostic() {
  const fn = useServerFn(migrateAnonymousDiagnostic);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (diag: DiagState) => fn({ data: { diag } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: freeStateKey }),
  });
}

import {
  serveDailyQuestion,
  serveDailySetBatch,
  gradeDailyAnswer,
  finalizeDailySession,
  resetDemoAccount,
  type ServedQuestion,
  type GradeResult,
} from "./dailyAttempt.functions";

export const servedQuestionKey = (slot: number) => ["daily-question", slot] as const;

export function useServeDailyQuestion(slot: number) {
  const fn = useServerFn(serveDailyQuestion);
  return useQuery<ServedQuestion>({
    queryKey: servedQuestionKey(slot),
    queryFn: () => fn({ data: { slot } }),
    staleTime: Infinity, // shuffle is stable per (user, date, slot)
    retry: false,
  });
}

export function usePrefetchDailySet() {
  const fn = useServerFn(serveDailySetBatch);
  const qc = useQueryClient();
  return async () => {
    const all = await fn();
    for (const q of all) {
      qc.setQueryData(servedQuestionKey(q.slot), q);
    }
    return all;
  };
}

export function useGradeDailyAnswer() {
  const fn = useServerFn(gradeDailyAnswer);
  return useMutation({
    mutationFn: (vars: { attemptId: string; selectedPosition: number; elapsedMs: number }) =>
      fn({ data: vars }),
  });
}

export function useFinalizeDailySession() {
  const fn = useServerFn(finalizeDailySession);
  const qc = useQueryClient();
  return useMutation<FreeState>({
    mutationFn: () => fn(),
    onSuccess: (next) => {
      qc.setQueryData(freeStateKey, next);
    },
  });
}

export function useResetDemo() {
  const fn = useServerFn(resetDemoAccount);
  const qc = useQueryClient();
  return useMutation<FreeState>({
    mutationFn: () => fn(),
    onSuccess: (next) => {
      qc.setQueryData(freeStateKey, next);
      qc.removeQueries({ queryKey: ["daily-question"] });
    },
  });
}

