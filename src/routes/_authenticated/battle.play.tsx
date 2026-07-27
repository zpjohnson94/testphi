import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, defaultAvatar, ANIMALS, COLOR_SWATCHES, type AvatarConfig } from "@/components/Avatar";
import { useBattleBundle, useFinalizeBattle } from "@/lib/useBattle";
import { useStore } from "@/lib/store";
import { useFreeState } from "@/lib/useFree";
import { sfx } from "@/lib/sfx";
import type { BattleEvent } from "@/lib/battle.functions";

const BATTLE_TIME_MS = 120_000;
const MAX_WRONG = 3;

export const Route = createFileRoute("/_authenticated/battle/play")({
  head: () => ({ meta: [{ title: "Battle — TestPhi" }] }),
  component: BattlePlay,
});

function opponentAvatar(animalSeed: number, colorSeed: number): AvatarConfig {
  const animal = ANIMALS[animalSeed % ANIMALS.length]?.id ?? "bear";
  const color = COLOR_SWATCHES[colorSeed % COLOR_SWATCHES.length] ?? "#A855F7";
  return { animal, color, accessory: "none" };
}

function BattlePlay() {
  const navigate = useNavigate();
  const { data: bundle } = useBattleBundle();
  const { data: freeState } = useFreeState();
  const finalize = useFinalizeBattle();
  const myAvatar = useStore((s) => s.avatar) ?? defaultAvatar();
  const myName = (freeState?.name || "You").split(" ")[0];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [finished, setFinished] = useState(false);

  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const [bolts, setBolts] = useState<
    Array<{ id: number; sx: number; sy: number; ex: number; ey: number; angle: number; delay: number; rot: number }>
  >([]);
  const boltSeq = useRef(0);

  const fireBolts = (choiceIdx: number) => {
    const btn = choiceRefs.current[choiceIdx];
    const target = scoreRef.current;
    if (!btn || !target) return;
    const b = btn.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sx = b.left + b.width / 2;
    const sy = b.top + b.height / 2;
    const ex = t.left + t.width / 2;
    const ey = t.top + t.height / 2;
    const count = 14;
    const newBolts = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      return {
        id: ++boltSeq.current,
        sx,
        sy,
        ex,
        ey,
        angle,
        delay: Math.random() * 60,
        rot: Math.random() * 360,
      };
    });
    setBolts((prev) => [...prev, ...newBolts]);
    window.setTimeout(() => {
      setBolts((prev) => prev.filter((x) => !newBolts.find((nb) => nb.id === x.id)));
    }, 900);
  };

  // Opponent live progress derived from ghost event_log against elapsedMs.
  const oppProgress = useMemo(() => {
    if (!bundle?.opponent) return { qIndex: 0, wrong: 0 };
    const log = bundle.opponent.eventLog;
    let qIndex = 0;
    let w = 0;
    for (const e of log) {
      if (e.elapsed_ms > elapsedMs) break;
      qIndex = e.question_index + 1;
      if (!e.correct) w++;
      if (w >= MAX_WRONG) break;
    }
    return { qIndex, wrong: w };
  }, [elapsedMs, bundle?.opponent]);

  const questions = bundle?.questions ?? [];
  const current = questions[index];

  // Tick clock.
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      const e = Date.now() - startRef.current;
      setElapsedMs(e);
      if (e >= BATTLE_TIME_MS) endRun("time");
    }, 100);
    return () => window.clearInterval(id);
  }, [finished]);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [index]);

  const endRun = async (
    _reason: "time" | "wrong" | "done",
    overrides?: { correct?: number; wrong?: number },
  ) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFinished(true);
    const finalCorrect = overrides?.correct ?? correct;
    const finalWrong = overrides?.wrong ?? wrong;
    const totalTimeMs = Math.min(Date.now() - startRef.current, BATTLE_TIME_MS);
    try {
      const res = await finalize.mutateAsync({
        opponentRunId: bundle?.opponent?.runId ?? null,
        questionsCorrect: finalCorrect,
        questionsWrong: finalWrong,
        totalTimeMs,
        eventLog: events,
      });
      const opp = bundle?.opponent;
      navigate({
        to: "/battle/results" as any,
        search: {
          rank: res.dailyRank ?? "",
          result: res.result ?? "",
          correct: finalCorrect,
          wrong: finalWrong,
          wins: res.totalWins,
          alert: res.newTop100Alert ? "1" : "",
          opponentName: opp ? opp.firstName : "Ghost",
          opponentAnimalSeed: opp?.animalSeed ?? null,
          opponentColorSeed: opp?.colorSeed ?? null,
          opponentCorrect: opp ? opp.questionsCorrect : null,
          opponentWrong: opp ? opp.questionsWrong : null,
        } as any,
      });
    } catch {
      navigate({ to: "/home" as any });
    }
  };

  const submit = async (choice: number) => {
    if (submitted || !current) return;
    setSelected(choice);
    setSubmitted(true);
    const isCorrect = choice === current.correctIndex;
    const now = Date.now();
    const e: BattleEvent = {
      question_index: index,
      correct: isCorrect,
      elapsed_ms: now - startRef.current,
    };
    setEvents((prev) => [...prev, e]);
    await sfx.resume();
    if (isCorrect) {
      setCorrect((c) => c + 1);
      sfx.correct();
      fireBolts(choice);
    } else {
      setWrong((w) => w + 1);
      sfx.wrong();
    }

    // Advance shortly after grading.
    window.setTimeout(() => {
      const newWrong = isCorrect ? wrong : wrong + 1;
      if (newWrong >= MAX_WRONG) {
        endRun("wrong");
        return;
      }
      if (index + 1 >= questions.length) {
        endRun("done");
        return;
      }
      setIndex((i) => i + 1);
    }, 500);
  };

  if (!bundle || !current) {
    return (
      <FreeShell>
        <div className="topo-bg min-h-screen flex items-center justify-center text-[var(--lavender)]/70">
          Loading battle…
        </div>
      </FreeShell>
    );
  }

  const remainingMs = Math.max(0, BATTLE_TIME_MS - elapsedMs);
  const secs = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;

  const opp = bundle.opponent;
  const oppAv = opp ? opponentAvatar(opp.animalSeed, opp.colorSeed) : null;

  return (
    <FreeShell>
      <div className="topo-bg topo-dim min-h-screen">
        {/* Header: timer + opponent progress */}
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ background: "rgba(29,41,0,0.9)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
        >
          <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-3">
            {/* You */}
            <PlayerStatus
              name={myName}
              avatar={myAvatar}
              correct={correct}
              wrong={wrong}
              side="left"
              scoreRef={scoreRef}
            />

            {/* Timer */}
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 shrink-0"
              style={{ background: "rgba(184,255,0,0.12)", border: "1px solid rgba(184,255,0,0.35)" }}
            >
              <Timer className="size-5" style={{ color: "var(--volt)" }} />
              <span className="display text-base tabular-nums text-[var(--lavender)]">
                {mm}:{ss.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Opponent */}
            <PlayerStatus
              name={opp?.firstName ?? "Ghost"}
              avatar={oppAv ?? { animal: "bear", color: "#6B7280", accessory: "none" }}
              correct={Math.max(0, oppProgress.qIndex - oppProgress.wrong)}
              wrong={oppProgress.wrong}
              side="right"
            />
          </div>
        </header>

        {/* Question */}
        <main className="mx-auto max-w-2xl px-5 pt-6 pb-16">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: "var(--lavender)", color: "var(--ink)" }}
          >
            <div
              className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ background: "rgba(74,6,136,0.12)", color: "var(--violet-deep)" }}
            >
              {current.domainLabel}
            </div>

            {current.passage && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b2f57" }}>
                {current.passage}
              </p>
            )}

            <h1 className="mt-3 text-base sm:text-lg font-bold" style={{ color: "var(--ink)" }}>
              {current.prompt}
            </h1>

            <div className="mt-5 grid gap-2.5">
              {current.choices.map((choice, i) => {
                const isSel = selected === i;
                const revealed = submitted;
                const isCorrect = revealed && i === current.correctIndex;
                let bg = "#fff";
                let border = "1.5px solid rgba(29,41,0,0.12)";
                let color = "var(--ink)";
                if (revealed && isSel && isCorrect) {
                  bg = "var(--volt)";
                  border = "2px solid var(--volt)";
                } else if (revealed && isSel && !isCorrect) {
                  bg = "#ff4d6d";
                  border = "2px solid #ff4d6d";
                  color = "#fff";
                } else if (revealed && isCorrect) {
                  bg = "var(--volt)";
                  border = "2px solid var(--volt)";
                }
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      choiceRefs.current[i] = el;
                    }}
                    disabled={submitted}
                    onClick={() => submit(i)}
                    className="text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3"
                    style={{ background: bg, border, color }}
                  >
                    <span className="font-bold mt-0.5 shrink-0 opacity-80">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-semibold">{choice}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Lightning bolts on correct answers */}
        <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
          {bolts.map((b) => {
            const burstDist = 60 + Math.random() * 40;
            const midX = b.sx + Math.cos(b.angle) * burstDist;
            const midY = b.sy + Math.sin(b.angle) * burstDist;
            const style: React.CSSProperties = {
              position: "absolute",
              left: 0,
              top: 0,
              willChange: "transform, opacity",
              animation: `bolt-fly 600ms cubic-bezier(0.4, 0, 0.2, 1) ${b.delay}ms forwards`,
              ["--sx" as any]: `${b.sx - 7}px`,
              ["--sy" as any]: `${b.sy - 9}px`,
              ["--mx" as any]: `${midX - 7}px`,
              ["--my" as any]: `${midY - 9}px`,
              ["--ex" as any]: `${b.ex - 7}px`,
              ["--ey" as any]: `${b.ey - 9}px`,
              ["--r0" as any]: `${b.rot}deg`,
              ["--r1" as any]: `${b.rot + 180}deg`,
            };
            return (
              <svg key={b.id} width="14" height="18" viewBox="0 0 14 18" style={style}>
                <path
                  d="M8 0 L0 10 L5 10 L4 18 L14 7 L8 7 Z"
                  fill="#B8FF00"
                  style={{
                    filter:
                      "drop-shadow(0 0 4px #B8FF00) drop-shadow(0 0 8px rgba(184,255,0,0.7))",
                  }}
                />
              </svg>
            );
          })}
        </div>

        <style>{`
          @keyframes bolt-fly {
            0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--r0)) scale(0.4); opacity: 0; }
            15%  { transform: translate(var(--mx), var(--my)) rotate(var(--r0)) scale(1.15); opacity: 1; }
            100% { transform: translate(var(--ex), var(--ey)) rotate(var(--r1)) scale(0.5); opacity: 0; }
          }
        `}</style>
      </div>
    </FreeShell>
  );
}

function PlayerStatus({
  name,
  avatar,
  correct,
  wrong,
  side,
  scoreRef,
}: {
  name: string;
  avatar: AvatarConfig;
  correct: number;
  wrong: number;
  side: "left" | "right";
  scoreRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className={`flex flex-col min-w-0 ${
        side === "right" ? "items-end" : "items-start"
      }`}
    >
      {/* Line 1: avatar + name */}
      <div
        className={`flex items-center gap-2 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <Avatar config={avatar} size={44} />
        <div
          className={`text-sm font-bold text-[var(--lavender)] truncate max-w-[100px] ${
            side === "right" ? "text-right" : ""
          }`}
        >
          {name}
        </div>
      </div>

      {/* Line 2: three incorrect answer boxes */}
      <div className={`flex gap-1 mt-2 ${side === "right" ? "flex-row-reverse" : ""}`}>
        {Array.from({ length: MAX_WRONG }).map((_, i) => (
          <div
            key={i}
            className="rounded-md flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              border: "1.5px solid rgba(246,240,250,0.3)",
              background: i < wrong ? "#ff4d6d" : "transparent",
              boxShadow: i < wrong ? "0 0 6px rgba(255,77,109,0.6)" : undefined,
            }}
          >
            {i < wrong && (
              <span className="text-xs font-bold text-white leading-none">
                ✕
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Line 3: score */}
      <div
        className={`mt-1.5 flex items-center gap-1.5 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          ref={scoreRef}
          className="text-base font-bold text-white tabular-nums rounded-full flex items-center justify-center"
          style={{ width: 32, height: 32, background: "var(--violet-deep)" }}
        >
          {correct}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--lavender)]/70">
          Score
        </span>
      </div>
    </div>
  );
}
