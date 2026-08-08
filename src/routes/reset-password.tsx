import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Set a new password — TestPhi" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");
    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("saved");
    setTimeout(() => navigate({ to: "/home" as any, replace: true }), 800);
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
          <h1 className="text-2xl font-extrabold text-foreground text-center">
            Set a new password
          </h1>
          {!ready ? (
            <p className="mt-6 text-sm text-center text-muted-foreground">
              Verifying your reset link…
            </p>
          ) : status === "saved" ? (
            <p className="mt-6 text-sm text-center text-foreground font-semibold">
              Password updated. Redirecting…
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--volt)]"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--volt)]"
                  placeholder="Repeat password"
                />
              </div>
              {error && (
                <p className="text-xs" style={{ color: "#ff4d6d" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === "saving"}
                className="btn-volt w-full disabled:opacity-60"
              >
                {status === "saving" ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
