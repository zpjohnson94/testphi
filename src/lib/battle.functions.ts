// Battle Mode server functions.
//
// Once-daily async race against a "ghost" (replayed run from another user).
// Fully separate from Daily 5, mastery, momentum, and predicted score.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOMAINS, domainById } from "./freeUser";
import { expectedSecondsFor, type Difficulty } from "./diagnostic";

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

  const difficulty = (row.difficulty as Difficulty) ?? 2;
  return {
    questionId: row.id,
    domainId: row.domain_id,
    domainLabel: domain.label,
    difficulty,
    expectedSeconds: row.expected_seconds ?? expectedSecondsFor(difficulty),
    prompt,
    passage: typeof p.passage === "string" ? p.passage : undefined,
    choices,
    correctIndex: correctIndex as 0 | 1 | 2 | 3,
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
  if (existing?.question_ids?.length) return existing.question_ids as string[];

  const ids = await generateBattleSet(supabase);
  if (ids.length === 0) return [];
  await supabase
    .from("battle_sets")
    .upsert({ set_date: iso, question_ids: ids }, { onConflict: "set_date" });
  return ids;
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
): Promise<{ opponent: OpponentSummary | null; firstEver: boolean }> {
  // Try today first (excluding self).
  const { data: todayRun } = await supabase
    .from("battle_runs")
    .select("id, user_id, battle_date, questions_correct, questions_wrong, total_time_ms, event_log")
    .eq("battle_date", iso)
    .neq("user_id", currentUserId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let run: any = todayRun;
  if (!run) {
    // Fall back to yesterday.
    const y = yesterdayISO(iso);
    const { data: yRun } = await supabase
      .from("battle_runs")
      .select("id, user_id, battle_date, questions_correct, questions_wrong, total_time_ms, event_log")
      .eq("battle_date", y)
      .neq("user_id", currentUserId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    run = yRun;
  }

  if (!run) {
    // Check any run anywhere → first-ever check.
    const { count } = await supabase
      .from("battle_runs")
      .select("*", { count: "exact", head: true });
    return { opponent: null, firstEver: (count ?? 0) === 0 };
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
        .select("id, questions_correct, result, daily_rank")
        .eq("user_id", context.userId)
        .eq("battle_date", iso)
        .maybeSingle(),
      countWins(context.supabase, context.userId),
    ]);
    return {
      battleDate: iso,
      alreadyCompleted: !!mine,
      myRun: mine ?? null,
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

    const { data: runs } = await supabaseAdmin
      .from("battle_runs")
      .select("user_id, questions_correct, total_time_ms")
      .eq("battle_date", iso)
      .order("questions_correct", { ascending: false })
      .order("total_time_ms", { ascending: true })
      .limit(100);

    const rows = (runs ?? []) as Array<{
      user_id: string;
      questions_correct: number;
      total_time_ms: number;
    }>;

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
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

    const entries: LeaderboardEntry[] = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      firstName: nameByUser.get(r.user_id) || "Player",
      animalSeed: hashSeed(r.user_id),
      colorSeed: hashSeed(r.user_id + ":c"),
      questionsCorrect: r.questions_correct,
      totalTimeMs: r.total_time_ms,
      isMe: r.user_id === context.userId,
    }));

    const mine = entries.find((e) => e.isMe);
    return { battleDate: iso, entries, myRank: mine?.rank ?? null };
  });
