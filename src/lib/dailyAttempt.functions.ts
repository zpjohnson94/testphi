// Per-question serve & grade for the universal Daily 5.
//
// serveDailyQuestion  → returns one shuffled-choices question for a slot; the
//                       correct answer never leaves the server. Idempotent per
//                       (user, date, slot) — a refresh returns the same shuffle.
// gradeDailyAnswer    → grades against the server-stored shuffle, persists the
//                       result on daily_attempts, and returns {isCorrect,
//                       correctPosition} for immediate UI feedback.
// finalizeDailySession → aggregates today's 5 answered attempts, writes the
//                       cold session + answers rows, and updates mastery/
//                       streak. Replaces the old client-built SessionResult
//                       submission path.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getTodayDailySet, type DailyQuestion } from "./dailySet.functions";
import {
  DOMAINS,
  applySession as applySessionPure,
  isBonusQuestionFor,
  nextBonusDifficulty,
  type FreeState,
  type SessionResult,
  type BatchEntry,
  type DomainStat,
} from "./freeUser";
import type { Difficulty } from "./diagnostic";

// ---------- shared state helpers (mirror free.functions.ts) ----------

function emptyStat(): DomainStat {
  return {
    answered: 0,
    initialized: false,
    mastery: 0,
    lastAnsweredISO: "",
    batch: [],
    bonusStep: 0,
  };
}

function emptyState(): FreeState {
  const stats: Record<string, DomainStat> = {};
  const scores: Record<string, number> = {};
  for (const d of DOMAINS) {
    stats[d.id] = emptyStat();
    scores[d.id] = 0;
  }
  return {
    name: "",
    email: "",
    plan: "free",
    seeded: false,
    diagnosticScore: 800,
    domainStats: stats,
    momentumNeedle: 0,
    lastMomentumDateISO: "",
    qualifyingDays: [],
    streak: 0,
    lastDailyDate: "",
    lastSession: null,
    domainScores: scores,
    overall: 800,
  };
}

async function loadFreeState(ctx: { supabase: any; userId: string }): Promise<FreeState> {
  const [profileRes, scoringRes, masteryRes] = await Promise.all([
    ctx.supabase.from("profiles").select("name, email, plan").eq("id", ctx.userId).maybeSingle(),
    ctx.supabase
      .from("user_scoring_state")
      .select(
        "momentum_needle, last_momentum_date, qualifying_days, streak, last_daily_date, diagnostic_score, seeded",
      )
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    ctx.supabase
      .from("user_domain_mastery")
      .select("domain_id, answered, initialized, mastery, last_answered_at, batch, bonus_step")
      .eq("user_id", ctx.userId),
  ]);
  const s = emptyState();
  const profile = profileRes.data;
  const scoring = scoringRes.data;
  if (profile) {
    s.name = profile.name ?? "";
    s.email = profile.email ?? "";
    s.plan = (profile.plan === "powerup" ? "powerup" : "free") as "free" | "powerup";
  }
  if (scoring) {
    s.momentumNeedle = Number(scoring.momentum_needle) || 0;
    s.lastMomentumDateISO = scoring.last_momentum_date ?? "";
    s.qualifyingDays = Array.isArray(scoring.qualifying_days)
      ? (scoring.qualifying_days as string[])
      : [];
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
  // Compute predicted overall so `prev.overall` reflects the same formula
  // applySession will use for `next.overall`. Otherwise session.delta shows
  // phantom points during the pre-calibration phase.
  const allInit = DOMAINS.every((d) => s.domainStats[d.id]?.initialized);
  if (allInit) {
    let total = 0;
    for (const d of DOMAINS) {
      const m = Math.max(0, Math.min(100, s.domainStats[d.id].mastery)) / 100;
      // v2 spec: linear domain score (must match freeUser.computePredicted).
      total += 50 + 150 * m;
    }
    s.overall = Math.max(400, Math.min(1600, Math.round(total / 10) * 10));
  } else {
    s.overall = s.diagnosticScore || 800;
  }
  for (const d of DOMAINS) s.domainScores[d.id] = s.domainStats[d.id].mastery;
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
      user_id: ctx.userId,
      domain_id: d.id,
      answered: st.answered,
      initialized: st.initialized,
      mastery: st.mastery,
      last_answered_at: st.lastAnsweredISO || null,
      batch: st.batch,
      bonus_step: st.bonusStep,
    };
  });
  await Promise.all([
    ctx.supabase.from("user_scoring_state").upsert(scoringPayload, { onConflict: "user_id" }),
    ctx.supabase
      .from("user_domain_mastery")
      .upsert(masteryRows, { onConflict: "user_id,domain_id" }),
  ]);
}

// ---------- shuffle helpers ----------

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

function shuffleLetters(): Letter[] {
  const arr = [...LETTERS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function letterToIndex(l: string): number {
  return { A: 0, B: 1, C: 2, D: 3 }[l as Letter] ?? -1;
}

// ---------- serveDailyQuestion ----------

export interface ServedQuestion {
  attemptId: string;
  slot: number;
  questionId: string;
  domainId: string;
  domainLabel: string;
  difficulty: Difficulty;
  expectedSeconds: number;
  question: string;
  passage?: string;
  choices: [string, string, string, string]; // in shuffled order — client renders as-is
  // If the user has already answered this slot today, the grade is echoed back
  // so a refresh restores the reveal state without a second grade call.
  alreadyAnswered?: boolean;
  selectedPosition?: number;
  isCorrect?: boolean;
  correctPosition?: number;
}

export const serveDailyQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ slot: z.number().int().min(1).max(5) }).parse(raw))
  .handler(async ({ data, context }): Promise<ServedQuestion> => {
    const today = new Date().toISOString().slice(0, 10);
    const slot = data.slot;

    // Resolve today's universal set (DB → generated → hardcoded fallback).
    const set = await getTodayDailySet();
    const question = set.questions[slot - 1];
    if (!question) throw new Error("Slot out of range for today's set");

    // Existing attempt? Return its shuffle (idempotent).
    const { data: existing } = await context.supabase
      .from("daily_attempts")
      .select(
        "id, question_id, shuffled_order, correct_position, selected_position, is_correct, answered_at",
      )
      .eq("user_id", context.userId)
      .eq("set_date", today)
      .eq("slot", slot)
      .maybeSingle();

    if (existing && existing.question_id === question.questionId) {
      const shuffledChoices = existing.shuffled_order.map(
        (l: string) => question.choices[letterToIndex(l)],
      ) as [string, string, string, string];
      const base: ServedQuestion = {
        attemptId: existing.id,
        slot,
        questionId: question.questionId,
        domainId: question.domainId,
        domainLabel: question.domainLabel,
        difficulty: question.difficulty,
        expectedSeconds: question.expectedSeconds,
        question: question.prompt,
        passage: question.passage,
        choices: shuffledChoices,
      };
      if (existing.answered_at) {
        base.alreadyAnswered = true;
        base.selectedPosition = existing.selected_position ?? undefined;
        base.isCorrect = existing.is_correct ?? undefined;
        base.correctPosition = existing.correct_position;
      }
      return base;
    }

    // Fresh serve — new shuffle, insert attempt row.
    const order = shuffleLetters();
    const correctLetter = LETTERS[question.correctIndex];
    const correctPosition = order.indexOf(correctLetter);
    const shuffledChoices = order.map((l) => question.choices[letterToIndex(l)]) as [
      string,
      string,
      string,
      string,
    ];

    // Insert-only, don't clobber a concurrent serve. On unique-conflict the
    // other request won; re-read and return its shuffle so the client and DB
    // agree on choice order + correct_position.
    const { data: inserted, error } = await context.supabase
      .from("daily_attempts")
      .upsert(
        {
          user_id: context.userId,
          set_date: today,
          slot,
          question_id: question.questionId,
          shuffled_order: order,
          correct_position: correctPosition,
        },
        { onConflict: "user_id,set_date,slot", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!inserted) {
      const { data: winner, error: readErr } = await context.supabase
        .from("daily_attempts")
        .select(
          "id, question_id, shuffled_order, correct_position, selected_position, is_correct, answered_at",
        )
        .eq("user_id", context.userId)
        .eq("set_date", today)
        .eq("slot", slot)
        .single();
      if (readErr || !winner) throw new Error(readErr?.message ?? "Failed to read attempt");
      const winnerChoices = (winner.shuffled_order as string[]).map(
        (l) => question.choices[letterToIndex(l)],
      ) as [string, string, string, string];
      const base: ServedQuestion = {
        attemptId: winner.id,
        slot,
        questionId: question.questionId,
        domainId: question.domainId,
        domainLabel: question.domainLabel,
        difficulty: question.difficulty,
        expectedSeconds: question.expectedSeconds,
        question: question.prompt,
        passage: question.passage,
        choices: winnerChoices,
      };
      if (winner.answered_at) {
        base.alreadyAnswered = true;
        base.selectedPosition = winner.selected_position ?? undefined;
        base.isCorrect = winner.is_correct ?? undefined;
        base.correctPosition = winner.correct_position;
      }
      return base;
    }

    return {
      attemptId: inserted.id,
      slot,
      questionId: question.questionId,
      domainId: question.domainId,
      domainLabel: question.domainLabel,
      difficulty: question.difficulty,
      expectedSeconds: question.expectedSeconds,
      question: question.prompt,
      passage: question.passage,
      choices: shuffledChoices,
    };
  });

// ---------- serveDailySetBatch ----------
// Returns all 5 ServedQuestion for today in a single round-trip. Idempotent:
// reuses existing shuffles when present, inserts fresh attempts otherwise.

export const serveDailySetBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServedQuestion[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const set = await getTodayDailySet();

    const { data: existingRows } = await context.supabase
      .from("daily_attempts")
      .select(
        "id, slot, question_id, shuffled_order, correct_position, selected_position, is_correct, answered_at",
      )
      .eq("user_id", context.userId)
      .eq("set_date", today);
    const bySlot = new Map<number, any>();
    for (const r of existingRows ?? []) bySlot.set(r.slot, r);

    const out: ServedQuestion[] = [];
    for (let slot = 1; slot <= 5; slot++) {
      const question = set.questions[slot - 1];
      if (!question) throw new Error(`Missing question for slot ${slot}`);
      const existing = bySlot.get(slot);

      if (existing && existing.question_id === question.questionId) {
        const shuffledChoices = existing.shuffled_order.map(
          (l: string) => question.choices[letterToIndex(l)],
        ) as [string, string, string, string];
        const s: ServedQuestion = {
          attemptId: existing.id,
          slot,
          questionId: question.questionId,
          domainId: question.domainId,
          domainLabel: question.domainLabel,
          difficulty: question.difficulty,
          expectedSeconds: question.expectedSeconds,
          question: question.prompt,
          passage: question.passage,
          choices: shuffledChoices,
        };
        if (existing.answered_at) {
          s.alreadyAnswered = true;
          s.selectedPosition = existing.selected_position ?? undefined;
          s.isCorrect = existing.is_correct ?? undefined;
          s.correctPosition = existing.correct_position;
        }
        out.push(s);
        continue;
      }

      const order = shuffleLetters();
      const correctLetter = LETTERS[question.correctIndex];
      const correctPosition = order.indexOf(correctLetter);
      const shuffledChoices = order.map((l) => question.choices[letterToIndex(l)]) as [
        string,
        string,
        string,
        string,
      ];

      const { data: inserted, error } = await context.supabase
        .from("daily_attempts")
        .upsert(
          {
            user_id: context.userId,
            set_date: today,
            slot,
            question_id: question.questionId,
            shuffled_order: order,
            correct_position: correctPosition,
          },
          { onConflict: "user_id,set_date,slot", ignoreDuplicates: true },
        )
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);

      if (!inserted) {
        // A concurrent serve won the insert. Re-read and use its shuffle so
        // the client renders the same choice order the DB will grade against.
        const { data: winner, error: readErr } = await context.supabase
          .from("daily_attempts")
          .select(
            "id, shuffled_order, correct_position, selected_position, is_correct, answered_at",
          )
          .eq("user_id", context.userId)
          .eq("set_date", today)
          .eq("slot", slot)
          .single();
        if (readErr || !winner) throw new Error(readErr?.message ?? "Failed to read attempt");
        const winnerChoices = (winner.shuffled_order as string[]).map(
          (l) => question.choices[letterToIndex(l)],
        ) as [string, string, string, string];
        const s: ServedQuestion = {
          attemptId: winner.id,
          slot,
          questionId: question.questionId,
          domainId: question.domainId,
          domainLabel: question.domainLabel,
          difficulty: question.difficulty,
          expectedSeconds: question.expectedSeconds,
          question: question.prompt,
          passage: question.passage,
          choices: winnerChoices,
        };
        if (winner.answered_at) {
          s.alreadyAnswered = true;
          s.selectedPosition = winner.selected_position ?? undefined;
          s.isCorrect = winner.is_correct ?? undefined;
          s.correctPosition = winner.correct_position;
        }
        out.push(s);
        continue;
      }

      out.push({
        attemptId: inserted.id,
        slot,
        questionId: question.questionId,
        domainId: question.domainId,
        domainLabel: question.domainLabel,
        difficulty: question.difficulty,
        expectedSeconds: question.expectedSeconds,
        question: question.prompt,
        passage: question.passage,
        choices: shuffledChoices,
      });
    }
    return out;
  });

// ---------- gradeDailyAnswer ----------

export interface GradeResult {
  isCorrect: boolean;
  correctPosition: number;
  selectedPosition: number;
}

export const gradeDailyAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        attemptId: z.string().uuid(),
        selectedPosition: z.number().int().min(0).max(3),
        elapsedMs: z.number().int().min(0),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }): Promise<GradeResult> => {
    const { data: row, error } = await context.supabase
      .from("daily_attempts")
      .select("id, user_id, correct_position, is_correct, selected_position, answered_at")
      .eq("id", data.attemptId)
      .single();
    if (error || !row) throw new Error("Attempt not found");
    if (row.user_id !== context.userId) throw new Error("Forbidden");

    // Idempotent: if already answered, echo the stored result.
    if (row.answered_at) {
      return {
        isCorrect: !!row.is_correct,
        correctPosition: row.correct_position,
        selectedPosition: row.selected_position ?? data.selectedPosition,
      };
    }

    const isCorrect = data.selectedPosition === row.correct_position;
    await context.supabase
      .from("daily_attempts")
      .update({
        selected_position: data.selectedPosition,
        is_correct: isCorrect,
        elapsed_ms: data.elapsedMs,
        answered_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return {
      isCorrect,
      correctPosition: row.correct_position,
      selectedPosition: data.selectedPosition,
    };
  });

// ---------- finalizeDailySession ----------

export const finalizeDailySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreeState> => {
    const today = new Date().toISOString().slice(0, 10);

    // Parallelize the 3 independent reads: today's set (cacheable), the
    // user's daily_attempts, and the full FreeState (3 sub-queries).
    const [set, attemptsRes, prev] = await Promise.all([
      getTodayDailySet(),
      context.supabase
        .from("daily_attempts")
        .select("slot, question_id, is_correct, elapsed_ms, answered_at")
        .eq("user_id", context.userId)
        .eq("set_date", today)
        .order("slot", { ascending: true }),
      loadFreeState(context),
    ]);

    const answered = (attemptsRes.data ?? []).filter((r: any) => r.answered_at != null);
    if (answered.length < 5) {
      throw new Error(`Session incomplete: ${answered.length}/5 answered`);
    }

    // Derive SessionResult[] from attempts + today's question meta.
    // `isBonus` is computed against the pre-session mastery state, mirroring
    // the old client-side behavior.
    const workingState: FreeState = JSON.parse(JSON.stringify(prev));
    const results: SessionResult[] = answered.map((r: any) => {
      const q: DailyQuestion | undefined = set.questions[r.slot - 1];
      const domainId = q?.domainId ?? "math-algebra";
      const isBonus = q ? isBonusQuestionFor(workingState, domainId) : false;
      const difficulty: Difficulty =
        isBonus && q ? nextBonusDifficulty(workingState, domainId) : (q?.difficulty ?? 2);
      // Advance the working copy so bonus flags stay consistent slot-to-slot.
      if (isBonus) {
        const st = workingState.domainStats[domainId];
        if (st) st.bonusStep = Math.min(3, (st.bonusStep + 1) as 0 | 1 | 2 | 3) as 0 | 1 | 2 | 3;
      }
      return {
        n: r.slot,
        questionId: r.question_id,
        domainId,
        difficulty,
        correct: !!r.is_correct,
        elapsedSeconds: (r.elapsed_ms ?? 0) / 1000,
        isBonus,
      };
    });

    const next = applySessionPure(prev, results);

    // Persist mastery/scoring in parallel with the cold-layer session insert.
    // The response only needs `next`, so the answers insert can chain off the
    // session insert without blocking the return.
    const nowIso = new Date().toISOString();
    const sessionInsert = context.supabase
      .from("sessions")
      .insert({
        user_id: context.userId,
        kind: "daily",
        started_at: nowIso,
        completed_at: nowIso,
        prev_overall: prev.overall,
        new_overall: next.overall,
        delta: next.overall - prev.overall,
        momentum_before: prev.momentumNeedle,
        momentum_after: next.momentumNeedle,
        streak_before: prev.streak,
        streak_after: next.streak,
      })
      .select("id")
      .single()
      .then(async ({ data: sessionRow }) => {
        if (!sessionRow?.id) return;
        const answerRows = results.map((r) => ({
          session_id: sessionRow.id,
          user_id: context.userId,
          question_id: r.questionId ?? String(r.n),
          domain_id: r.domainId,
          difficulty: r.difficulty,
          correct: r.correct,
          elapsed_seconds: r.elapsedSeconds,
          is_bonus: !!r.isBonus,
        }));
        await context.supabase.from("answers").insert(answerRows);
      });

    // Await both so failures still surface, but they run concurrently.
    await Promise.all([persistFreeState(context, next), sessionInsert]);
    return next;
  });

// ---------- resetDemoAccount (dev helper) ----------
// Wipes the caller's own daily progress so they can re-run the Daily 5 flow.
// Deletes daily_attempts, sessions, answers, and resets scoring/mastery to
// defaults. Only touches the calling user's rows (RLS enforced).

export const resetDemoAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreeState> => {
    const uid = context.userId;
    await context.supabase.from("daily_attempts").delete().eq("user_id", uid);
    await context.supabase.from("answers").delete().eq("user_id", uid);
    await context.supabase.from("sessions").delete().eq("user_id", uid);
    await context.supabase
      .from("user_scoring_state")
      .update({
        momentum_needle: 0,
        last_momentum_date: null,
        qualifying_days: [],
        streak: 0,
        last_daily_date: null,
        diagnostic_score: 800,
        seeded: false,
      })
      .eq("user_id", uid);
    await context.supabase
      .from("user_domain_mastery")
      .update({
        answered: 0,
        initialized: false,
        mastery: 0,
        last_answered_at: null,
        batch: [],
        bonus_step: 0,
      })
      .eq("user_id", uid);
    return loadFreeState(context);
  });

// ---------- resetDailyToday (dev helper) ----------
// Wipes only today's Daily 5 progress so the user can retake today. Deletes
// today's daily_attempts, today's daily sessions and their answers, and
// clears last_daily_date if it matches today so the flow re-serves cleanly.
// Mastery/momentum gains already applied for today are NOT rolled back.

export const resetDailyToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreeState> => {
    const uid = context.userId;
    const today = new Date().toISOString().slice(0, 10);
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    await context.supabase.from("daily_attempts").delete().eq("user_id", uid).eq("set_date", today);

    const { data: todaysSessions } = await context.supabase
      .from("sessions")
      .select("id")
      .eq("user_id", uid)
      .eq("kind", "daily")
      .gte("started_at", startOfDay)
      .lte("started_at", endOfDay);
    const sessionIds = (todaysSessions ?? []).map((r: { id: string }) => r.id);
    if (sessionIds.length) {
      await context.supabase.from("answers").delete().in("session_id", sessionIds);
      await context.supabase.from("sessions").delete().in("id", sessionIds);
    }

    const { data: scoring } = await context.supabase
      .from("user_scoring_state")
      .select("last_daily_date")
      .eq("user_id", uid)
      .maybeSingle();
    if (scoring?.last_daily_date === today) {
      await context.supabase
        .from("user_scoring_state")
        .update({ last_daily_date: null })
        .eq("user_id", uid);
    }

    return loadFreeState(context);
  });
