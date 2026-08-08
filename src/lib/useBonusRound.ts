import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  serveBonusRound,
  submitBonusRound,
  type BonusServedRound,
  type BonusSubmitResult,
} from "./bonusRound.functions";
import { freeStateKey } from "./useFree";

export function useServeBonusRound(domainId: string | null) {
  const fn = useServerFn(serveBonusRound);
  return useQuery<BonusServedRound>({
    queryKey: ["bonus-round", domainId],
    queryFn: () => fn({ data: { domainId: domainId! } }),
    enabled: !!domainId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

export interface BonusSubmitAnswer {
  step: 1 | 2 | 3;
  questionId: string;
  selectedPosition: number;
  shuffleSeed: string;
  elapsedMs: number;
}

export function useSubmitBonusRound() {
  const fn = useServerFn(submitBonusRound);
  const qc = useQueryClient();
  return useMutation<BonusSubmitResult, Error, { domainId: string; answers: BonusSubmitAnswer[] }>({
    mutationFn: (payload) => fn({ data: payload }),
    onSuccess: ({ state }) => {
      qc.setQueryData(freeStateKey, state);
    },
  });
}
