// Read-only queries backing the domain detail view (/domains/$domainId).
// No scoring, mastery, or momentum logic lives here.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { domainById } from "./freeUser";
import { buildReviewMap, type DomainReviewItem } from "./domainReview.server";

export type { DomainReviewItem };


export interface DomainActivityRow {
  id: string;
  correct: boolean;
  difficulty: number;
  answeredAt: string;
  questionId: string;
  /** Hydrated review payload (absent when the question can't be resolved). */
  review?: DomainReviewItem;
}

export interface DomainActivityResponse {
  rows: DomainActivityRow[];
  totalAnswered: number;
  missedCount: number;
}

export const getDomainActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ domainId: z.string() }).parse(raw))
  .handler(async ({ data, context }): Promise<DomainActivityResponse> => {
    const [recent, totals, missed] = await Promise.all([
      context.supabase
        .from("answers")
        .select("id, correct, difficulty, answered_at, question_id")
        .eq("user_id", context.userId)
        .eq("domain_id", data.domainId)
        .order("answered_at", { ascending: false })
        .limit(15),
      context.supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("domain_id", data.domainId),
      context.supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("domain_id", data.domainId)
        .eq("correct", false),
    ]);

    const rawRows = recent.data ?? [];
    const ids = Array.from(new Set(rawRows.map((r: any) => r.question_id).filter(Boolean)));
    const domainLabel = domainById(data.domainId)?.label ?? "";

    let reviewById = new Map<string, DomainReviewItem>();
    if (ids.length) {
      const [{ data: questions }, { data: attempts }] = await Promise.all([
        context.supabase.from("questions").select("id, payload").in("id", ids),
        context.supabase
          .from("daily_attempts")
          .select("question_id, shuffled_order, correct_position, selected_position")
          .eq("user_id", context.userId)
          .in("question_id", ids),
      ]);
      reviewById = buildReviewMap(ids, questions, attempts, domainLabel);
    }

    return {
      rows: rawRows.map((r: any) => ({
        id: r.id,
        correct: !!r.correct,
        difficulty: Number(r.difficulty),
        answeredAt: r.answered_at,
        questionId: r.question_id,
        review: reviewById.get(r.question_id),
      })),
      totalAnswered: totals.count ?? 0,
      missedCount: missed.count ?? 0,
    };
  });


/**
 * Missed questions for one domain, hydrated from the question bank with the
 * user's own shuffled order + selection when a daily attempt exists.
 */
export const getDomainMissedReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ domainId: z.string() }).parse(raw))
  .handler(async ({ data, context }): Promise<DomainReviewItem[]> => {
    const domainLabel = domainById(data.domainId)?.label ?? "";

    const { data: wrong } = await context.supabase
      .from("answers")
      .select("question_id, answered_at")
      .eq("user_id", context.userId)
      .eq("domain_id", data.domainId)
      .eq("correct", false)
      .order("answered_at", { ascending: false })
      .limit(20);

    const ids = Array.from(new Set((wrong ?? []).map((r: any) => r.question_id)));
    if (!ids.length) return [];

    const [{ data: questions }, { data: attempts }] = await Promise.all([
      context.supabase.from("questions").select("id, payload").in("id", ids),
      context.supabase
        .from("daily_attempts")
        .select("question_id, shuffled_order, correct_position, selected_position")
        .eq("user_id", context.userId)
        .in("question_id", ids),
    ]);

    const map = buildReviewMap(ids, questions, attempts, domainLabel);
    return ids.map((id) => map.get(id)).filter(Boolean) as DomainReviewItem[];
  });


    return out;
  });
