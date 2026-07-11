import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  new: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Signing you in — TestPhi" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    let done = false;
    const go = (dest: string) => {
      if (done) return;
      done = true;
      navigate({ to: dest as any, replace: true });
    };

    const isNew =
      search.new === "1" ||
      (typeof window !== "undefined" &&
        window.sessionStorage.getItem("post_signup_pending") === "1");
    const dest = isNew ? "/plans" : "/home";

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        try { window.sessionStorage.removeItem("post_signup_pending"); } catch {}
        go(dest);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        try { window.sessionStorage.removeItem("post_signup_pending"); } catch {}
        go(dest);
      }
    });

    // Fallback: if no session after 5s, send to /auth.
    const timeout = window.setTimeout(() => go("/auth"), 5000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, search.new]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Logo />
      <p className="mt-6 text-sm font-semibold text-muted-foreground">Signing you in…</p>
    </div>
  );
}
