import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { loadDiag, scoreFor, QUESTIONS, TOTAL_QUESTIONS } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { DiagAvatar, AVATAR_IMAGES, type AvatarId } from "@/components/DiagAvatar";

export const Route = createFileRoute("/diagnostic/results")({
  head: () => ({ meta: [{ title: "Your predicted SAT score — TestPhi" }] }),
  component: DiagResults,
});

interface DomainStat {
  domain: string;
  group: "needsWork" | "developing" | "strong";
  missedWeight: number; // sum of correctWeight for missed questions in this domain
}

const COLLEGES: Record<string, { name: string; loc: string; avg: number }[]> = {
  b1000: [
    { name: "Howard University", loc: "Washington, DC", avg: 1090 },
    { name: "University of New Mexico", loc: "Albuquerque, NM", avg: 1080 },
    { name: "Texas State University", loc: "San Marcos, TX", avg: 1060 },
    { name: "University of Montana", loc: "Missoula, MT", avg: 1030 },
    { name: "Appalachian State University", loc: "Boone, NC", avg: 1100 },
  ],
  b1100: [
    { name: "University of Arizona", loc: "Tucson, AZ", avg: 1160 },
    { name: "University of Oregon", loc: "Eugene, OR", avg: 1145 },
    { name: "University of Alabama", loc: "Tuscaloosa, AL", avg: 1180 },
    { name: "Miami University", loc: "Oxford, OH", avg: 1195 },
    { name: "University of Kentucky", loc: "Lexington, KY", avg: 1155 },
  ],
  b1200: [
    { name: "University of Georgia", loc: "Athens, GA", avg: 1295 },
    { name: "Penn State", loc: "University Park, PA", avg: 1255 },
    { name: "University of Wisconsin", loc: "Madison, WI", avg: 1295 },
    { name: "University of Washington", loc: "Seattle, WA", avg: 1260 },
    { name: "Indiana University", loc: "Bloomington, IN", avg: 1230 },
  ],
  b1300: [
    { name: "Boston University", loc: "Boston, MA", avg: 1390 },
    { name: "University of Florida", loc: "Gainesville, FL", avg: 1335 },
    { name: "NYU", loc: "New York, NY", avg: 1370 },
    { name: "UC San Diego", loc: "San Diego, CA", avg: 1360 },
    { name: "Wake Forest", loc: "Winston-Salem, NC", avg: 1345 },
  ],
  b1400: [
    { name: "Georgetown", loc: "Washington, DC", avg: 1450 },
    { name: "UC Berkeley", loc: "Berkeley, CA", avg: 1455 },
    { name: "University of Michigan", loc: "Ann Arbor, MI", avg: 1435 },
    { name: "Carnegie Mellon", loc: "Pittsburgh, PA", avg: 1500 },
    { name: "Vanderbilt", loc: "Nashville, TN", avg: 1490 },
  ],
  b1500: [
    { name: "MIT", loc: "Cambridge, MA", avg: 1570 },
    { name: "Harvard", loc: "Cambridge, MA", avg: 1580 },
    { name: "Princeton", loc: "Princeton, NJ", avg: 1570 },
    { name: "Stanford", loc: "Stanford, CA", avg: 1560 },
    { name: "Duke", loc: "Durham, NC", avg: 1510 },
  ],
};

function bandFor(target: number) {
  if (target >= 1500) return COLLEGES.b1500;
  if (target >= 1400) return COLLEGES.b1400;
  if (target >= 1300) return COLLEGES.b1300;
  if (target >= 1200) return COLLEGES.b1200;
  if (target >= 1100) return COLLEGES.b1100;
  return COLLEGES.b1000;
}

function DiagResults() {
  const navigate = useNavigate();
  const [diag, setDiag] = useState(() => loadDiag());
  const [animatedScore, setAnimatedScore] = useState(800);
  const [unlocked] = useState(false);

  useEffect(() => {
    const s = loadDiag();
    setDiag(s);
    if (s.answers.length < TOTAL_QUESTIONS) {
      const nextN = Math.min(TOTAL_QUESTIONS, s.answers.length + 1);
      navigate({ to: "/diagnostic/question/$n" as any, params: { n: String(nextN) } as any });
    }
  }, [navigate]);

  const score = useMemo(() => scoreFor(diag), [diag]);

  // Per-domain missed weight + grouping
  const domainStats = useMemo<DomainStat[]>(() => {
    const map = new Map<string, { missed: number; total: number; missedWeight: number }>();
    for (const a of diag.answers) {
      const q = QUESTIONS.find((qq) => qq.n === a.n);
      if (!q) continue;
      const cur = map.get(q.domainLabel) ?? { missed: 0, total: 0, missedWeight: 0 };
      cur.total += 1;
      const isMissed = !a.correct || a.elapsedSeconds > q.expectedSeconds;
      if (isMissed) {
        cur.missed += 1;
        cur.missedWeight += q.correctWeight;
      }
      map.set(q.domainLabel, cur);
    }
    const out: DomainStat[] = [];
    for (const [domain, v] of map.entries()) {
      const ratio = v.missed / v.total;
      let group: DomainStat["group"];
      if (v.missed === 0) group = "strong";
      else if (ratio >= 0.99) group = "needsWork";
      else group = "developing";
      out.push({ domain, group, missedWeight: v.missedWeight });
    }
    return out;
  }, [diag]);

  const totalUpside = useMemo(
    () => domainStats.reduce((s, d) => s + d.missedWeight, 0),
    [domainStats],
  );

  const targetScore = useMemo(() => {
    const t = Math.min(1580, Math.round((score.total + totalUpside) / 10) * 10);
    return Math.max(score.total, t);
  }, [score.total, totalUpside]);

  const colleges = useMemo(() => bandFor(targetScore), [targetScore]);

  const needsWork = domainStats.filter((d) => d.group === "needsWork");
  const developing = domainStats.filter((d) => d.group === "developing");
  const strong = domainStats.filter((d) => d.group === "strong");

  // Animate count-up
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
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
      >
        <div className="mx-auto max-w-3xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </Link>
          {diag.name && (
            <div className="flex items-center gap-2">
              <DiagAvatar
                id={(diag.avatarId in AVATAR_IMAGES ? diag.avatarId : "fox") as AvatarId}
                color={diag.color}
                size={32}
                ringWidth={2}
              />
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
          <div className="score-num text-2xl mb-3" style={{ color: "rgba(184,255,0,0.6)" }}>
            /1600
          </div>
        </div>
        <div className="mt-3 inline-block score-pill text-sm">{score.percentile}</div>

        <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
          <Sub label="Math" value={score.mathScaled} accent="var(--neon)" />
          <Sub label="Reading & Writing" value={score.rwScaled} accent="var(--volt)" />
        </div>

        <div
          className="mt-10 text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(246,240,250,0.55)" }}
        >
          See your breakdown ↓
        </div>
      </section>

      {/* Below the fold */}
      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 space-y-6">
        {/* Mechanic 1 — Upside callout */}
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: "rgba(184,255,0,0.06)",
            borderLeft: "4px solid var(--volt)",
            border: "1px solid rgba(184,255,0,0.2)",
            borderLeftWidth: "4px",
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
            Potential score improvement
          </div>
          <div className="mt-2 score-num text-5xl sm:text-6xl" style={{ color: "var(--volt)" }}>
            {totalUpside} <span className="text-2xl sm:text-3xl">points</span>
          </div>
          <div className="mt-2 text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
            We know exactly where they're hiding.
          </div>
        </div>

        {/* Skill cards (blurred) */}
        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{ background: "rgba(246,240,250,0.04)", border: "1px solid rgba(246,240,250,0.08)" }}
        >
          <Group
            label="Weak Spots"
            color="#ff4d6d"
            items={needsWork}
            fallback={["Geometry: Area & Angles", "Punctuation"]}
            fallbackPts={[52, 40]}
            showBadge
            overlay={!unlocked ? <UnlockOverlay totalUpside={totalUpside} /> : undefined}
          />
          <Group label="Developing" color="var(--spark)" items={developing} fallback={["Quadratic Equations", "Words in Context", "Data Interpretation"]} fallbackPts={[26, 22, 26]} showBadge />
          <Group label="Strong" color="var(--volt)" items={strong} fallback={["Linear Equations", "Main Idea"]} fallbackPts={[]} showBadge={false} />
        </div>

        {/* Mechanic 2 — College reach list */}
        <div>
          <h2
            className="display text-[18px] font-bold text-[var(--lavender)] px-1"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            At {targetScore}, you're on target for these schools
          </h2>
          <div className="mt-4 grid gap-3">
            {colleges.map((c, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  background: "rgba(246,240,250,0.05)",
                  border: "1px solid rgba(246,240,250,0.1)",
                  filter: "blur(5px)",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--lavender)] truncate">{c.name}</div>
                  <div className="text-xs" style={{ color: "rgba(246,240,250,0.55)" }}>
                    {c.loc}
                  </div>
                </div>
                <div className="text-sm font-bold whitespace-nowrap" style={{ color: "var(--volt)" }}>
                  Avg SAT: {c.avg}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

function UnlockOverlay({ totalUpside }: { totalUpside: number }) {
  return (
    <div
      className="absolute left-0 right-0 rounded-2xl p-5 sm:p-6 text-center"
      style={{
        top: 120,
        background: "rgba(74,6,136,0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(246,240,250,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        zIndex: 20,
      }}
    >
      <div
        className="size-11 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,230,0,0.18)", border: "2px solid var(--spark)" }}
      >
        <Lock className="size-5" style={{ color: "var(--spark)" }} />
      </div>
      <h3
        className="display text-lg sm:text-xl text-[var(--lavender)] font-bold leading-tight"
        style={{ fontFamily: "'Exo 2', sans-serif" }}
      >
        +{totalUpside} points waiting to be unlocked
      </h3>
      <p className="max-w-xs text-xs sm:text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
        Sign up free to see your weak spots and the colleges that come into range.
      </p>
      <Link
        to={"/signup" as any}
        className="btn-volt mt-1 px-6 py-3 text-sm sm:text-base rounded-2xl w-full sm:w-auto"
        style={{ boxShadow: "0 6px 0 0 #6e9c00, 0 0 40px -8px rgba(184,255,0,0.55)" }}
      >
        Sign up free to unlock →
      </Link>
      <p className="text-[11px] font-medium" style={{ color: "rgba(246,240,250,0.5)" }}>
        Free forever · No credit card needed
      </p>
    </div>
  );
}

function Sub({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${accent}` }}>
      <div className="score-num text-3xl text-[var(--lavender)]">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
        {label}
      </div>
    </div>
  );
}

function Group({
  label,
  color,
  items,
  fallback,
  fallbackPts,
  showBadge,
  overlay,
}: {
  label: string;
  color: string;
  items: DomainStat[];
  fallback: string[];
  fallbackPts: number[];
  showBadge: boolean;
  overlay?: ReactNode;
}) {
  const display =
    items.length > 0
      ? items.map((d) => ({ name: d.domain, pts: d.missedWeight }))
      : fallback.map((name, i) => ({ name, pts: fallbackPts[i] ?? 0 }));

  if (!display.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
        {label}
      </div>
      <div className="relative mt-2 grid gap-2">
        {display.map((it, i) => (
          <div
            key={i}
            className="relative rounded-xl px-4 py-3"
            style={{ background: "rgba(246,240,250,0.05)", border: `1px solid ${color}` }}
          >
            <div
              className="text-sm font-bold text-[var(--lavender)]"
              style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}
            >
              ••••••••••••
            </div>
            {showBadge && it.pts > 0 && (
              <div
                className="absolute top-2 right-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{
                  background: "var(--deep-violet, #1a0b2e)",
                  color: "var(--volt)",
                  border: "1px solid rgba(184,255,0,0.4)",
                }}
              >
                +{it.pts} pts
              </div>
            )}
          </div>
        ))}
        {overlay}
      </div>
    </div>
  );
}
