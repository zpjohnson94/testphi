import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, Calculator, Trophy, Zap, Brain } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAT Quest — Adaptive SAT prep that feels like a game" },
      { name: "description", content: "Level up to your target SAT score with bite-sized lessons, ELO ratings, and adaptive practice that targets your weak spots." },
      { property: "og:title", content: "SAT Quest — Adaptive SAT prep that feels like a game" },
      { property: "og:description", content: "Bite-sized lessons, an ELO rating like chess, and an adaptive map that targets your weak spots." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="size-8 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="size-4" />
            </span>
            SAT Quest
          </Link>
          <Link
            to={"/onboarding" as any}
            className="rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="size-3.5" style={{ color: "var(--primary)" }} />
          Adaptive prep · No subscription to try
        </div>
        <h1 className="mt-6 text-5xl sm:text-7xl font-extrabold tracking-tight">
          Crush the SAT.{" "}
          <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Have fun doing it.
          </span>
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-lg text-muted-foreground">
          Bite-sized lessons. A rating that tells you exactly what you'd score today.
          A map that adapts to your weak spots — like Duolingo had a baby with chess.com.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to={"/onboarding" as any}
            className="rounded-2xl px-7 py-4 text-base font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
          >
            Take the diagnostic →
          </Link>
          <Link
            to={"/dashboard" as any}
            className="rounded-2xl border border-border bg-card px-6 py-4 text-base font-bold text-foreground transition-colors hover:bg-muted"
          >
            Skip & explore
          </Link>
        </div>

        {/* Floating preview */}
        <div className="mt-16 mx-auto max-w-md rounded-3xl border border-border bg-card p-5 text-left" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="rounded-2xl p-5 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Projected SAT</div>
            <div className="mt-1 text-5xl font-extrabold">1340</div>
            <div className="mt-2 text-xs opacity-90 font-semibold">Gold tier · +40 this week</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground font-semibold">R&W</div>
              <div className="font-extrabold text-lg">670</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground font-semibold">Math</div>
              <div className="font-extrabold text-lg">670</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Three things make it work</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <Feature Icon={Trophy} title="A real ELO rating" desc="Like chess, your skill is one number — and we map it to a projected 200–800 per section." />
          <Feature Icon={Zap} title="A map you actually want to climb" desc="Worlds, levels, a character that hops between nodes. Every step earns XP." />
          <Feature Icon={Brain} title="Adapts to your weaknesses" desc="Get more reps where you struggle. Bonus review nodes show up automatically." />
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-6xl px-5 pb-24 grid gap-5 sm:grid-cols-2">
        <SectionCard
          title="Reading & Writing"
          tagline="Grammar, evidence, vocab in context."
          gradient="var(--gradient-rw)"
          Icon={BookOpen}
        />
        <SectionCard
          title="Math"
          tagline="Algebra, geometry, stats, advanced."
          gradient="var(--gradient-math)"
          Icon={Calculator}
        />
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built with Lovable · For demo purposes
      </footer>
    </div>
  );
}

function Feature({ Icon, title, desc }: { Icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="size-11 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function SectionCard({ title, tagline, gradient, Icon }: { title: string; tagline: string; gradient: string; Icon: any }) {
  return (
    <div className="rounded-3xl p-7 text-primary-foreground" style={{ background: gradient, boxShadow: "var(--shadow-soft)" }}>
      <Icon className="size-7" />
      <div className="mt-3 text-2xl font-extrabold">{title}</div>
      <div className="mt-1 text-sm opacity-90 font-semibold">{tagline}</div>
    </div>
  );
}
