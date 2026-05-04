import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [notify, setNotify] = useState(true);

  function toggle(v: boolean) {
    setNotify(v);
    try {
      const list = JSON.parse(localStorage.getItem("waitlist") || "[]");
      list.push({ notify: v, ts: Date.now() });
      localStorage.setItem("waitlist", JSON.stringify(list));
    } catch {}
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

          <div
            className="mt-8 rounded-2xl p-5 flex items-center gap-3 text-left"
            style={{
              background: "var(--violet-deep)",
              border: "2px solid var(--volt)",
              boxShadow: notify ? "0 0 60px -10px rgba(184,255,0,0.5)" : "none",
            }}
          >
            <Checkbox
              id="notify"
              checked={notify}
              onCheckedChange={(v) => toggle(Boolean(v))}
              className="h-5 w-5"
            />
            <label htmlFor="notify" className="flex-1 cursor-pointer">
              <div className="text-base font-bold text-[var(--lavender)]">
                Notify me when it's here ⚡
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(246,240,250,0.7)" }}>
                We'll email you the moment TestPhi launches — plus a special gift for being an early believer 🎁
              </p>
            </label>
          </div>
          {notify && (
            <p className="mt-3 text-xs font-bold" style={{ color: "var(--volt)" }}>
              You're on the list
            </p>
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
