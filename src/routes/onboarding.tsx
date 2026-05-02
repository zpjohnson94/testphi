import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SKILLS } from "@/lib/content";
import { completeOnboarding, useHydration } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { Avatar, ANIMALS, COLOR_SWATCHES, defaultAvatar, type AvatarConfig, type AnimalId } from "@/components/Avatar";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — SAT Quest" }] }),
  component: Onboarding,
});

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
  const [step, setStep] = useState<"intro" | "avatar" | "name" | "goal" | "diag">("intro");
  const [avatar, setAvatar] = useState<AvatarConfig>(defaultAvatar());
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(20);
  const [diagIdx, setDiagIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const finish = (results: boolean[]) => {
    const rwCorrect = results.slice(0, 3).filter(Boolean).length;
    const mathCorrect = results.slice(3, 6).filter(Boolean).length;
    const baseRW = 850 + rwCorrect * 100;
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
    <div className="topo-bg topo-violet min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {step === "intro" && (
          <Card>
            <div className="flex justify-center"><Avatar config={defaultAvatar()} size={120} animate /></div>
            <h1 className="mt-4 display text-4xl text-center" style={{ color: "var(--ink)" }}>Welcome to <span style={{ color: "var(--neon)" }}>SAT Quest</span></h1>
            <p className="mt-2 text-center text-sm" style={{ color: "#5a4a72" }}>A 60-second diagnostic and you're in. We'll set your starting rating.</p>
            <button onClick={() => setStep("avatar")} className="btn-volt w-full mt-6 py-4 text-base">Let's go →</button>
          </Card>
        )}

        {step === "avatar" && (
          <Card>
            <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>Pick your fighter</h2>
            <div className="mt-3 flex justify-center"><Avatar config={avatar} size={140} animate /></div>

            <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Animal</div>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {ANIMALS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setAvatar({ ...avatar, animal: a.id as AnimalId }); sfx.tap(); }}
                  className="aspect-square rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: avatar.animal === a.id ? "var(--violet-deep)" : "rgba(74, 6, 136, 0.08)",
                    border: avatar.animal === a.id ? "2px solid var(--neon)" : "2px solid transparent",
                  }}
                >
                  <Avatar config={{ ...avatar, animal: a.id as AnimalId, accessory: "none" }} size={36} />
                </button>
              ))}
            </div>

            <div className="mt-5 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Color</div>
            <div className="mt-2 grid grid-cols-10 gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setAvatar({ ...avatar, color: c }); sfx.tap(); }}
                  className="aspect-square rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: avatar.color === c ? "3px solid var(--ink)" : "2px solid rgba(0,0,0,0.15)",
                    boxShadow: avatar.color === c ? "0 0 0 2px var(--neon)" : "none",
                  }}
                />
              ))}
            </div>

            <button onClick={() => setStep("name")} className="btn-volt w-full mt-6 py-4">Continue →</button>
          </Card>
        )}

        {step === "name" && (
          <Card>
            <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>What's your name?</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-semibold text-[var(--ink)] focus:outline-none focus:ring-2"
              style={{ border: "2px solid #d6cce0" }}
            />
            <button onClick={() => setStep("goal")} className="btn-volt w-full mt-6 py-4">Continue →</button>
          </Card>
        )}

        {step === "goal" && (
          <Card>
            <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>Daily XP goal</h2>
            <p className="mt-1 text-sm" style={{ color: "#5a4a72" }}>You can change this anytime.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[10, 20, 50].map((g) => (
                <button
                  key={g}
                  onClick={() => { setGoal(g); sfx.tap(); }}
                  className="rounded-2xl py-4 transition-transform hover:scale-105"
                  style={{
                    background: goal === g ? "var(--violet-deep)" : "white",
                    color: goal === g ? "var(--volt)" : "var(--ink)",
                    border: goal === g ? "2px solid var(--neon)" : "2px solid #e6dcef",
                  }}
                >
                  <div className="display text-3xl">{g}</div>
                  <div className="text-[11px] font-bold opacity-80">{g === 10 ? "Casual" : g === 20 ? "Steady" : "Beast"}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("diag")} className="btn-volt w-full mt-6 py-4 flex items-center justify-center gap-2">
              <Sparkles className="size-5" /> Start diagnostic
            </button>
          </Card>
        )}

        {step === "diag" && (
          <Card>
            <div className="flex items-center justify-between text-xs font-bold" style={{ color: "#5a4a72" }}>
              <span>Question {diagIdx + 1} / {DIAG.length}</span>
              <span className="uppercase tracking-widest">{DIAG[diagIdx].section === "rw" ? "Reading & Writing" : "Math"}</span>
            </div>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "#e6dcef" }}>
              <div className="h-full transition-all" style={{ width: `${(diagIdx / DIAG.length) * 100}%`, background: "var(--volt)" }} />
            </div>
            <h2 className="mt-5 display text-xl" style={{ color: "var(--ink)" }}>{DIAG[diagIdx].q}</h2>
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
                  className="w-full rounded-2xl bg-white px-4 py-3 text-left font-semibold transition-all hover:-translate-y-0.5"
                  style={{ color: "var(--ink)", border: "2px solid #e6dcef" }}
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
    <div className="rounded-3xl p-6 animate-pop" style={{ background: "var(--lavender)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)" }}>
      {children}
    </div>
  );
}
