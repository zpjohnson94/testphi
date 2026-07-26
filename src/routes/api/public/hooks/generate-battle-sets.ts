// Batch battle-set generator. Lazy generation also runs in
// `getBattleBundle`; this endpoint lets pg_cron pre-fill the day.
import { createFileRoute } from "@tanstack/react-router";
import { DOMAINS } from "@/lib/freeUser";

const BATTLE_QUESTION_COUNT = 60;

export const Route = createFileRoute("/api/public/hooks/generate-battle-sets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const iso = new Date().toISOString().slice(0, 10);
        const { data: existing } = await supabaseAdmin
          .from("battle_sets")
          .select("set_date")
          .eq("set_date", iso)
          .maybeSingle();
        if (existing) return Response.json({ skipped: true, date: iso });

        const perDomain = Math.ceil(BATTLE_QUESTION_COUNT / DOMAINS.length);
        const chosen: string[] = [];
        const seen = new Set<string>();
        for (const d of DOMAINS) {
          const { data } = await supabaseAdmin
            .from("questions")
            .select("id")
            .eq("domain_id", d.id)
            .eq("is_active", true)
            .limit(200);
          const pool = ((data ?? []) as Array<{ id: string }>).map((r) => r.id).filter((id) => !seen.has(id));
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          for (let i = 0; i < Math.min(perDomain, pool.length); i++) {
            chosen.push(pool[i]);
            seen.add(pool[i]);
          }
        }
        for (let i = chosen.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
        }
        const ids = chosen.slice(0, BATTLE_QUESTION_COUNT);
        if (ids.length === 0) return Response.json({ ok: false, reason: "bank_empty" });

        const { error } = await supabaseAdmin
          .from("battle_sets")
          .upsert({ set_date: iso, question_ids: ids }, { onConflict: "set_date" });
        return Response.json({ ok: !error, date: iso, count: ids.length, error: error?.message });
      },
    },
  },
});
