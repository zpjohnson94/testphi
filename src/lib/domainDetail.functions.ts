// Read-only queries backing the domain detail view (/domains/$domainId).
// No scoring, mastery, or momentum logic lives here.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { domainById } from "./freeUser";

export interface DomainActivityRow {
  id: string;
  correct: boolean;
  difficulty: number;
  answeredAt: string;
  questionId: string;
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

    return {
      rows: (recent.data ?? []).map((r: any) => ({
        id: r.id,
        correct: !!r.correct,
        difficulty: Number(r.difficulty),
        answeredAt: r.answered_at,
        questionId: r.question_id,
      })),
      totalAnswered: totals.count ?? 0,
      missedCount: missed.count ?? 0,
    };
  });

export interface DomainReviewItem {
  questionId: string;
  domainLabel: string;
  passage?: string;
  question: string;
  choices: string[];
  correctPosition: number;
  selectedPosition: number;
}

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
      context.supabase
        .from("questions")
        .select("id, payload")
        .in("id", ids),
      context.supabase
        .from("daily_attempts")
        .select("question_id, shuffled_order, correct_position, selected_position")
        .eq("user_id", context.userId)
        .in("question_id", ids),
    ]);

    const attemptByQ = new Map<string, any>();
    for (const a of attempts ?? []) attemptByQ.set(a.question_id, a);

    const LETTERS = ["A", "B", "C", "D"];
    const out: DomainReviewItem[] = [];

    for (const id of ids) {
      const row = (questions ?? []).find((q: any) => q.id === id);
      if (!row) continue;
      const p: any = row.payload ?? {};

      // Dual payload shape: { question, choices: {A..D}, correct } or
      // { prompt, choices: [..4], correctIndex }.
      let prompt: string;
      let base: string[] = [];
      let correctIndex = -1;
      if (typeof p.question === "string" && p.choices && !Array.isArray(p.choices)) {
        prompt = p.question;
        const c = p.choices as Record<string, string>;
        base = [c.A, c.B, c.C, c.D].filter((x) => typeof x === "string");
        correctIndex = LETTERS.indexOf(String(p.correct ?? "").toUpperCase());
      } else {
        prompt = String(p.prompt ?? "");
        base = Array.isArray(p.choices) ? p.choices.map(String) : [];
        correctIndex = Number(p.correctIndex);
      }
      if (base.length !== 4 || correctIndex < 0) continue;

      const attempt = attemptByQ.get(id);
      if (attempt?.shuffled_order?.length === 4) {
        const order: string[] = attempt.shuffled_order;
        out.push({
          questionId: id,
          domainLabel,
          passage: typeof p.passage === "string" ? p.passage : undefined,
          question: prompt,
          choices: order.map((l) => base[LETTERS.indexOf(l)]),
          correctPosition: attempt.correct_position ?? order.indexOf(LETTERS[correctIndex]),
          selectedPosition: attempt.selected_position ?? -1,
        });
      } else {
        out.push({
          questionId: id,
          domainLabel,
          passage: typeof p.passage === "string" ? p.passage : undefined,
          question: prompt,
          choices: base,
          correctPosition: correctIndex,
          selectedPosition: -1,
        });
      }
    }

    return out;
  });
