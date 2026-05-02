import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, Calculator, Trophy, Zap, Brain } from "lucide-react";
import { Avatar, defaultAvatar } from "@/components/Avatar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZenTest — Adaptive SAT prep that feels like a game" },
      { name: "description", content: "Level up to your target SAT score with bite-sized lessons, an ELO rating like chess, and adaptive practice that hunts your weak spots." },
      { property: "og:title", content: "ZenTest — Adaptive SAT prep that feels like a game" },
      { property: "og:description", content: "Bite-sized lessons. An ELO rating like chess. An adaptive map that targets your weak spots." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="topo-bg min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="size-9 rounded-xl flex items-center justify-center display" style={{ background: "var(--volt)", color: "var(--ink)" }}>
              SQ
            </span>
            <span className="display text-lg text-[var(--lavender)]">ZenTest</span>
          </Link>
          <Link to={"/onboarding" as any} className="btn-volt px-4 py-2 text-sm">Start free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(184,255,0,0.12)", color: "var(--volt)", border: "1px solid var(--volt)" }}>
          <Sparkles className="size-3.5" />
          Adaptive prep · No subscription to try
        </div>
        <h1 className="mt-6 display text-5xl sm:text-7xl text-[var(--lavender)]">
          Crush the SAT.<br />
          <span style={{ color: "var(--volt)" }}>Have fun doing it.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-lg font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
          Bite-sized lessons. A rating that tells you exactly what you'd score today.
          A map that adapts to your weak spots — like Duolingo had a baby with chess.com.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link to={"/onboarding" as any} className="btn-volt px-7 py-4 text-base">Take the diagnostic →</Link>
          <Link to={"/dashboard" as any} className="rounded-2xl px-6 py-4 text-base font-bold" style={{ background: "rgba(246,240,250,0.06)", color: "var(--lavender)", border: "1px solid rgba(246,240,250,0.15)" }}>
            Skip & explore
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
      <section className="mx-auto max-w-6xl px-5 pb-24">
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
