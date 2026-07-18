import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reportQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        questionId: z.string().min(1),
        slot: z.number().int().min(1).max(5).optional(),
        reason: z.string().optional(),
        details: z.string().max(2000).optional(),
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("question_reports")
      .insert({
        user_id: context.userId,
        question_id: data.questionId,
        slot: data.slot ?? null,
        reason: data.reason ?? null,
        details: data.details ?? null,
      } as any);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });
