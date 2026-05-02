import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { breakdownFor, loadDiag, scoreFor, TOTAL_QUESTIONS } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/diagnostic/results")({
  head: () => ({ meta: [{ title: "Your predicted SAT score — TestPhi" }] }),
  component: DiagResults,
});

function DiagResults() {
  const navigate = useNavigate();
  const [diag, setDiag] = useState(() => loadDiag());
  const [animatedScore, setAnimatedScore] = useState(800);
  const [unlocked] = useState(false); // MVP: always locked until user signs up

  useEffect(() => {
    const s = loadDiag();
    setDiag(s);
    if (s.answers.length < TOTAL_QUESTIONS) {
      const nextN = Math.min(TOTAL_QUESTIONS, s.answers.length + 1);
      navigate({ to: "/diagnostic/question/$n" as any, params: { n: String(nextN) } as any });
    }
  }, [navigate]);

  const score = useMemo(() => scoreFor(diag), [diag]);
  const breakdown = useMemo(() => breakdownFor(diag), [diag]);

  // Animate count-up from 800 to final
  useEffect(() => {
    if (!score.total) return;
    const target = score.total;
    const start = 800;
    const duration = 2000;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score.total]);

  return (
    <div className="topo-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-3xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </Link>
          {diag.name && (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full flex items-center justify-center text-lg"
                style={{ background: diag.color }}>{diag.emoji}</div>
              <span className="text-sm font-bold text-[var(--lavender)]">{diag.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Above the fold — score */}
      <section className="relative z-10 mx-auto max-w-2xl px-5 pt-12 pb-12 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
          Your predicted SAT score
        </div>
        <div className="mt-4 flex items-end justify-center gap-2">
          <div className="score-num text-[88px] sm:text-[110px] leading-none" style={{ color: "var(--volt)" }}>
            {animatedScore}
          </div>
          <div className="score-num text-2xl mb-3" style={{ color: "rgba(184,255,0,0.6)" }}>/1600</div>
        </div>
        <div className="mt-3 inline-block score-pill text-sm">{score.percentile}</div>

        <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
          <Sub label="Math" value={score.mathScaled} accent="var(--neon)" />
          <Sub label="Reading & Writing" value={score.rwScaled} accent="var(--volt)" />
        </div>

        <div className="mt-10 text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(246,240,250,0.55)" }}>
          See your breakdown ↓
        </div>
      </section>

      {/* Below the fold — breakdown (blurred + locked) */}
      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24">
        <div className="relative rounded-3xl p-6 sm:p-8" style={{ background: "rgba(246,240,250,0.04)", border: "1px solid rgba(246,240,250,0.08)" }}>
          <Group label="Needs Work" color="#ff4d6d" items={breakdown.needsWork.length ? breakdown.needsWork : ["Geometry: Area & Angles", "Punctuation"]} locked={!unlocked} />
          <Group label="Developing" color="var(--spark)" items={breakdown.developing.length ? breakdown.developing : ["Quadratic Equations", "Words in Context", "Data Interpretation"]} locked={!unlocked} />
          <Group label="Strong" color="var(--volt)" items={breakdown.strong.length ? breakdown.strong : ["Linear Equations", "Main Idea"]} locked={!unlocked} />

          {!unlocked && (
            <div className="mt-8 flex flex-col items-center justify-center text-center px-2">
              <div className="size-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,230,0,0.18)", border: "2px solid var(--spark)" }}>
                <Lock className="size-6" style={{ color: "var(--spark)" }} />
              </div>
              <h2 className="mt-4 display text-2xl sm:text-3xl text-[var(--lavender)]">Unlock your full breakdown</h2>
              <p className="mt-2 max-w-sm text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
                Sign up free to see exactly which skills to work on and get a personalized plan to boost your score.
              </p>
              <Link
                to={"/signup" as any}
                className="btn-volt mt-6 px-8 py-4 text-base rounded-2xl"
                style={{ boxShadow: "0 8px 0 0 #6e9c00, 0 0 50px -8px rgba(184,255,0,0.55)" }}
              >
                Sign up free to unlock →
              </Link>
              <p className="mt-3 text-xs font-medium" style={{ color: "rgba(246,240,250,0.5)" }}>
                Free forever · No credit card needed
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Sub({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${accent}` }}>
      <div className="score-num text-3xl text-[var(--lavender)]">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>{label}</div>
    </div>
  );
}

function Group({ label, color, items }: { label: string; color: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color }}>{label}</div>
      <div className="mt-2 grid gap-2">
        {items.map((it) => (
          <div key={it} className="rounded-xl px-4 py-3 text-sm font-bold text-[var(--lavender)]"
            style={{ background: "rgba(246,240,250,0.05)", border: `1px solid ${color}` }}>
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}
