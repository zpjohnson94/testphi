import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, X, Lightbulb, Sparkles, Trophy } from "lucide-react";
import { getNode, getAllQuestionsForBoss, WORLDS, getSkill, type Question, type Section } from "@/lib/content";
import { finishLesson, recordAttempt, useHydration, useStore } from "@/lib/store";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/lesson/$nodeId")({
  head: () => ({ meta: [{ title: "Lesson — SAT Quest" }] }),
  component: LessonPage,
});

function LessonPage() {
  useHydration();
  const { nodeId } = Route.useParams();
  const navigate = useNavigate();

  // Resolve either a normal node OR a boss checkpoint by id
  const ctx = useMemo(() => resolveContext(nodeId), [nodeId]);

  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="text-center">
          <div className="text-5xl">🤔</div>
          <h1 className="mt-3 text-2xl font-extrabold">Lesson not found</h1>
          <Link to={"/dashboard" as any} className="mt-4 inline-block rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold">Back home</Link>
        </div>
      </div>
    );
  }

  return <LessonRunner ctx={ctx} key={nodeId} />;
}

interface LessonContext {
  isBoss: boolean;
  title: string;
  section: Section;
  worldName: string;
  intro?: string;
  example?: string;
  tip?: string;
  questions: Question[];
  nodeId: string;
  skillName?: string;
}

function resolveContext(nodeId: string): LessonContext | null {
  const found = getNode(nodeId);
  if (found) {
    const skill = getSkill(found.node.skillId);
    return {
      isBoss: false,
      title: found.node.title,
      section: found.world.section,
      worldName: found.world.name,
      intro: found.node.lesson.intro,
      example: found.node.lesson.example,
      tip: found.node.lesson.tip,
      questions: found.node.questions,
      nodeId,
      skillName: skill?.name,
    };
  }
  // boss?
  const world = WORLDS.find((w) => w.bossId === nodeId);
  if (world) {
    return {
      isBoss: true,
      title: world.bossTitle,
      section: world.section,
      worldName: world.name,
      questions: getAllQuestionsForBoss(world),
      nodeId,
    };
  }
  return null;
}

type Phase = "lesson" | "questions" | "results";

function LessonRunner({ ctx }: { ctx: LessonContext }) {
  const navigate = useNavigate();
  const eloBefore = useStore((s) => (ctx.section === "rw" ? s.rwElo : s.mathElo));

  const [phase, setPhase] = useState<Phase>(ctx.isBoss ? "questions" : "lesson");
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [shake, setShake] = useState(false);

  const gradient = ctx.section === "rw" ? "var(--gradient-rw)" : "var(--gradient-math)";
  const q = ctx.questions[qIdx];

  const onPick = (i: number) => {
    if (picked !== null) return;
    const correct = i === q.correctIndex;
    setPicked(i);
    recordAttempt({ section: ctx.section, skillId: q.skillId, difficulty: q.difficulty, correct });
    if (correct) sfx.correct();
    else { sfx.wrong(); setShake(true); setTimeout(() => setShake(false), 400); }
    setAnswers((a) => [...a, correct]);
  };

  const onNext = () => {
    setPicked(null);
    if (qIdx + 1 < ctx.questions.length) setQIdx(qIdx + 1);
    else {
      const correctCount = answers.filter(Boolean).length;
      const xp = correctCount * (ctx.isBoss ? 10 : 5) + (correctCount === ctx.questions.length ? 5 : 0);
      finishLesson({ nodeId: ctx.nodeId, correctCount, xp });
      if (correctCount === ctx.questions.length) sfx.levelUp();
      setPhase("results");
    }
  };

  if (phase === "lesson") {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar gradient={gradient} title={ctx.worldName} subtitle={ctx.title} onBack={() => navigate({ to: ctx.section === "rw" ? "/learn/reading-writing" as any : "/learn/math" as any })} progress={0} />
        <div className="flex-1 mx-auto w-full max-w-md p-5 animate-fade-up">
          <div className="rounded-3xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lesson</div>
            <h1 className="mt-2 text-2xl font-extrabold">{ctx.title}</h1>
            <p className="mt-4 text-base leading-relaxed">{ctx.intro}</p>

            <div className="mt-5 rounded-2xl p-4" style={{ background: "var(--secondary)" }}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-secondary-foreground/80">
                <Sparkles className="size-3.5" /> Example
              </div>
              <p className="mt-2 text-sm leading-relaxed">{renderEmphasis(ctx.example || "")}</p>
            </div>

            <div className="mt-4 rounded-2xl p-4 flex gap-3" style={{ background: "color-mix(in oklab, var(--xp) 15%, var(--card))" }}>
              <Lightbulb className="size-5 shrink-0" style={{ color: "var(--xp)" }} />
              <p className="text-sm font-semibold">{ctx.tip}</p>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setPhase("questions")}
              className="w-full rounded-2xl py-4 font-extrabold text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
            >
              Start practice ({ctx.questions.length} questions)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    const progress = ((qIdx + (picked !== null ? 1 : 0)) / ctx.questions.length) * 100;
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar gradient={gradient} title={ctx.title} subtitle={`Question ${qIdx + 1} of ${ctx.questions.length}`} onBack={() => navigate({ to: ctx.section === "rw" ? "/learn/reading-writing" as any : "/learn/math" as any })} progress={progress} />
        <div className={`flex-1 mx-auto w-full max-w-md p-5 ${shake ? "animate-shake" : "animate-fade-up"}`}>
          {q.passage && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm italic mb-4 text-muted-foreground">
              {q.passage}
            </div>
          )}
          <h2 className="text-xl font-extrabold leading-snug">{q.prompt}</h2>
          <div className="mt-5 space-y-3">
            {q.choices.map((c, i) => {
              const isPicked = picked === i;
              const isCorrect = i === q.correctIndex;
              const reveal = picked !== null;
              let style: React.CSSProperties = {};
              if (reveal && isCorrect) style = { borderColor: "var(--success)", background: "color-mix(in oklab, var(--success) 15%, var(--card))" };
              else if (reveal && isPicked && !isCorrect) style = { borderColor: "var(--destructive)", background: "color-mix(in oklab, var(--destructive) 15%, var(--card))" };

              return (
                <button
                  key={i}
                  disabled={reveal}
                  onClick={() => onPick(i)}
                  className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3.5 text-left font-semibold transition-all hover:-translate-y-0.5 hover:border-primary disabled:hover:translate-y-0 disabled:cursor-default flex items-center gap-3"
                  style={style}
                >
                  <span className="size-7 rounded-lg border-2 border-border flex items-center justify-center text-xs font-extrabold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{c}</span>
                  {reveal && isCorrect && <Check className="size-5" style={{ color: "var(--success)" }} />}
                  {reveal && isPicked && !isCorrect && <X className="size-5" style={{ color: "var(--destructive)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        {picked !== null && (
          <div className="sticky bottom-0 border-t border-border bg-card p-4 animate-fade-up">
            <div className="mx-auto max-w-md">
              <div
                className="rounded-2xl p-4 mb-3 text-sm font-semibold"
                style={{
                  background: picked === q.correctIndex
                    ? "color-mix(in oklab, var(--success) 18%, var(--card))"
                    : "color-mix(in oklab, var(--destructive) 14%, var(--card))",
                  borderLeft: `4px solid ${picked === q.correctIndex ? "var(--success)" : "var(--destructive)"}`,
                }}
              >
                <div className="text-xs uppercase font-bold mb-1 opacity-80">
                  {picked === q.correctIndex ? "Nice!" : "Not quite"}
                </div>
                {q.explanation}
              </div>
              <button
                onClick={onNext}
                className="w-full rounded-2xl py-4 font-extrabold text-primary-foreground"
                style={{ background: picked === q.correctIndex ? "var(--success)" : "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
              >
                {qIdx + 1 < ctx.questions.length ? "Continue →" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Results
  const correctCount = answers.filter(Boolean).length;
  const total = ctx.questions.length;
  const perfect = correctCount === total;
  const xpEarned = correctCount * (ctx.isBoss ? 10 : 5) + (perfect ? 5 : 0);
  return <ResultsScreen
    correctCount={correctCount}
    total={total}
    xpEarned={xpEarned}
    perfect={perfect}
    section={ctx.section}
    eloBefore={eloBefore}
    skillName={ctx.skillName}
    onContinue={() => navigate({ to: ctx.section === "rw" ? "/learn/reading-writing" as any : "/learn/math" as any })}
  />;
}

function ResultsScreen({ correctCount, total, xpEarned, perfect, section, eloBefore, skillName, onContinue }: {
  correctCount: number; total: number; xpEarned: number; perfect: boolean; section: Section; eloBefore: number; skillName?: string; onContinue: () => void;
}) {
  const eloAfter = useStore((s) => (section === "rw" ? s.rwElo : s.mathElo));
  const eloDelta = eloAfter - eloBefore;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md text-center animate-pop">
        <div className="text-7xl mb-4">{perfect ? "🏆" : correctCount >= 2 ? "🎉" : "💪"}</div>
        <h1 className="text-3xl font-extrabold">{perfect ? "Perfect!" : correctCount >= 2 ? "Nice work!" : "Keep going!"}</h1>
        <p className="mt-2 text-muted-foreground font-semibold">{correctCount} of {total} correct</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ResultStat label="XP earned" value={`+${xpEarned}`} color="var(--xp)" />
          <ResultStat label="ELO change" value={`${eloDelta >= 0 ? "+" : ""}${eloDelta}`} color={eloDelta >= 0 ? "var(--success)" : "var(--destructive)"} />
        </div>

        {skillName && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase text-muted-foreground">Skill</div>
            <div className="mt-1 font-extrabold">{skillName}</div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="mt-8 w-full rounded-2xl py-4 font-extrabold text-primary-foreground flex items-center justify-center gap-2"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pop)" }}
        >
          <Trophy className="size-5" /> Back to map
        </button>
      </div>
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function TopBar({ gradient, title, subtitle, onBack, progress }: { gradient: string; title: string; subtitle: string; onBack: () => void; progress: number }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-md flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest truncate">{title}</div>
          <div className="text-sm font-extrabold truncate">{subtitle}</div>
        </div>
      </div>
      <div className="h-1.5 bg-secondary">
        <div className="h-full transition-all" style={{ width: `${progress}%`, background: gradient }} />
      </div>
    </header>
  );
}

function renderEmphasis(text: string) {
  // *word* -> bold
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("*") && p.endsWith("*")) return <strong key={i} style={{ color: "var(--primary)" }}>{p.slice(1, -1)}</strong>;
    return <span key={i}>{p}</span>;
  });
}
