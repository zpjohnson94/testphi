// Standalone bonus round server functions.
//
// Serves the 3 fixed-order (Easy/Medium/Hard) bonus questions for a domain
// and grades + finalizes them in a single submit call. Reuses existing
// scoring math from `freeUser` — mastery init fires automatically inside
// `applyOneResult` when `bonusStep >= 3`.
//
// Question selection strategy: deterministic pick from the live `questions`
// bank (first unused-in-recent-bonus id per difficulty for this domain,
// sorted by id). Correct answers are NEVER returned to the client; the
// client submits `selectedPosition` per question and the server grades.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DOMAINS,
  applySession as applySessionPure,
  domainById,
  type FreeState,
  type SessionResult,
  type BatchEntry,
  type DomainStat,
} from "./freeUser";
import type { Difficulty } from "./diagnostic";

// ------- shared state helpers (mirrors dailyAttempt.functions.ts) -------

function emptyStat(): DomainStat {
  return { answered: 0, initialized: false, mastery: 0, lastAnsweredISO: "", batch: [], bonusStep: 0 };
}
function emptyState(): FreeState {
  const stats: Record<string, DomainStat> = {};
  const scores: Record<string, number> = {};
  for (const d of DOMAINS) { stats[d.id] = emptyStat(); scores[d.id] = 0; }
  return {
    name: "", email: "", plan: "free", seeded: false, diagnosticScore: 800,
    domainStats: stats, momentumNeedle: 0, lastMomentumDateISO: "",
    qualifyingDays: [], streak: 0, lastDailyDate: "", lastSession: null,
    domainScores: scores, overall: 800,
  };
}

async function loadFreeState(ctx: { supabase: any; userId: string }): Promise<FreeState> {
  const [profileRes, scoringRes, masteryRes] = await Promise.all([
    ctx.supabase.from("profiles").select("name, email, plan").eq("id", ctx.userId).maybeSingle(),
    ctx.supabase
      .from("user_scoring_state")
      .select("momentum_needle, last_momentum_date, qualifying_days, streak, last_daily_date, diagnostic_score, seeded")
      .eq("user_id", ctx.userId).maybeSingle(),
    ctx.supabase
      .from("user_domain_mastery")
      .select("domain_id, answered, initialized, mastery, last_answered_at, batch, bonus_step")
      .eq("user_id", ctx.userId),
  ]);
  const s = emptyState();
  const profile = profileRes.data;
  const scoring = scoringRes.data;
  if (profile) {
    s.name = profile.name ?? ""; s.email = profile.email ?? "";
    s.plan = (profile.plan === "powerup" ? "powerup" : "free") as "free" | "powerup";
  }
  if (scoring) {
    s.momentumNeedle = Number(scoring.momentum_needle) || 0;
    s.lastMomentumDateISO = scoring.last_momentum_date ?? "";
    s.qualifyingDays = Array.isArray(scoring.qualifying_days) ? (scoring.qualifying_days as string[]) : [];
    s.streak = scoring.streak || 0;
    s.lastDailyDate = scoring.last_daily_date ?? "";
    s.diagnosticScore = Number(scoring.diagnostic_score) || 800;
    s.seeded = !!scoring.seeded;
  }
  for (const row of masteryRes.data ?? []) {
    if (!s.domainStats[row.domain_id]) continue;
    s.domainStats[row.domain_id] = {
      answered: row.answered || 0,
      initialized: !!row.initialized,
      mastery: Number(row.mastery) || 0,
      lastAnsweredISO: row.last_answered_at ?? "",
      batch: Array.isArray(row.batch) ? (row.batch as BatchEntry[]) : [],
      bonusStep: Math.max(0, Math.min(3, row.bonus_step || 0)) as 0 | 1 | 2 | 3,
    };
  }
  return s;
}

async function persistFreeState(ctx: { supabase: any; userId: string }, state: FreeState) {
  const scoringPayload = {
    user_id: ctx.userId,
    momentum_needle: state.momentumNeedle,
    last_momentum_date: state.lastMomentumDateISO || null,
    qualifying_days: state.qualifyingDays,
    streak: state.streak,
    last_daily_date: state.lastDailyDate || null,
    diagnostic_score: state.diagnosticScore,
    seeded: state.seeded,
  };
  const masteryRows = DOMAINS.map((d) => {
    const st = state.domainStats[d.id];
    return {
      user_id: ctx.userId, domain_id: d.id,
      answered: st.answered, initialized: st.initialized, mastery: st.mastery,
      last_answered_at: st.lastAnsweredISO || null,
      batch: st.batch, bonus_step: st.bonusStep,
    };
  });
  await Promise.all([
    ctx.supabase.from("user_scoring_state").upsert(scoringPayload, { onConflict: "user_id" }),
    ctx.supabase.from("user_domain_mastery").upsert(masteryRows, { onConflict: "user_id,domain_id" }),
  ]);
}

// ------- question payload parsing -------

interface ParsedQ {
  questionId: string;
  domainId: string;
  difficulty: Difficulty;
  expectedSeconds: number;
  question: string;
  passage?: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

function parseRow(row: any): ParsedQ | null {
  const p = row.payload ?? {};
  let question = "";
  let choices: [string, string, string, string] | null = null;
  let correctIndex = -1;
  if (typeof p.question === "string" && p.choices && !Array.isArray(p.choices)) {
    question = p.question;
    const c = p.choices as Record<string, string>;
    if (c.A && c.B && c.C && c.D) choices = [c.A, c.B, c.C, c.D];
    correctIndex = ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(p.correct).toUpperCase()] ?? -1;
  } else {
    question = String(p.prompt ?? "");
    if (Array.isArray(p.choices) && p.choices.length === 4) choices = p.choices as any;
    correctIndex = Number(p.correctIndex);
  }
  if (!choices || ![0, 1, 2, 3].includes(correctIndex)) return null;
  return {
    questionId: row.id,
    domainId: row.domain_id,
    difficulty: (row.difficulty as Difficulty) ?? 2,
    expectedSeconds: row.expected_seconds ?? (row.difficulty === 1 ? 30 : row.difficulty === 3 ? 90 : 60),
    question,
    passage: typeof p.passage === "string" ? p.passage : undefined,
    choices,
    correctIndex: correctIndex as 0 | 1 | 2 | 3,
  };
}

async function pickQuestion(supabase: any, domainId: string, difficulty: Difficulty): Promise<ParsedQ | null> {
  const { data } = await supabase
    .from("questions")
    .select("id, domain_id, difficulty, expected_seconds, payload")
    .eq("domain_id", domainId).eq("difficulty", difficulty).eq("is_active", true)
    .order("id", { ascending: true }).limit(20);
  for (const row of data ?? []) {
    const q = parseRow(row);
    if (q) return q;
  }
  return null;
}

// ------- shuffle -------

function shuffle4(): number[] {
  const arr = [0, 1, 2, 3];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------- API types -------

export interface BonusServedQuestion {
  step: 1 | 2 | 3;
  questionId: string;
  difficulty: Difficulty;
  expectedSeconds: number;
  question: string;
  passage?: string;
  choices: [string, string, string, string];
  // Includes the shuffle permutation only so the client can render;
  // the correct position stays server-side (looked up on submit).
  shuffleSeed: string;
}

export interface BonusServedRound {
  domainId: string;
  domainLabel: string;
  questions: BonusServedQuestion[];
}

export interface BonusSubmitPayload {
  domainId: string;
  answers: Array<{
    step: 1 | 2 | 3;
    questionId: string;
    // 0..3 within the SHUFFLED order the client saw. Server re-derives the
    // shuffle from `shuffleSeed` to compute correctness.
    selectedPosition: number;
    shuffleSeed: string;
    elapsedMs: number;
  }>;
}

export interface BonusSubmitResult {
  state: FreeState;
  bonusSummary: {
    correct: number;
    total: number;
    domainAnswered: number;
    domainCorrect: number;
    results: boolean[];
  };
}

// Deterministic PRNG from a seed string so shuffle can be reproduced on submit.
function seededShuffle(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) / 0xffffffff);
  };
  const arr = [0, 1, 2, 3];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------- serveBonusRound -------

export const serveBonusRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ domainId: z.string() }).parse(raw))
  .handler(async ({ data, context }): Promise<BonusServedRound> => {
    const domain = domainById(data.domainId);
    if (!domain) throw new Error("Unknown domain");

    // Fetch one question per difficulty (E → M → H).
    const [q1, q2, q3] = await Promise.all([
      pickQuestion(context.supabase, data.domainId, 1),
      pickQuestion(context.supabase, data.domainId, 2),
      pickQuestion(context.supabase, data.domainId, 3),
    ]);
    if (!q1 || !q2 || !q3) throw new Error("Bonus round questions unavailable for this domain");

    const build = (q: ParsedQ, step: 1 | 2 | 3): BonusServedQuestion => {
      // seed per-request; still deterministic client-side per invocation.
      const seed = `${context.userId}:${data.domainId}:${step}:${Date.now()}:${Math.random()}`;
      const perm = seededShuffle(seed);
      const shuffled = perm.map((i) => q.choices[i]) as [string, string, string, string];
      return {
        step, questionId: q.questionId, difficulty: q.difficulty,
        expectedSeconds: q.expectedSeconds,
        question: q.question, passage: q.passage, choices: shuffled, shuffleSeed: seed,
      };
    };
    return {
      domainId: data.domainId, domainLabel: domain.label,
      questions: [build(q1, 1), build(q2, 2), build(q3, 3)],
    };
  });

// ------- submitBonusRound -------

export const submitBonusRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      domainId: z.string(),
      answers: z.array(z.object({
        step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        questionId: z.string(),
        selectedPosition: z.number().int().min(0).max(3),
        shuffleSeed: z.string(),
        elapsedMs: z.number().int().min(0),
      })).length(3),
    }).parse(raw),
  )
  .handler(async ({ data, context }): Promise<BonusSubmitResult> => {
    // Grade each answer server-side.
    const { data: rows } = await context.supabase
      .from("questions")
      .select("id, domain_id, difficulty, payload")
      .in("id", data.answers.map((a) => a.questionId));
    const byId = new Map<string, ParsedQ>();
    for (const r of rows ?? []) {
      const p = parseRow(r);
      if (p) byId.set(p.questionId, p);
    }

    const prev = await loadFreeState(context);
    const results: SessionResult[] = [];
    for (const a of data.answers) {
      const q = byId.get(a.questionId);
      if (!q || q.domainId !== data.domainId) throw new Error("Invalid question in submission");
      const perm = seededShuffle(a.shuffleSeed);
      // perm[i] = original index shown at shuffled position i
      const chosenOriginalIndex = perm[a.selectedPosition];
      const correct = chosenOriginalIndex === q.correctIndex;
      results.push({
        n: a.step,
        questionId: q.questionId,
        domainId: q.domainId,
        difficulty: q.difficulty,
        correct,
        elapsedSeconds: (a.elapsedMs ?? 0) / 1000,
        isBonus: true,
      });
    }

    const next = applySessionPure(prev, results);

    // Write a lightweight session row + answers so history is preserved.
    const { data: sessionRow } = await context.supabase
      .from("sessions")
      .insert({
        user_id: context.userId,
        kind: "bonus",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        prev_overall: prev.overall,
        new_overall: next.overall,
        delta: next.overall - prev.overall,
        momentum_before: prev.momentumNeedle,
        momentum_after: next.momentumNeedle,
        streak_before: prev.streak,
        streak_after: next.streak,
      })
      .select("id").single();

    if (sessionRow?.id) {
      const answerRows = results.map((r) => ({
        session_id: sessionRow.id,
        user_id: context.userId,
        question_id: r.questionId ?? String(r.n),
        domain_id: r.domainId,
        difficulty: r.difficulty,
        correct: r.correct,
        elapsed_seconds: r.elapsedSeconds,
        is_bonus: true,
      }));
      await context.supabase.from("answers").insert(answerRows);
    }

    await persistFreeState(context, next);

    const correctCount = results.filter((r) => r.correct).length;
    return {
      state: next,
      bonusSummary: {
        correct: correctCount,
        total: results.length,
        domainAnswered: next.domainStats[data.domainId]?.answered ?? 0,
      },
    };
  });
