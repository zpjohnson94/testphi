import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SKILLS } from "@/lib/content";
import { completeOnboarding, useHydration, useStore } from "@/lib/store";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — SAT Quest" }] }),
  component: Onboarding,
});

const AVATARS = ["🦊", "🐼", "🦉", "🐯", "🐸", "🦄", "🐙", "🐲"];

// 6 quick diagnostic questions: 3 R&W + 3 Math
const DIAG = [
  { id: "d1", section: "rw" as const, skillId: "subj-verb", q: "The team of scientists ____ working late.", choices: ["are", "is", "were", "be"], correctIndex: 1 },
  { id: "d2", section: "rw" as const, skillId: "punctuation", q: "Pick the correct version:", choices: [
    "I left early, I missed the bus.",
    "I left early; I missed the bus.",
    "I left early I missed the bus.",
    "I left; early I missed the bus.",
  ], correctIndex: 1 },
  { id: "d3", section: "rw" as const, skillId: "vocab-context", q: "Her ____ tone calmed the room — even, measured, kind.", choices: ["frantic", "serene", "stern", "snide"], correctIndex: 1 },
  { id: "d4", section: "math" as const, skillId: "linear-eq", q: "If 2x + 4 = 14, x = ?", choices: ["3", "5", "7", "10"], correctIndex: 1 },
  { id: "d5", section: "math" as const, skillId: "ratios", q: "20% of 150 = ?", choices: ["20", "25", "30", "35"], correctIndex: 2 },
  { id: "d6", section: "math" as const, skillId: "quadratics", q: "Solutions of x² − 9 = 0?", choices: ["3", "−3", "3 and −3", "9"], correctIndex: 2 },
];

function Onboarding() {
  useHydration();
  const navigate = useNavigate();
  const onboarded = useStore((s) => s.hasOnboarded);
  const [step, setStep] = useState<"intro" | "name" | "goal" | "diag" | "done">("intro");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [goal, setGoal] = useState(20);
  const [diagIdx, setDiagIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  if (onboarded && step === "intro") {
    // already onboarded — let them re-run if they want
  }

  const finish = (results: boolean[]) => {
    const rwCorrect = results.slice(0, 3).filter(Boolean).length;
    const mathCorrect = results.slice(3, 6).filter(Boolean).length;
    const baseRW = 850 + rwCorrect * 100;   // 850, 950, 1050, 1150
    const baseMath = 850 + mathCorrect * 100;
    const mastery: Record<string, number> = {};
    for (const s of SKILLS) mastery[s.id] = 35;
    DIAG.forEach((d, i) => { mastery[d.skillId] = (mastery[d.skillId] ?? 35) + (results[i] ? 25 : -10); });
    for (const k of Object.keys(mastery)) mastery[k] = Math.max(0, Math.min(100, mastery[k]));
    completeOnboarding({ name: name || "Player", avatar, dailyGoalXp: goal, rwElo: baseRW, mathElo: baseMath, mastery });
    sfx.levelUp();
    navigate({ to: "/dashboard" as any });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {step === "intro" && (
          <Card>
            <div className="text-5xl text-center">🚀</div>
            <h1 className="mt-4 text-3xl font-extrabold text-center">Welcome to SAT Quest</h1>
            <p className="mt-2 text-center text-muted-foreground">A 60-second diagnostic and you're in. We'll set your starting rating.</p>
            <PrimaryButton onClick={() => setStep("name")} className="mt-6">Let's go</PrimaryButton>
          </Card>
        )}

        {step === "name" && (
          <Card>
            <h2 className="text-2xl font-extrabold">Pick your name & avatar</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAvatar(a); sfx.tap(); }}
                  className="aspect-square rounded-2xl border-2 text-3xl transition-all hover:scale-110"
                  style={{ borderColor: avatar === a ? "var(--primary)" : "var(--border)", background: avatar === a ? "var(--secondary)" : "var(--card)" }}
                >
                  {a}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={() => setStep("goal")} className="mt-6">Continue</PrimaryButton>
          </Card>
        )}

        {step === "goal" && (
          <Card>
            <h2 className="text-2xl font-extrabold">Daily XP goal</h2>
            <p className="mt-1 text-sm text-muted-foreground">You can change this any time.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[10, 20, 50].map((g) => (
                <button
                  key={g}
                  onClick={() => { setGoal(g); sfx.tap(); }}
                  className="rounded-2xl border-2 py-4 font-extrabold transition-transform hover:scale-105"
                  style={{ borderColor: goal === g ? "var(--primary)" : "var(--border)", background: goal === g ? "var(--secondary)" : "var(--card)" }}
                >
                  <div className="text-2xl">{g}</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">{g === 10 ? "Casual" : g === 20 ? "Steady" : "Beast"}</div>
                </button>
              ))}
            </div>
            <PrimaryButton onClick={() => setStep("diag")} className="mt-6">Start diagnostic</PrimaryButton>
          </Card>
        )}

        {step === "diag" && (
          <Card>
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Question {diagIdx + 1} / {DIAG.length}</span>
              <span className="uppercase">{DIAG[diagIdx].section === "rw" ? "Reading & Writing" : "Math"}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${(diagIdx / DIAG.length) * 100}%`, background: "var(--gradient-primary)" }} />
            </div>
            <h2 className="mt-5 text-xl font-extrabold">{DIAG[diagIdx].q}</h2>
            <div className="mt-4 space-y-2">
              {DIAG[diagIdx].choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const correct = i === DIAG[diagIdx].correctIndex;
                    correct ? sfx.correct() : sfx.wrong();
                    const next = [...answers, correct];
                    setAnswers(next);
                    if (diagIdx + 1 >= DIAG.length) finish(next);
                    else setDiagIdx(diagIdx + 1);
                  }}
                  className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-left font-semibold transition-all hover:border-primary hover:-translate-y-0.5"
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 animate-pop" style={{ boxShadow: "var(--shadow-soft)" }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl py-3.5 font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0 ${className}`}
      style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
    >
      {children}
    </button>
  );
}
