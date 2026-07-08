// Idempotently provisions a demo account used by the "Preview as demo user"
// button on /auth. Safe to call from anywhere — creates the user once with a
// confirmed email so password sign-in works immediately.
import { createFileRoute } from "@tanstack/react-router";

export const DEMO_EMAIL = "demo@testphi.app";
export const DEMO_PASSWORD = "demo-testphi-2026";

export const Route = createFileRoute("/api/public/ensure-demo-user")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Check if the user already exists (list is paginated; demo is early).
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) {
          return Response.json({ ok: false, reason: listErr.message }, { status: 500 });
        }
        const existing = list.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
        if (existing) {
          return Response.json({ ok: true, created: false, email: DEMO_EMAIL });
        }

        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { name: "Demo Student", is_demo: true },
        });
        if (createErr) {
          return Response.json({ ok: false, reason: createErr.message }, { status: 500 });
        }
        return Response.json({ ok: true, created: true, email: DEMO_EMAIL });
      },
    },
  },
});
