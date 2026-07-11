import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — TestPhi" }] }),
  component: AuthPage,
});

function sanitizeRedirect(value: string | undefined): string {
  if (!value) return "/home";
  if (!value.startsWith("/") || value.startsWith("//")) return "/home";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setSubmitting(false);
      setError(error.message);
      return;
    }
    // onAuthStateChange handles the navigation.
  }

  async function handleGoogle() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        setSubmitting(false);
        setError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  async function handleDemoSignIn() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/ensure-demo-user", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.reason || "Failed to provision demo account");
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@testphi.app",
        password: "demo-testphi-2026",
      });
      if (error) throw error;
    } catch (err) {
      setSubmitting(false);
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
            Welcome back — sign in to continue.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-6 w-full rounded-lg px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#fff", color: "#1f1f1f" }}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
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
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <Link to={"/auth/forgot" as any} className="text-[11px] font-bold" style={{ color: "var(--volt)" }}>
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--volt)]"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-xs" style={{ color: "#ff4d6d" }}>{error}</p>}
            <button type="submit" disabled={submitting} className="btn-volt w-full disabled:opacity-60">
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-muted-foreground">
            No account yet?{" "}
            <Link to={"/signup" as any} className="font-bold" style={{ color: "var(--volt)" }}>
              Create one
            </Link>
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={submitting}
            className="mt-4 w-full rounded-lg border border-[rgba(246,240,250,0.2)] bg-transparent px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[rgba(246,240,250,0.06)] disabled:opacity-60"
          >
            Preview as demo user
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
