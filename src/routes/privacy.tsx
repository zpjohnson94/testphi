import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TestPhi" },
      {
        name: "description",
        content: "How TestPhi collects, uses, and protects your information.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="topo-bg topo-dim min-h-screen">
      <header className="px-5 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <Logo size={32} />
          <span className="display text-base text-[var(--lavender)]">TestPhi</span>
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-8 pb-20 text-[var(--lavender)]">
        <h1 className="display text-3xl sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-xs" style={{ color: "rgba(246,240,250,0.55)" }}>
          Effective: May 6, 2026
        </p>

        <div
          className="mt-8 space-y-6 text-sm leading-relaxed"
          style={{ color: "rgba(246,240,250,0.85)" }}
        >
          <p>
            TestPhi ("we", "us") is an early-stage SAT prep product. This page explains, in plain
            language, what we collect from you and what we do with it.
          </p>

          <section>
            <h2 className="display text-lg text-[var(--lavender)]">What we collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Your email address and first name when you sign up.</li>
              <li>
                Which plan you indicated interest in (Free or Power Up) and billing preference.
              </li>
              <li>Whether you opted in to be notified when we launch.</li>
              <li>
                Your diagnostic results (target score, predicted score, weak skills) so we can
                personalize follow-ups.
              </li>
              <li>
                Basic technical information your browser sends with any web request (referrer, user
                agent, IP address).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg text-[var(--lavender)]">Why we collect it</h2>
            <p className="mt-2">
              Right now, TestPhi is in pre-launch. We use the information above for two reasons:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>To email you when the product is ready (only if you opted in).</li>
              <li>To understand which features people want most, so we can prioritize them.</li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg text-[var(--lavender)]">Who we share it with</h2>
            <p className="mt-2">
              Nobody. We do not sell your data and we do not share it with advertisers. Your
              information is stored on our backend infrastructure and is only accessible to the
              TestPhi team. We use Google Analytics to understand aggregate usage of the site.
            </p>
          </section>

          <section>
            <h2 className="display text-lg text-[var(--lavender)]">How long we keep it</h2>
            <p className="mt-2">
              We keep your information until you ask us to delete it, or until TestPhi is shut down
              — whichever comes first.
            </p>
          </section>

          <section>
            <h2 className="display text-lg text-[var(--lavender)]">Changes</h2>
            <p className="mt-2">
              If we change this policy in a meaningful way, we'll update the effective date at the
              top and, if you opted in to launch emails, let you know by email.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link to="/" className="text-sm font-bold" style={{ color: "rgba(246,240,250,0.6)" }}>
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
