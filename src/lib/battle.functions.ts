// Battle Mode server functions.
//
// Once-daily async race against a "ghost" (replayed run from another user).
// Fully separate from Daily 5, mastery, momentum, and predicted score.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOMAINS, domainById } from "./freeUser";
import { expectedSecondsFor, type Difficulty } from "./diagnostic";
import { staticGhostProgress } from "./staticGhostProfile";

const BATTLE_QUESTION_COUNT = 60;
const BATTLE_TIME_MS = 120_000;
const MAX_WRONG = 3;

export interface BattleQuestion {
  questionId: string;
  domainId: string;
  domainLabel: string;
  difficulty: Difficulty;
  expectedSeconds: number;
  prompt: string;
  passage?: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface BattleEvent {
  question_index: number;
  correct: boolean;
  elapsed_ms: number;
}

export interface OpponentSummary {
  runId: string;
  userId: string;
  firstName: string;
  animalSeed: number; // deterministic avatar seed
  colorSeed: number;
  battleDate: string;
  questionsCorrect: number;
  questionsWrong: number;
  totalTimeMs: number;
  eventLog: BattleEvent[];
}

export interface BattleBundle {
  battleDate: string;
  alreadyCompleted: boolean;
  myRunId: string | null;
  totalWins: number;
  questions: BattleQuestion[];
  opponent: OpponentSummary | null;
  firstEver: boolean; // no prior runs anywhere → solo run
  useStaticGhost: boolean; // first player of the day for today's set
}

// ---------- helpers ----------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function rowToBattleQuestion(row: any): BattleQuestion | null {
  const p = row.payload ?? {};
  const domain = domainById(row.domain_id);
  if (!domain) return null;

  let prompt: string;
  let choices: [string, string, string, string] | null = null;
  let correctIndex = -1;

  if (typeof p.question === "string" && p.choices && !Array.isArray(p.choices)) {
    prompt = p.question;
    const c = p.choices as Record<string, string>;
    if (c.A && c.B && c.C && c.D) choices = [c.A, c.B, c.C, c.D];
    const letter = String(p.correct ?? "").toUpperCase();
    correctIndex = ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[letter] ?? -1;
  } else {
    prompt = String(p.prompt ?? "");
    if (Array.isArray(p.choices) && p.choices.length === 4) {
      choices = p.choices as [string, string, string, string];
    }
    correctIndex = Number(p.correctIndex);
  }
  if (!choices) return null;
  if (![0, 1, 2, 3].includes(correctIndex)) return null;

  // Randomize choice order so the correct answer isn't always in the same slot.
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const shuffledChoices = order.map((idx) => choices![idx]) as [string, string, string, string];
  const newCorrectIndex = order.indexOf(correctIndex) as 0 | 1 | 2 | 3;

  const difficulty = (row.difficulty as Difficulty) ?? 2;
  return {
    questionId: row.id,
    domainId: row.domain_id,
    domainLabel: domain.label,
    difficulty,
    expectedSeconds: row.expected_seconds ?? expectedSecondsFor(difficulty),
    prompt,
    passage: typeof p.passage === "string" ? p.passage : undefined,
    choices: shuffledChoices,
    correctIndex: newCorrectIndex,
  };
}


async function hydrateQuestions(supabase: any, ids: string[]): Promise<BattleQuestion[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("questions")
    .select("id, domain_id, difficulty, expected_seconds, payload, is_active")
    .in("id", ids);
  const byId = new Map<string, any>((data ?? []).map((r: any) => [r.id, r]));
  const out: BattleQuestion[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) continue;
    const q = rowToBattleQuestion(r);
    if (q) out.push(q);
  }
  return out;
}

// Even-ish draw across the 8 domains, mixed difficulty.
async function generateBattleSet(supabase: any): Promise<string[]> {
  const perDomain = Math.ceil(BATTLE_QUESTION_COUNT / DOMAINS.length);
  const chosen: string[] = [];
  const seen = new Set<string>();
  for (const d of DOMAINS) {
    const { data } = await supabase
      .from("questions")
      .select("id")
      .eq("domain_id", d.id)
      .eq("is_active", true)
      .limit(200);
    const pool = ((data ?? []) as Array<{ id: string }>).map((r) => r.id).filter((id) => !seen.has(id));
    // Shuffle deterministically enough via sort by hash
    pool.sort();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < Math.min(perDomain, pool.length); i++) {
      chosen.push(pool[i]);
      seen.add(pool[i]);
    }
  }
  // Interleave / final shuffle
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen.slice(0, BATTLE_QUESTION_COUNT);
}

async function ensureTodaysBattleSet(supabase: any, iso: string): Promise<string[]> {
  const { data: existing } = await supabase
    .from("battle_sets")
    .select("question_ids")
    .eq("set_date", iso)
    .maybeSingle();
  let ids: string[] = [];
  if (existing?.question_ids?.length) {
    ids = existing.question_ids as string[];
  } else {
    // battle_sets is read-only under RLS — write with the admin client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    ids = await generateBattleSet(supabaseAdmin);
    if (ids.length === 0) return [];
    const { error } = await supabaseAdmin
      .from("battle_sets")
      .upsert({ set_date: iso, question_ids: ids }, { onConflict: "set_date" });
    if (error) {
      // Another request may have inserted it concurrently — re-read before failing.
      const { data: retry } = await supabaseAdmin
        .from("battle_sets")
        .select("question_ids")
        .eq("set_date", iso)
        .maybeSingle();
      if (retry?.question_ids?.length) ids = retry.question_ids as string[];
      else throw new Error(`Failed to create today's battle set: ${error.message}`);
    }
  }
  // First request of the day → ensure fake leaderboard rows exist.
  await ensureFakeRunsForDay(iso);
  return ids;
}


// ---------- fake profile daily runs ----------

// Deterministic PRNG (mulberry32) seeded by hash(date + profile id).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GeneratedFakeRun {
  fake_profile_id: string;
  questions_correct: number;
  questions_wrong: number;
  total_time_ms: number;
}

function generateFakeRun(iso: string, profileId: string): GeneratedFakeRun {
  const rand = mulberry32(hashSeed(`${iso}:${profileId}`));
  // Per-day rank order: reshuffle profiles via the seed. We assign a
  // "target strength" 0..1 from rand and map to results honoring caps.
  const strength = rand(); // 0..1
  const jitter = rand();

  // Baseline correct: rank 1 ≈ 15, rank 100 ≈ 5. Strength=1 → 15, 0 → 5.
  let correct = Math.round(5 + strength * 10 + (jitter - 0.5) * 2);
  correct = Math.max(3, Math.min(15, correct));

  // Wrongs 0..3 — stronger players fewer wrongs.
  let wrongs = 3 - Math.floor(strength * 3 + rand() * 0.8);
  wrongs = Math.max(0, Math.min(3, wrongs));

  // Termination: 3 wrongs stops early, else at 15 correct or 2:00.
  const total = correct + wrongs;
  // Base time: elite ~65s, low end ~timeout 120s.
  let totalTimeMs: number;
  if (wrongs >= 3) {
    // Ended early on 3rd wrong. Time between 40s and 118s scaled by inverse strength.
    totalTimeMs = Math.round(40_000 + (1 - strength) * 75_000 + (rand() - 0.5) * 4_000);
  } else if (correct >= 15) {
    // Finished all 15. Fast for strong.
    totalTimeMs = Math.round(60_000 + (1 - strength) * 55_000 + (rand() - 0.5) * 4_000);
  } else {
    // Timed out at 120s.
    totalTimeMs = 120_000 - Math.floor(rand() * 500);
  }
  totalTimeMs = Math.max(20_000, Math.min(120_000, totalTimeMs));
  // Sanity: cannot have answered more than total questions in bank size.
  return {
    fake_profile_id: profileId,
    questions_correct: correct,
    questions_wrong: wrongs,
    total_time_ms: totalTimeMs,
  };
}

// Makes sure the battle_sets row for `iso` exists (battle_runs has a FK to it).
async function ensureBattleSetRow(admin: any, iso: string): Promise<boolean> {
  const { data: existing } = await admin
    .from("battle_sets")
    .select("set_date")
    .eq("set_date", iso)
    .maybeSingle();
  if (existing) return true;
  const ids = await generateBattleSet(admin);
  if (ids.length === 0) return false;
  const { error } = await admin
    .from("battle_sets")
    .upsert({ set_date: iso, question_ids: ids }, { onConflict: "set_date" });
  if (error) {
    const { data: retry } = await admin
      .from("battle_sets")
      .select("set_date")
      .eq("set_date", iso)
      .maybeSingle();
    return !!retry;
  }
  return true;
}

async function ensureFakeRunsForDay(iso: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Idempotency: skip if any fake row already exists for today.
  const { count } = await supabaseAdmin
    .from("battle_runs")
    .select("*", { count: "exact", head: true })
    .eq("battle_date", iso)
    .eq("is_fake", true);
  if ((count ?? 0) > 0) return;

  // battle_runs.battle_date references battle_sets.set_date.
  const hasSet = await ensureBattleSetRow(supabaseAdmin, iso);
  if (!hasSet) throw new Error(`No battle set could be created for ${iso}`);


  const { data: profs } = await supabaseAdmin
    .from("battle_fake_profiles")
    .select("id");
  const profiles = (profs ?? []) as Array<{ id: string }>;
  if (profiles.length === 0) return;

  const runs = profiles.map((p) => {
    const r = generateFakeRun(iso, p.id);
    return {
      user_id: null,
      is_fake: true,
      fake_profile_id: r.fake_profile_id,
      battle_date: iso,
      opponent_run_id: null,
      questions_correct: r.questions_correct,
      questions_wrong: r.questions_wrong,
      total_time_ms: r.total_time_ms,
      event_log: [],
      result: null,
    };
  });

  const { error } = await supabaseAdmin
    .from("battle_runs")
    .insert(runs as any);
  if (error) {
    // Re-check for a concurrent insert; otherwise surface the real failure.
    const { count: now } = await supabaseAdmin
      .from("battle_runs")
      .select("*", { count: "exact", head: true })
      .eq("battle_date", iso)
      .eq("is_fake", true);
    if ((now ?? 0) > 0) return;
    console.error("[battle] fake run insert failed", error);
    throw new Error(`Failed to insert fake battle runs: ${error.message}`);
  }


  // Compute daily_rank for the inserted fake rows (top 100 only).
  const { data: sorted } = await supabaseAdmin
    .from("battle_runs")
    .select("id, questions_correct, total_time_ms")
    .eq("battle_date", iso)
    .eq("is_fake", true)
    .order("questions_correct", { ascending: false })
    .order("total_time_ms", { ascending: true });
  const ranked = (sorted ?? []) as Array<{ id: string }>;
  await Promise.all(
    ranked.map((r, i) =>
      i < 100
        ? supabaseAdmin.from("battle_runs").update({ daily_rank: i + 1 }).eq("id", r.id)
        : Promise.resolve(),
    ),
  );
}

// Deterministic pseudo-avatar seed from a user id string.
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

async function loadOpponent(
  supabase: any,
  currentUserId: string,
  iso: string,
): Promise<{ opponent: OpponentSummary | null; firstEver: boolean; useStaticGhost: boolean }> {
  // First real player of the day for today's battle_set → static ghost.
  // Fake runs don't count so this behavior is preserved.
  const { count: todayCount } = await supabase
    .from("battle_runs")
    .select("*", { count: "exact", head: true })
    .eq("battle_date", iso)
    .eq("is_fake", false);
  if ((todayCount ?? 0) === 0) {
    return { opponent: null, firstEver: false, useStaticGhost: true };
  }

  // Try today first (excluding self, excluding fakes).
  const { data: todayRun } = await supabase
    .from("battle_runs")
    .select("id, user_id, battle_date, questions_correct, questions_wrong, total_time_ms, event_log")
    .eq("battle_date", iso)
    .eq("is_fake", false)
    .neq("user_id", currentUserId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let run: any = todayRun;
  if (!run) {
    // Fall back to yesterday (real runs only).
    const y = yesterdayISO(iso);
    const { data: yRun } = await supabase
      .from("battle_runs")
      .select("id, user_id, battle_date, questions_correct, questions_wrong, total_time_ms, event_log")
      .eq("battle_date", y)
      .eq("is_fake", false)
      .neq("user_id", currentUserId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    run = yRun;
  }

  if (!run) {
    // Check any real run anywhere → first-ever check.
    const { count } = await supabase
      .from("battle_runs")
      .select("*", { count: "exact", head: true })
      .eq("is_fake", false);
    return { opponent: null, firstEver: (count ?? 0) === 0, useStaticGhost: false };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", run.user_id)
    .maybeSingle();
  const first = (prof?.name ?? "").split(" ")[0] || "Rival";

  return {
    opponent: {
      runId: run.id,
      userId: run.user_id,
      firstName: first,
      animalSeed: hashSeed(run.user_id),
      colorSeed: hashSeed(run.user_id + ":c"),
      battleDate: run.battle_date,
      questionsCorrect: run.questions_correct,
      questionsWrong: run.questions_wrong,
      totalTimeMs: run.total_time_ms,
      eventLog: (run.event_log ?? []) as BattleEvent[],
    },
    firstEver: false,
    useStaticGhost: false,
  };
}

async function countWins(supabase: any, userId: string): Promise<number> {
  const { count } = await supabase
    .from("battle_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("result", "win");
  return count ?? 0;
}

// ---------- server functions ----------

export const getBattleStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const iso = todayISO();
    const [{ data: mine }, wins] = await Promise.all([
      context.supabase
        .from("battle_runs")
        .select("id, questions_correct, questions_wrong, result, daily_rank, total_time_ms, opponent_run_id")
        .eq("user_id", context.userId)
        .eq("battle_date", iso)
        .maybeSingle(),
      countWins(context.supabase, context.userId),
    ]);

    let opponent: OpponentSummary | null = null;
    if (mine?.opponent_run_id) {
      const { data: oppRun } = await context.supabase
        .from("battle_runs")
        .select("id, user_id, questions_correct, questions_wrong, total_time_ms")
        .eq("id", mine.opponent_run_id)
        .maybeSingle();
      if (oppRun && oppRun.user_id) {
        const userId = oppRun.user_id;
        const { data: prof } = await context.supabase
          .from("profiles")
          .select("name")
          .eq("id", userId)
          .maybeSingle();
        opponent = {
          runId: oppRun.id,
          userId,
          firstName: (prof?.name ?? "").split(" ")[0] || "Rival",
          animalSeed: hashSeed(userId),
          colorSeed: hashSeed(userId + ":c"),
          battleDate: iso,
          questionsCorrect: oppRun.questions_correct,
          questionsWrong: oppRun.questions_wrong,
          totalTimeMs: oppRun.total_time_ms,
          eventLog: [],
        };
      }
    }

    return {
      battleDate: iso,
      alreadyCompleted: !!mine,
      myRun: mine ?? null,
      opponent,
      totalWins: wins,
    };
  });

export const getBattleBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BattleBundle> => {
    const iso = todayISO();
    const ids = await ensureTodaysBattleSet(context.supabase, iso);

    const [questions, opp, mineRes, wins] = await Promise.all([
      hydrateQuestions(context.supabase, ids),
      loadOpponent(context.supabase, context.userId, iso),
      context.supabase
        .from("battle_runs")
        .select("id")
        .eq("user_id", context.userId)
        .eq("battle_date", iso)
        .maybeSingle(),
      countWins(context.supabase, context.userId),
    ]);

    return {
      battleDate: iso,
      alreadyCompleted: !!mineRes.data,
      myRunId: mineRes.data?.id ?? null,
      totalWins: wins,
      questions,
      opponent: opp.opponent,
      firstEver: opp.firstEver,
      useStaticGhost: opp.useStaticGhost,
    };
  });

const finalizeSchema = z.object({
  opponentRunId: z.string().uuid().nullable(),
  questionsCorrect: z.number().int().min(0).max(BATTLE_QUESTION_COUNT),
  questionsWrong: z.number().int().min(0).max(MAX_WRONG),
  totalTimeMs: z.number().int().min(0).max(BATTLE_TIME_MS + 2000),
  eventLog: z.array(
    z.object({
      question_index: z.number().int().min(0),
      correct: z.boolean(),
      elapsed_ms: z.number().int().min(0),
    }),
  ).max(BATTLE_QUESTION_COUNT),
});

export const finalizeBattleRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => finalizeSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const iso = todayISO();

    // Load opponent to compute win/loss/tie (nullable).
    let opponent: null | { id: string; questions_correct: number; total_time_ms: number } = null;
    if (data.opponentRunId) {
      const { data: opp } = await context.supabase
        .from("battle_runs")
        .select("id, questions_correct, total_time_ms")
        .eq("id", data.opponentRunId)
        .maybeSingle();
      if (opp) opponent = opp as any;
    }

    let result: "win" | "loss" | "tie" | null = null;
    if (opponent) {
      if (data.questionsCorrect > opponent.questions_correct) result = "win";
      else if (data.questionsCorrect < opponent.questions_correct) result = "loss";
      else result = "tie";
    } else {
      // No real opponent (static ghost / first-of-day solo run) — compare to the
      // fixed pacing profile so the result is never null and the run persists.
      const ghost = staticGhostProgress(data.totalTimeMs);
      if (data.questionsCorrect > ghost.correct) result = "win";
      else if (data.questionsCorrect < ghost.correct) result = "loss";
      else result = "tie";
    }

    // Insert the run. Unique (user_id, battle_date) prevents double submission.
    const { data: inserted, error: insertErr } = await context.supabase
      .from("battle_runs")
      .insert({
        user_id: context.userId,
        battle_date: iso,
        opponent_run_id: data.opponentRunId,
        questions_correct: data.questionsCorrect,
        questions_wrong: data.questionsWrong,
        total_time_ms: data.totalTimeMs,
        event_log: data.eventLog,
        result,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      // Likely already completed today — surface existing.
      const { data: mine } = await context.supabase
        .from("battle_runs")
        .select("id, questions_correct, questions_wrong, result, daily_rank")
        .eq("user_id", context.userId)
        .eq("battle_date", iso)
        .maybeSingle();
      const totalWins = await countWins(context.supabase, context.userId);
      return {
        runId: mine?.id ?? null,
        result: (mine?.result ?? null) as "win" | "loss" | "tie" | null,
        dailyRank: mine?.daily_rank ?? null,
        newTop100Alert: false,
        totalWins,
        alreadyCompleted: true,
      };
    }

    // Compute daily rank: number of runs today that beat this one + 1.
    // Better = higher questions_correct; tiebreak lower total_time_ms.
    const { data: better } = await context.supabase
      .from("battle_runs")
      .select("id, questions_correct, total_time_ms")
      .eq("battle_date", iso);

    let rank = 1;
    for (const r of (better ?? []) as Array<any>) {
      if (r.id === inserted.id) continue;
      if (
        r.questions_correct > data.questionsCorrect ||
        (r.questions_correct === data.questionsCorrect && r.total_time_ms < data.totalTimeMs)
      ) {
        rank++;
      }
    }
    const finalRank = rank <= 100 ? rank : null;

    if (finalRank !== null) {
      await context.supabase
        .from("battle_runs")
        .update({ daily_rank: finalRank })
        .eq("id", inserted.id);
    }

    // Alert on Top 100 (dedupe).
    let newTop100Alert = false;
    if (finalRank !== null) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: alertErr } = await supabaseAdmin
        .from("battle_leaderboard_alerts")
        .insert({ user_id: context.userId, battle_date: iso, rank: finalRank });
      newTop100Alert = !alertErr;
    }

    const totalWins = await countWins(context.supabase, context.userId);

    return {
      runId: inserted.id,
      result,
      dailyRank: finalRank,
      newTop100Alert,
      totalWins,
      alreadyCompleted: false,
    };
  });

// ---------- Leaderboard ----------

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  animalSeed: number;
  colorSeed: number;
  questionsCorrect: number;
  totalTimeMs: number;
  isMe: boolean;
  // Explicit avatar overrides (used for fake profiles).
  animalId?: string;
  color?: string;
  accessoryId?: string;
  isFake?: boolean;
}

export interface BattleLeaderboard {
  battleDate: string;
  entries: LeaderboardEntry[];
  myRank: number | null;
}

export const getBattleLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ date: z.string().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }): Promise<BattleLeaderboard> => {
    const iso = data.date ?? todayISO();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Populate the day even if the user hasn't started a battle yet.
    await ensureFakeRunsForDay(iso);



    const { data: runs } = await supabaseAdmin
      .from("battle_runs")
      .select("user_id, questions_correct, total_time_ms, is_fake, fake_profile_id")
      .eq("battle_date", iso)
      .order("questions_correct", { ascending: false })
      .order("total_time_ms", { ascending: true })
      .limit(100);

    const rows = (runs ?? []) as Array<{
      user_id: string | null;
      questions_correct: number;
      total_time_ms: number;
      is_fake: boolean;
      fake_profile_id: string | null;
    }>;

    const userIds = Array.from(
      new Set(rows.filter((r) => !r.is_fake && r.user_id).map((r) => r.user_id as string)),
    );
    const fakeIds = Array.from(
      new Set(rows.filter((r) => r.is_fake && r.fake_profile_id).map((r) => r.fake_profile_id as string)),
    );

    const nameByUser = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, name")
        .in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; name: string | null }>) {
        nameByUser.set(p.id, (p.name ?? "").split(" ")[0] || "Player");
      }
    }

    type FakeProfile = { id: string; name: string; avatar_character: string; avatar_color: string; avatar_accessory: string };
    const fakeById = new Map<string, FakeProfile>();
    if (fakeIds.length > 0) {
      const { data: fakes } = await supabaseAdmin
        .from("battle_fake_profiles")
        .select("id, name, avatar_character, avatar_color, avatar_accessory")
        .in("id", fakeIds);
      for (const f of (fakes ?? []) as FakeProfile[]) fakeById.set(f.id, f);
    }

    const entries: LeaderboardEntry[] = rows.map((r, i) => {
      if (r.is_fake && r.fake_profile_id) {
        const f = fakeById.get(r.fake_profile_id);
        return {
          rank: i + 1,
          userId: r.fake_profile_id,
          firstName: f?.name || "Player",
          animalSeed: hashSeed(r.fake_profile_id),
          colorSeed: hashSeed(r.fake_profile_id + ":c"),
          animalId: f?.avatar_character,
          color: f?.avatar_color,
          accessoryId: f?.avatar_accessory,
          isFake: true,
          questionsCorrect: r.questions_correct,
          totalTimeMs: r.total_time_ms,
          isMe: false,
        };
      }
      const uid = r.user_id ?? "";
      return {
        rank: i + 1,
        userId: uid,
        firstName: nameByUser.get(uid) || "Player",
        animalSeed: hashSeed(uid),
        colorSeed: hashSeed(uid + ":c"),
        questionsCorrect: r.questions_correct,
        totalTimeMs: r.total_time_ms,
        isMe: uid === context.userId,
      };
    });

    const mine = entries.find((e) => e.isMe);
    return { battleDate: iso, entries, myRank: mine?.rank ?? null };
  });

// Dev-only: force-regenerate today's fake leaderboard runs.
// Deletes existing fake runs for today and reinserts fresh ones.
export const devRegenerateFakeRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const iso = todayISO();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("battle_runs")
      .delete()
      .eq("battle_date", iso)
      .eq("is_fake", true);
    await ensureFakeRunsForDay(iso);
    const { count } = await supabaseAdmin
      .from("battle_runs")
      .select("*", { count: "exact", head: true })
      .eq("battle_date", iso)
      .eq("is_fake", true);
    return { battleDate: iso, inserted: count ?? 0 };
  });
