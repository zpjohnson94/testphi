// Batch daily-set generator. Called by pg_cron (or manually) to pre-fill
// `daily_sets` for the next N days using the shared rule set in
// `dailySet.functions.ts`. Public endpoint — authenticated with the
// Supabase anon key via `apikey` header (matches the standard cron pattern).
//
// Uses `supabaseAdmin` (service role) so it can write to daily_sets even
// though only service_role has INSERT privileges on that table.
import { createFileRoute } from "@tanstack/react-router";
import { generateForDate } from "@/lib/dailySet.functions";

const DAYS_AHEAD = 30;

export const Route = createFileRoute("/api/public/hooks/generate-daily-sets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const dates: string[] = [];
        for (let i = 0; i < DAYS_AHEAD; i++) {
          const d = new Date(today.getTime() + i * 86400000);
          dates.push(d.toISOString().slice(0, 10));
        }

        // Skip dates already present.
        const { data: existing } = await supabaseAdmin
          .from("daily_sets")
          .select("set_date")
          .in("set_date", dates);
        const have = new Set((existing ?? []).map((r: any) => r.set_date as string));
        const missing = dates.filter((d) => !have.has(d));

        const results: Array<{ date: string; ok: boolean; reason?: string }> = [];
        for (const iso of missing) {
          const set = await generateForDate(supabaseAdmin, iso);
          if (set.length !== 5) {
            results.push({ date: iso, ok: false, reason: "bank_too_small" });
            continue;
          }
          const { error } = await supabaseAdmin
            .from("daily_sets")
            .upsert(
              { set_date: iso, question_ids: set.map((q) => q.questionId) },
              { onConflict: "set_date" },
            );
          results.push({ date: iso, ok: !error, reason: error?.message });
        }

        return Response.json({
          generated: results.filter((r) => r.ok).length,
          skipped: dates.length - missing.length,
          failed: results.filter((r) => !r.ok),
        });
      },
    },
  },
});
