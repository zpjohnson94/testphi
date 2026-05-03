import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, Calculator, Trophy, Zap, Brain } from "lucide-react";
import { Avatar, defaultAvatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import journeyBg from "@/assets/journey-bg.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TestPhi — Adaptive SAT prep that feels like a game" },
      { name: "description", content: "Level up to your target SAT score with bite-sized lessons, an ELO rating like chess, and adaptive practice that hunts your weak spots." },
      { property: "og:title", content: "TestPhi — Adaptive SAT prep that feels like a game" },
      { property: "og:description", content: "Bite-sized lessons. An ELO rating like chess. An adaptive map that targets your weak spots." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="topo-bg min-h-screen relative overflow-hidden">
      {/* Decorative learning-journey illustration — three islands behind the
          hero. Center island is anchored so it stays visible on mobile when
          the side islands crop off. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-0 w-full max-w-[1800px]"
        style={{
          top: "420px",
          height: "min(720px, 80vh)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 50%, black 35%, transparent 88%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 50%, black 35%, transparent 88%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <img
          src={journeyBg}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.55 }}
        />
      </div>
      {/* Hero contrast scrim — keeps headline & subheader readable over the illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1]"
        style={{
          height: "780px",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(29,41,0,0.85) 0%, rgba(29,41,0,0.55) 45%, transparent 80%)",
        }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)", fontFamily: "var(--font-display)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="display text-lg text-[var(--lavender)]">TestPhi</span>
          </Link>
          <Link to={"/diagnostic" as any} className="btn-volt px-4 py-2 text-sm">Predict my score</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-16 pb-40 sm:pb-56 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(184,255,0,0.12)", color: "var(--volt)", border: "1px solid var(--volt)" }}>
          <Sparkles className="size-3.5" />
          TEST PREP THAT ADAPTS TO YOUR WEAK SPOTS
        </div>
        <h1 className="mt-6 display text-5xl sm:text-7xl text-[var(--lavender)]">
          Crush the SAT.<br />
          <span style={{ color: "var(--volt)" }}>Master your weak spots.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-lg font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
          Bite-sized lessons that adapt to fix your weak spots. Watch your predicted score rise as you practice.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to={"/diagnostic" as any}
            className="btn-volt px-12 py-6 text-xl sm:text-2xl tracking-tight inline-flex items-center gap-2 rounded-2xl"
            style={{
              boxShadow:
                "0 10px 0 0 #6e9c00, 0 0 60px -8px rgba(184,255,0,0.65), 0 0 120px -20px rgba(184,255,0,0.5)",
            }}
          >
            Predict my score
            <span aria-hidden="true" className="text-2xl sm:text-3xl">→</span>
          </Link>
          <Link
            to={"/dashboard" as any}
            className="text-sm font-bold underline-offset-4 hover:underline"
            style={{ color: "rgba(246,240,250,0.7)" }}
          >
            or sign up
          </Link>
        </div>

        {/* Floating preview */}
        <div className="mt-16 mx-auto max-w-md">
          <div className="rounded-3xl p-6" style={{ background: "var(--violet-deep)", border: "1.5px solid var(--neon)" }}>
            <div className="flex items-start justify-between">
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--volt)" }}>Projected SAT</div>
                <div className="score-num text-7xl text-[var(--lavender)] mt-1">1340</div>
                <div className="text-xs font-bold mt-1" style={{ color: "var(--volt)" }}>Top 13% · Gold tier</div>
              </div>
              <div className="size-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(184,255,0,0.15)", border: "2px solid var(--volt)" }}>
                <Avatar config={{ ...defaultAvatar(), accessory: "crown" }} size={70} animate />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--volt)" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--volt)" }}>R&W</div>
                <div className="score-num text-3xl text-[var(--lavender)]">670</div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--neon)" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--neon)" }}>Math</div>
                <div className="score-num text-3xl text-[var(--lavender)]">670</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-16 pb-24">
        <h2 className="display text-3xl sm:text-5xl text-center text-[var(--lavender)]">Three things make it click</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <Feature Icon={Trophy} title="A real ELO rating" desc="Like chess. One number that maps to your projected SAT, with percentile context." accent="var(--volt)" />
          <Feature Icon={Zap} title="A map you want to climb" desc="Worlds, levels, and your blob avatar hopping between nodes. Every step earns XP." accent="var(--neon)" />
          <Feature Icon={Brain} title="Hunts your weaknesses" desc="More reps where you struggle. Bonus review nodes appear automatically." accent="var(--spark)" />
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-6xl px-5 pb-24 grid gap-5 sm:grid-cols-2">
        <SectionCard title="Reading & Writing" tagline="Grammar, evidence, vocab in context." accent="var(--volt)" Icon={BookOpen} />
        <SectionCard title="Math" tagline="Algebra, geometry, stats, advanced." accent="var(--neon)" Icon={Calculator} />
      </section>

      <footer className="py-8 text-center text-xs" style={{ color: "rgba(246,240,250,0.4)", borderTop: "1px solid rgba(246,240,250,0.08)" }}>
        Built with Lovable
      </footer>
    </div>
  );
}

function Feature({ Icon, title, desc, accent }: { Icon: any; title: string; desc: string; accent: string }) {
  return (
    <div className="rounded-3xl p-6 transition-transform hover:-translate-y-1" style={{ background: "rgba(246,240,250,0.04)", border: `1px solid ${accent}` }}>
      <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: accent, color: "var(--ink)" }}>
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 display text-xl text-[var(--lavender)]">{title}</h3>
      <p className="mt-1.5 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>{desc}</p>
    </div>
  );
}

function SectionCard({ title, tagline, accent, Icon }: { title: string; tagline: string; accent: string; Icon: any }) {
  return (
    <div className="rounded-3xl p-7" style={{ background: "rgba(246,240,250,0.04)", border: `1.5px solid ${accent}` }}>
      <Icon className="size-7" style={{ color: accent }} />
      <div className="mt-3 display text-2xl text-[var(--lavender)]">{title}</div>
      <div className="mt-1 text-sm font-bold" style={{ color: "rgba(246,240,250,0.7)" }}>{tagline}</div>
    </div>
  );
}
