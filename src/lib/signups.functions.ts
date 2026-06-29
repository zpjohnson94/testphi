import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const emailSchema = z.string().trim().toLowerCase().email().max(255);

const submitSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(100).optional().nullable(),
  diagnostic_score: z.any().optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export const submitSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const user_agent = getRequestHeader("user-agent") ?? null;
    let ip_address: string | null = null;
    try {
      ip_address = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip_address = null;
    }

    const { error } = await supabaseAdmin.from("signups").upsert(
      {
        email: data.email,
        name: data.name ?? null,
        diagnostic_score: data.diagnostic_score ?? null,
        referrer: data.referrer ?? null,
        user_agent,
        ip_address,
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("submitSignup error", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

const updateSchema = z.object({
  email: emailSchema,
  plan: z.enum(["free", "power_up"]).optional(),
  billing: z.enum(["monthly", "annual"]).optional(),
  notify_opt_in: z.boolean().optional(),
});

export const updateSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }) => {
    const patch: {
      email: string;
      plan?: string;
      billing?: string;
      notify_opt_in?: boolean;
    } = { email: data.email };
    if (data.plan !== undefined) patch.plan = data.plan;
    if (data.billing !== undefined) patch.billing = data.billing;
    if (data.notify_opt_in !== undefined) patch.notify_opt_in = data.notify_opt_in;

    // Upsert so direct landings on /plans or /coming-soon (no prior /signup) still capture data.
    const { error } = await supabaseAdmin
      .from("signups")
      .upsert(patch, { onConflict: "email" });

    if (error) {
      console.error("updateSignup error", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
