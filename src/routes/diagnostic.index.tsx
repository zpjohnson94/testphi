import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Target, Map } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/diagnostic/")({
  head: () => ({
    meta: [
      { title: "Predict your SAT score in 10 minutes — TestPhi" },
      { name: "description", content: "15 adaptive questions. Real-time score prediction. No account needed to start." },
    ],
  }),
  component: DiagnosticStart,
});

function DiagnosticStart() {
  return (
    <div className="topo-bg min-h-screen relative overflow-hidden">
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="display text-lg text-[var(--lavender)]">TestPhi</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-5 pt-16 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(184,255,0,0.12)", color: "var(--volt)", border: "1px solid var(--volt)" }}>
          FREE SCORE PREDICTION
        </div>
        <h1 className="mt-6 display text-5xl sm:text-6xl text-[var(--lavender)]">
          Find out your SAT score in <span style={{ color: "var(--volt)" }}>10 minutes.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-lg font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
          15 adaptive questions. Real-time score prediction. No account needed to start.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-bold"
          style={{ color: "rgba(246,240,250,0.85)" }}>
          {["~10 minutes", "Instant results", "100% free"].map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: "var(--volt)" }} />
              {t}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            to={"/diagnostic/avatar" as any}
            className="btn-volt px-12 py-6 text-xl sm:text-2xl tracking-tight inline-flex items-center gap-2 rounded-2xl"
            style={{ boxShadow: "0 10px 0 0 #6e9c00, 0 0 60px -8px rgba(184,255,0,0.65)" }}
          >
            Let's go <span aria-hidden="true">→</span>
          </Link>
          <p className="text-xs font-medium" style={{ color: "rgba(246,240,250,0.5)" }}>
            No account needed · Takes about 10 minutes
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-24">
        <h2 className="display text-2xl sm:text-3xl text-center text-[var(--lavender)]">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <HowCard Icon={CheckCircle2} title="Answer 15 questions" desc="Covering every SAT domain" />
          <HowCard Icon={Target} title="Get your predicted score" desc="Out of 1600 with percentile" />
          <HowCard Icon={Map} title="See your weak spots" desc="And get a plan to fix them" />
        </div>
      </section>
    </div>
  );
}

function HowCard({ Icon, title, desc }: { Icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-3xl p-6" style={{ background: "rgba(246,240,250,0.04)", border: "1px solid rgba(184,255,0,0.4)" }}>
      <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: "var(--volt)", color: "var(--ink)" }}>
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 display text-lg text-[var(--lavender)]">{title}</h3>
      <p className="mt-1 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>{desc}</p>
    </div>
  );
}
