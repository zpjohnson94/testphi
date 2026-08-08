import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { loadDiag } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { trackEvent } from "@/lib/analytics";
import { submitSignup } from "@/lib/signups.functions";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your free account — TestPhi" },
      { name: "description", content: "Unlock your results and start improving your score." },
    ],
  }),
  component: Signup,
});

const signupSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function Signup() {
  const navigate = useNavigate();
  const submitSignupFn = useServerFn(submitSignup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadDiag();
    if (s.name) setName(s.name);
  }, []);

  const captureMarketing = (cleanEmail: string) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("signup_email", cleanEmail);
      }
      const diag = (() => {
        try {
          return loadDiag();
        } catch {
          return null;
        }
      })();
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      void submitSignupFn({
        data: {
          email: cleanEmail,
          name: name.trim() || null,
          diagnostic_score: diag,
          referrer: referrer || null,
        },
      }).catch((err) => console.warn("signup capture failed", err));
    } catch (err) {
      console.warn("signup capture failed", err);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    trackEvent("signup_submit", { method: "email" });

    const cleanEmail = parsed.data.email;
    captureMarketing(cleanEmail);

    const emailRedirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback?new=1` : undefined;

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name ?? "" },
        emailRedirectTo,
      },
    });

    if (signUpErr) {
      setSubmitting(false);
      setError(signUpErr.message);
      return;
    }

    // Auto-confirm on → session immediately. Otherwise show "check email".
    if (data.session) {
      navigate({ to: "/plans" as any });
    } else {
      setSubmitting(false);
      setError(null);
      // Fallback: session not present — likely email confirmation required.
      alert("Check your email to confirm your account, then sign in.");
      navigate({ to: "/auth" as any });
    }
  };

  const signUpWithGoogle = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    trackEvent("signup_submit", { method: "google" });
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("post_signup_pending", "1");
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        setSubmitting(false);
        setError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/plans" as any });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="topo-bg topo-dim min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo size={36} />
            <span className="display text-lg text-[var(--lavender)]">TestPhi</span>
          </Link>
        </div>

        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{
            background: "rgba(246,240,250,0.05)",
            border: "1px solid rgba(246,240,250,0.1)",
          }}
        >
          <h1 className="display text-2xl text-[var(--lavender)] text-center">
            Create your free account
          </h1>
          <p className="mt-2 text-sm text-center" style={{ color: "rgba(246,240,250,0.7)" }}>
            Unlock your results and start improving your score.
          </p>

          <button
            type="button"
            onClick={signUpWithGoogle}
            disabled={submitting}
            className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#fff", color: "#1f1f1f" }}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(246,240,250,0.5)" }}
            >
              or
            </span>
            <div className="h-px flex-1 bg-[rgba(246,240,250,0.15)]" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field label="Name" value={name} onChange={setName} placeholder="Your first name" />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
            />
            {error && (
              <p className="text-xs font-semibold" style={{ color: "#ff4d6d" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-volt w-full mt-4 py-3.5 text-base rounded-2xl disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create account →"}
            </button>
          </form>

          <p className="mt-5 text-xs text-center" style={{ color: "rgba(246,240,250,0.6)" }}>
            Already have an account?{" "}
            <Link to={"/auth" as any} className="font-bold" style={{ color: "var(--volt)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: "rgba(246,240,250,0.6)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-2xl px-4 py-3 bg-transparent text-[var(--lavender)] placeholder:text-[rgba(246,240,250,0.35)] font-semibold outline-none"
        style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(246,240,250,0.12)" }}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
