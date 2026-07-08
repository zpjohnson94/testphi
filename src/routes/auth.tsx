import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — TestPhi" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // If already signed in, or session hydrates from magic link fragment, jump onward.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data?.session) {
        navigate({ to: sanitizeRedirect(redirect) as any, replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        navigate({ to: sanitizeRedirect(redirect) as any, replace: true });
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth${redirect ? `?redirect=${encodeURIComponent(sanitizeRedirect(redirect))}` : ""}`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo, shouldCreateUser: true },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  async function handleDemoSignIn() {
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/public/ensure-demo-user", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.reason || "Failed to provision demo account");
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@testphi.app",
        password: "demo-testphi-2026",
      });
      if (error) throw error;
      // onAuthStateChange in the effect above handles the redirect.
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
    }
  }



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(74,6,136,0.35)", border: "1px solid rgba(246,240,250,0.12)" }}
        >
          <h1 className="text-2xl font-extrabold text-foreground text-center">Sign in</h1>
          <p className="mt-2 text-sm text-center text-muted-foreground">
            We'll email you a magic link. No password needed.
          </p>

          {status === "sent" ? (
            <div className="mt-6 rounded-lg p-4 text-center" style={{ background: "rgba(184,255,0,0.12)" }}>
              <p className="text-sm font-semibold text-foreground">Check your email</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We sent a magic link to <span className="font-mono">{email}</span>. Open it on this device to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--volt)]"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="text-xs" style={{ color: "#ff4d6d" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-volt w-full disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}

          {status !== "sent" && (
            <>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
              </div>
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={status === "sending"}
                className="mt-4 w-full rounded-lg border border-[rgba(246,240,250,0.2)] bg-transparent px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[rgba(246,240,250,0.06)] disabled:opacity-60"
              >
                Preview as demo user
              </button>
              <p className="mt-2 text-[10px] text-center text-muted-foreground">
                Instant access to a shared demo account — no email needed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function sanitizeRedirect(value: string | undefined): string {
  if (!value) return "/home";
  // Only allow same-origin relative paths.
  if (!value.startsWith("/") || value.startsWith("//")) return "/home";
  return value;
}
