// Server functions for the free-user data layer.
// All persistence lives here; the client reads via TanStack Query and mutates
// through these functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DOMAINS,
  SCORING,
  applySession as applySessionPure,
  domainIdFor,
  type BatchEntry,
  type FreeState,
  type DomainStat,
  type SessionResult,
} from "./freeUser";
import {
  QUESTIONS,
  scoreFor,
  timeFactor,
  type DiagState,
  type Difficulty,
} from "./diagnostic";

// ---------- shared helpers ----------

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function isoMinusDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(aISO: string, bISO: string): number {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

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

function domainScore(masteryPct: number): number {
  const m = Math.max(0, Math.min(100, masteryPct)) / 100;
  return 50 + 150 * Math.pow(m, 1.4);
}
function computePredicted(state: FreeState): number {
  const allInit = DOMAINS.every((d) => state.domainStats[d.id]?.initialized);
  if (!allInit) return state.diagnosticScore || 800;
  let total = 0;
  for (const d of DOMAINS) total += domainScore(state.domainStats[d.id].mastery);
  return Math.max(400, Math.min(1600, Math.round(total / 10) * 10));
}
function syncSnapshots(s: FreeState) {
  for (const d of DOMAINS) s.domainScores[d.id] = s.domainStats[d.id].mastery;
  s.overall = computePredicted(s);
}
function applyDecayInPlace(state: FreeState) {
  const today = todayISO();
  for (const d of DOMAINS) {
    const stat = state.domainStats[d.id];
    if (!stat || !stat.initialized || !stat.lastAnsweredISO) continue;
    const idle = daysBetween(stat.lastAnsweredISO, today);
    if (idle <= SCORING.DECAY_GRACE_DAYS) continue;
    const weeks = (idle - SCORING.DECAY_GRACE_DAYS) / 7;
    stat.mastery = Math.max(SCORING.DECAY_FLOOR, stat.mastery - SCORING.DECAY_PER_WEEK * weeks);
  }
}
function recomputeMomentum(state: FreeState) {
  const today = todayISO();
  const last = state.lastMomentumDateISO || today;
  const idleDays = daysBetween(last, today);
  let needle = state.momentumNeedle;
  const qualifiedDays = new Set(state.qualifyingDays);
  for (let i = 1; i <= idleDays; i++) {
    const day = isoMinusDays(today, idleDays - i);
    if (!qualifiedDays.has(day)) needle = Math.max(0, needle - 1);
  }
  state.momentumNeedle = Math.max(0, Math.min(10, needle));
  state.lastMomentumDateISO = today;
}

// ---------- hydrate DB rows → FreeState ----------

type ScoringRow = {
  momentum_needle: number;
  last_momentum_date: string | null;
  qualifying_days: unknown;
  streak: number;
  last_daily_date: string | null;
  diagnostic_score: number;
  seeded: boolean;
};
type MasteryRow = {
  domain_id: string;
  answered: number;
  initialized: boolean;
  mastery: number;
  last_answered_at: string | null;
  batch: unknown;
  bonus_step: number;
};
type ProfileRow = {
  name: string | null;
  email: string | null;
  plan: string;
};

function rowsToState(
  profile: ProfileRow | null,
  scoring: ScoringRow | null,
  mastery: MasteryRow[],
): FreeState {
  const s = emptyState();
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
  for (const row of mastery) {
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

async function loadState(ctx: {
  supabase: any;
  userId: string;
}): Promise<FreeState> {
  const [profileRes, scoringRes, masteryRes] = await Promise.all([
    ctx.supabase.from("profiles").select("name, email, plan").eq("id", ctx.userId).maybeSingle(),
    ctx.supabase
      .from("user_scoring_state")
      .select("momentum_needle, last_momentum_date, qualifying_days, streak, last_daily_date, diagnostic_score, seeded")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    ctx.supabase
      .from("user_domain_mastery")
      .select("domain_id, answered, initialized, mastery, last_answered_at, batch, bonus_step")
      .eq("user_id", ctx.userId),
  ]);
  const state = rowsToState(profileRes.data, scoringRes.data, masteryRes.data ?? []);
  applyDecayInPlace(state);
  recomputeMomentum(state);
  syncSnapshots(state);
  return state;
}

async function persistState(
  ctx: { supabase: any; userId: string },
  state: FreeState,
) {
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
    ctx.supabase.from("user_domain_mastery").upsert(masteryRows, { onConflict: "user_id,domain_id" }),
  ]);
}

// ---------- server functions ----------

export const getFreeState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await loadState(context);
  });

const sessionResultSchema = z.object({
  n: z.number(),
  domainId: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correct: z.boolean(),
  elapsedSeconds: z.number(),
  isBonus: z.boolean().optional(),
});

export const applySessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ results: z.array(sessionResultSchema).min(1) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const prev = await loadState(context);
    const next = applySessionPure(prev, data.results as SessionResult[]);

    // Cold layer: session + answers.
    const { data: sessionRow } = await context.supabase
      .from("sessions")
      .insert({
        user_id: context.userId,
        kind: "daily",
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
      .select("id")
      .single();

    if (sessionRow?.id) {
      const answerRows = data.results.map((r) => ({
        session_id: sessionRow.id,
        user_id: context.userId,
        question_id: String(r.n),
        domain_id: r.domainId,
        difficulty: r.difficulty,
        correct: r.correct,
        elapsed_seconds: r.elapsedSeconds,
        is_bonus: !!r.isBonus,
      }));
      await context.supabase.from("answers").insert(answerRows);
    }

    await persistState(context, next);
    return next;
  });

const diagAnswerSchema = z.object({
  n: z.number(),
  choice: z.number(),
  correct: z.boolean(),
  elapsedSeconds: z.number(),
});
const diagStateSchema = z.object({
  name: z.string().default(""),
  emoji: z.string().default(""),
  avatarId: z.string().default(""),
  color: z.string().default(""),
  startedAt: z.number().nullable().default(null),
  answers: z.array(diagAnswerSchema).default([]),
});

export const migrateAnonymousDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ diag: diagStateSchema }).parse(raw))
  .handler(async ({ data, context }) => {
    const state = await loadState(context);
    if (state.seeded) return { seeded: true, alreadySeeded: true };

    const diag = data.diag as DiagState;
    if (!diag.answers || diag.answers.length === 0) {
      // Nothing to seed with; mark as seeded so we don't retry endlessly.
      state.seeded = true;
      await persistState(context, state);
      return { seeded: true, alreadySeeded: false };
    }

    state.diagnosticScore = scoreFor(diag).total;
    if (!state.name && diag.name) state.name = diag.name;

    for (const a of diag.answers) {
      const q = QUESTIONS.find((qq) => qq.n === a.n);
      if (!q) continue;
      const id = domainIdFor(q.domainLabel);
      if (!id) continue;
      const stat = state.domainStats[id];
      if (!stat) continue;
      const difficulty = (q.difficulty ?? 2) as Difficulty;
      stat.answered += 1;
      stat.batch.push({
        difficulty,
        correct: a.correct,
        timeFactor: timeFactor(a.correct, a.elapsedSeconds, q.expectedSeconds),
      });
      stat.lastAnsweredISO = todayISO();
    }
    state.seeded = true;
    syncSnapshots(state);

    // Update profile name/email if we have them.
    if (state.name || diag.name) {
      await context.supabase
        .from("profiles")
        .update({ name: state.name || diag.name })
        .eq("id", context.userId);
    }
    await context.supabase
      .from("user_scoring_state")
      .update({ diagnostic_score: state.diagnosticScore, seeded: true })
      .eq("user_id", context.userId);

    await persistState(context, state);
    return { seeded: true, alreadySeeded: false };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      name: z.string().max(120).optional(),
      email: z.string().email().optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const patch: { name?: string; email?: string } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (Object.keys(patch).length === 0) return { ok: true };
    await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    return { ok: true };
  });
