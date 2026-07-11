import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({ meta: [{ title: "Reset password — TestPhi" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl p-8" style={{ background: "rgba(74,6,136,0.35)", border: "1px solid rgba(246,240,250,0.12)" }}>
          <h1 className="text-2xl font-extrabold text-foreground text-center">Reset your password</h1>
          {status === "sent" ? (
            <div className="mt-6 rounded-lg p-4 text-center" style={{ background: "rgba(184,255,0,0.12)" }}>
              <p className="text-sm font-semibold text-foreground">Check your email</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We sent a reset link to <span className="font-mono">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--volt)]"
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-xs" style={{ color: "#ff4d6d" }}>{error}</p>}
              <button type="submit" disabled={status === "sending"} className="btn-volt w-full disabled:opacity-60">
                {status === "sending" ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
          <p className="mt-5 text-xs text-center text-muted-foreground">
            <Link to={"/auth" as any} className="font-bold" style={{ color: "var(--volt)" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
