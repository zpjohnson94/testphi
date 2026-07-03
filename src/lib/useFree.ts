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
