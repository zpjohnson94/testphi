import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { loadDiag } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { trackEvent } from "@/lib/analytics";
import { submitSignup } from "@/server/signups.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your free account — TestPhi" },
      { name: "description", content: "Unlock your results and start improving your score." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const submitSignupFn = useServerFn(submitSignup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = loadDiag();
    if (s.name) setName(s.name);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    trackEvent("signup_submit", { method: "email" });

    const cleanEmail = email.trim().toLowerCase();
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("signup_email", cleanEmail);
      }
      const diag = (() => {
        try { return loadDiag(); } catch { return null; }
      })();
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      await submitSignupFn({
        data: {
          email: cleanEmail,
          name: name.trim() || null,
          diagnostic_score: diag,
          referrer: referrer || null,
        },
      });
    } catch (err) {
      console.error("signup capture failed", err);
    }
    navigate({ to: "/plans" as any });
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

        <div className="rounded-3xl p-6 sm:p-8" style={{ background: "rgba(246,240,250,0.05)", border: "1px solid rgba(246,240,250,0.1)" }}>
          <h1 className="display text-2xl text-[var(--lavender)] text-center">Create your free account</h1>
          <p className="mt-2 text-sm text-center" style={{ color: "rgba(246,240,250,0.7)" }}>
            Unlock your results and start improving your score.
          </p>



          <form onSubmit={submit} className="space-y-3">
            <Field label="Name" value={name} onChange={setName} placeholder="Your first name" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            <button type="submit" disabled={submitting} className="btn-volt w-full mt-4 py-3.5 text-base rounded-2xl disabled:opacity-60">
              {submitting ? "Creating…" : "Create account →"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(246,240,250,0.6)" }}>{label}</label>
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
