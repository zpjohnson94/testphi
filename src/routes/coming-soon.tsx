import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Checkbox } from "@/components/ui/checkbox";
import { trackEvent } from "@/lib/analytics";
import { updateSignup } from "@/lib/signups.functions";

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
  const updateSignupFn = useServerFn(updateSignup);

  useEffect(() => {
    try {
      const email =
        typeof window !== "undefined" ? window.localStorage.getItem("signup_email") : null;
      if (email) {
        void updateSignupFn({ data: { email, notify_opt_in: true } }).catch(() => {});
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(v: boolean) {
    setNotify(v);
    trackEvent("waitlist_opt_in", { notify: v });
    try {
      const email =
        typeof window !== "undefined" ? window.localStorage.getItem("signup_email") : null;
      if (email) {
        void updateSignupFn({ data: { email, notify_opt_in: v } }).catch((err) =>
          console.error("waitlist capture failed", err),
        );
      }
    } catch (err) {
      console.error("waitlist capture failed", err);
    }
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
            You're on the waitlist
          </div>
          <h1 className="mt-3 display text-4xl sm:text-5xl text-[var(--lavender)]">
            Power Up isn't available yet
          </h1>
          <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
            Power Up is still in development — it isn't purchasable today, and nothing has been
            charged. We're building adaptive drills that target your weak spots, and you'll be
            emailed as soon as it launches. In the meantime, keep using TestPhi for free.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-left">
            <Checkbox
              id="notify"
              checked={notify}
              onCheckedChange={(v) => toggle(Boolean(v))}
              className="h-3.5 w-3.5"
            />
            <label
              htmlFor="notify"
              className="cursor-pointer text-xs font-medium"
              style={{ color: "rgba(246,240,250,0.55)" }}
            >
              Notify me when it's here — plus a special gift for being an early believer 🎁
            </label>
          </div>

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
