import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "Coming Soon — TestPhi" },
      { name: "description", content: "TestPhi is launching soon. Join the waitlist to be first in line." },
      { property: "og:title", content: "Coming Soon — TestPhi" },
      { property: "og:description", content: "TestPhi is launching soon. Join the waitlist to be first in line." },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      const list = JSON.parse(localStorage.getItem("waitlist") || "[]");
      list.push({ email, ts: Date.now() });
      localStorage.setItem("waitlist", JSON.stringify(list));
    } catch {}
    setSubmitted(true);
  }

  return (
    <div className="topo-bg min-h-screen flex flex-col">
      <header className="px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="display text-base text-[var(--lavender)]">TestPhi</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 pb-20">
        <div className="w-full max-w-lg text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
            You're early
          </div>
          <h1 className="mt-3 display text-4xl sm:text-5xl text-[var(--lavender)]">
            TestPhi is coming soon
          </h1>
          <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
            We're putting the finishing touches on adaptive practice that targets your weak spots.
            Drop your email and we'll let you know the moment it's ready.
          </p>

          {submitted ? (
            <div
              className="mt-8 rounded-2xl p-6"
              style={{
                background: "var(--violet-deep)",
                border: "2px solid var(--volt)",
                boxShadow: "0 0 60px -10px rgba(184,255,0,0.5)",
              }}
            >
              <div className="display text-2xl text-[var(--lavender)]">You're on the list ⚡</div>
              <p className="mt-2 text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
                Thanks! We'll email <span style={{ color: "var(--volt)" }}>{email}</span> as soon as
                we launch.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 px-5 py-3.5 rounded-2xl text-base font-medium outline-none"
                style={{
                  background: "rgba(246,240,250,0.06)",
                  border: "1.5px solid rgba(246,240,250,0.18)",
                  color: "var(--lavender)",
                }}
              />
              <button type="submit" className="btn-volt px-6 py-3.5 text-base rounded-2xl">
                Notify me →
              </button>
            </form>
          )}

          <Link
            to="/"
            className="inline-block mt-8 text-sm font-bold"
            style={{ color: "rgba(246,240,250,0.6)" }}
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
