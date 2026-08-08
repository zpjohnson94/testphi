import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, X, Lightbulb, Sparkles, Trophy, Zap } from "lucide-react";
import {
  getNode,
  getAllQuestionsForBoss,
  WORLDS,
  getSkill,
  type Question,
  type Section,
} from "@/lib/content";
import { finishLesson, recordAttempt, useHydration, useStore, unlockAccessory } from "@/lib/store";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/lesson/$nodeId")({
  head: () => ({ meta: [{ title: "Lesson — TestPhi" }] }),
  component: LessonPage,
});

function LessonPage() {
  useHydration();
  const { nodeId } = Route.useParams();
  const ctx = useMemo(() => resolveContext(nodeId), [nodeId]);

  if (!ctx) {
    return (
      <div className="topo-bg min-h-screen flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="display text-3xl text-[var(--lavender)]">Lesson not found</h1>
          <Link to={"/home" as any} className="btn-volt inline-block mt-4 px-5 py-3">
            Back home
          </Link>
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

  const accent = ctx.section === "rw" ? "var(--volt)" : "var(--neon)";
  const q = ctx.questions[qIdx];

  const onPick = (i: number) => {
    if (picked !== null) return;
    const correct = i === q.correctIndex;
    setPicked(i);
    recordAttempt({ section: ctx.section, skillId: q.skillId, difficulty: q.difficulty, correct });
    if (correct) sfx.correct();
    else {
      sfx.wrong();
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
    setAnswers((a) => [...a, correct]);
  };

  const onNext = () => {
    setPicked(null);
    if (qIdx + 1 < ctx.questions.length) setQIdx(qIdx + 1);
    else {
      const correctCount = answers.filter(Boolean).length;
      const xp =
        correctCount * (ctx.isBoss ? 10 : 5) + (correctCount === ctx.questions.length ? 5 : 0);
      finishLesson({ nodeId: ctx.nodeId, correctCount, xp });
      if (correctCount === ctx.questions.length) {
        sfx.levelUp();
      }
      setPhase("results");
    }
  };

  if (phase === "lesson") {
    return (
      <div className="topo-bg topo-dim min-h-screen flex flex-col">
        <TopBar
          accent={accent}
          title={ctx.worldName}
          subtitle={ctx.title}
          onBack={() => navigate({ to: "/home" as any })}
          progress={0}
        />
        <div className="flex-1 mx-auto w-full max-w-md p-5 animate-fade-up">
          <div
            className="rounded-3xl p-6"
            style={{ background: "var(--lavender)", color: "var(--ink)" }}
          >
            <div
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--neon)" }}
            >
              Lesson
            </div>
            <h1 className="mt-2 display text-3xl">{ctx.title}</h1>
            <p className="mt-4 text-base leading-relaxed font-medium">{ctx.intro}</p>

            <div
              className="mt-5 rounded-2xl p-4"
              style={{
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.25)",
              }}
            >
              <div
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--violet-deep)" }}
              >
                <Sparkles className="size-3.5" /> Example
              </div>
              <p className="mt-2 text-sm leading-relaxed font-medium">
                {renderEmphasis(ctx.example || "")}
              </p>
            </div>

            <div
              className="mt-4 rounded-2xl p-4 flex gap-3"
              style={{
                background: "rgba(184,255,0,0.18)",
                border: "1px solid rgba(184,255,0,0.4)",
              }}
            >
              <Lightbulb className="size-5 shrink-0" style={{ color: "var(--violet-deep)" }} />
              <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                {ctx.tip}
              </p>
            </div>
          </div>
        </div>
        <div
          className="sticky bottom-0 p-4"
          style={{ background: "rgba(29,41,0,0.95)", borderTop: "1px solid rgba(246,240,250,0.1)" }}
        >
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setPhase("questions")}
              className="btn-volt w-full py-4 text-base"
            >
              Start practice ({ctx.questions.length} questions) →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    const progress = ((qIdx + (picked !== null ? 1 : 0)) / ctx.questions.length) * 100;
    return (
      <div className="topo-bg topo-dim min-h-screen flex flex-col">
        <TopBar
          accent={accent}
          title={ctx.title}
          subtitle={`Question ${qIdx + 1} of ${ctx.questions.length}`}
          onBack={() => navigate({ to: "/home" as any })}
          progress={progress}
        />
        <div
          className={`flex-1 mx-auto w-full max-w-md p-5 ${shake ? "animate-shake" : "animate-fade-up"}`}
        >
          <div
            className="rounded-3xl p-6"
            style={{ background: "var(--lavender)", color: "var(--ink)" }}
          >
            {q.passage && (
              <div
                className="rounded-2xl p-4 text-sm italic mb-4"
                style={{ background: "rgba(74,6,136,0.05)", color: "#5a4a72" }}
              >
                {q.passage}
              </div>
            )}
            <h2 className="display text-xl leading-snug">{q.prompt}</h2>
            <div className="mt-5 space-y-3">
              {q.choices.map((c, i) => {
                const isPicked = picked === i;
                const isCorrect = i === q.correctIndex;
                const reveal = picked !== null;
                let style: React.CSSProperties = {
                  border: "2px solid #e6dcef",
                  background: "white",
                };
                if (reveal && isCorrect)
                  style = { border: "2px solid var(--volt)", background: "rgba(184,255,0,0.18)" };
                else if (reveal && isPicked && !isCorrect)
                  style = {
                    border: "2px solid var(--destructive)",
                    background: "rgba(255,77,109,0.12)",
                  };

                return (
                  <button
                    key={i}
                    disabled={reveal}
                    onClick={() => onPick(i)}
                    className="w-full rounded-2xl px-4 py-3.5 text-left font-semibold transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-default flex items-center gap-3"
                    style={style}
                  >
                    <span
                      className="size-7 rounded-lg flex items-center justify-center display text-xs shrink-0"
                      style={{ background: "var(--violet-deep)", color: "var(--lavender)" }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{c}</span>
                    {reveal && isCorrect && (
                      <Check className="size-5" style={{ color: "var(--violet-deep)" }} />
                    )}
                    {reveal && isPicked && !isCorrect && (
                      <X className="size-5" style={{ color: "var(--destructive)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {picked !== null && (
          <div
            className="sticky bottom-0 p-4 animate-fade-up"
            style={{
              background: "rgba(29,41,0,0.95)",
              borderTop: "1px solid rgba(246,240,250,0.1)",
            }}
          >
            <div className="mx-auto max-w-md">
              <div
                className="rounded-2xl p-4 mb-3 text-sm font-semibold"
                style={{
                  background:
                    picked === q.correctIndex ? "rgba(184,255,0,0.15)" : "rgba(255,77,109,0.12)",
                  borderLeft: `4px solid ${picked === q.correctIndex ? "var(--volt)" : "var(--destructive)"}`,
                  color: "var(--lavender)",
                }}
              >
                <div
                  className="text-xs uppercase font-bold tracking-widest mb-1"
                  style={{
                    color: picked === q.correctIndex ? "var(--volt)" : "var(--destructive)",
                  }}
                >
                  {picked === q.correctIndex ? "Nice!" : "Not quite"}
                </div>
                {q.explanation}
              </div>
              <button
                onClick={onNext}
                className={
                  picked === q.correctIndex ? "btn-volt w-full py-4" : "btn-violet w-full py-4"
                }
              >
                {qIdx + 1 < ctx.questions.length ? "Continue →" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const correctCount = answers.filter(Boolean).length;
  const total = ctx.questions.length;
  const perfect = correctCount === total;
  const xpEarned = correctCount * (ctx.isBoss ? 10 : 5) + (perfect ? 5 : 0);
  return (
    <ResultsScreen
      correctCount={correctCount}
      total={total}
      xpEarned={xpEarned}
      perfect={perfect}
      section={ctx.section}
      eloBefore={eloBefore}
      skillName={ctx.skillName}
      onContinue={() => navigate({ to: "/home" as any })}
    />
  );
}

function ResultsScreen({
  correctCount,
  total,
  xpEarned,
  perfect,
  section,
  eloBefore,
  skillName,
  onContinue,
}: {
  correctCount: number;
  total: number;
  xpEarned: number;
  perfect: boolean;
  section: Section;
  eloBefore: number;
  skillName?: string;
  onContinue: () => void;
}) {
  const eloAfter = useStore((s) => (section === "rw" ? s.rwElo : s.mathElo));
  const eloDelta = eloAfter - eloBefore;
  return (
    <div className="topo-bg topo-violet min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md text-center animate-pop">
        <div
          className="display text-7xl mb-3"
          style={{ color: perfect ? "var(--spark)" : "var(--volt)" }}
        >
          {perfect ? "PERFECT" : correctCount >= 2 ? "NICE" : "KEEP GOING"}
        </div>
        <p className="text-base font-bold" style={{ color: "rgba(246,240,250,0.7)" }}>
          {correctCount} of {total} correct
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ResultStat
            label="XP earned"
            value={`+${xpEarned}`}
            icon={<Zap className="size-4" />}
            accent="var(--volt)"
          />
          <ResultStat
            label="ELO"
            value={`${eloDelta >= 0 ? "+" : ""}${eloDelta}`}
            icon={<Trophy className="size-4" />}
            accent={eloDelta >= 0 ? "var(--volt)" : "var(--destructive)"}
          />
        </div>

        {skillName && (
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "rgba(246,240,250,0.06)",
              border: "1px solid rgba(246,240,250,0.15)",
            }}
          >
            <div
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--neon)" }}
            >
              Skill
            </div>
            <div className="mt-1 display text-lg text-[var(--lavender)]">{skillName}</div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="btn-volt mt-8 w-full py-4 flex items-center justify-center gap-2"
        >
          <Trophy className="size-5" /> Back to map
        </button>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "rgba(246,240,250,0.06)", border: `1px solid ${accent}` }}
    >
      <div
        className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 justify-center"
        style={{ color: accent }}
      >
        {icon} {label}
      </div>
      <div className="mt-1 score-num text-4xl" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function TopBar({
  accent,
  title,
  subtitle,
  onBack,
  progress,
}: {
  accent: string;
  title: string;
  subtitle: string;
  onBack: () => void;
  progress: number;
}) {
  return (
    <header
      className="backdrop-blur"
      style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.1)" }}
    >
      <div className="mx-auto max-w-md flex items-center gap-3 px-5 py-3">
        <button
          onClick={onBack}
          className="size-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(246,240,250,0.06)", color: "var(--lavender)" }}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] uppercase font-bold tracking-widest truncate"
            style={{ color: accent }}
          >
            {title}
          </div>
          <div className="display text-sm truncate text-[var(--lavender)]">{subtitle}</div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: "rgba(246,240,250,0.1)" }}>
        <div
          className="h-full transition-all"
          style={{ width: `${progress}%`, background: accent }}
        />
      </div>
    </header>
  );
}

function renderEmphasis(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("*") && p.endsWith("*"))
      return (
        <strong key={i} style={{ color: "var(--violet-deep)" }}>
          {p.slice(1, -1)}
        </strong>
      );
    return <span key={i}>{p}</span>;
  });
}
