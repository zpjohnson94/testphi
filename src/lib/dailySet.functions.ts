// Universal Daily 5 selection.
//
// Reads today's `daily_sets` row (server-anchored UTC calendar date) and
// returns the 5 questions from the `questions` table in order. Falls back to
// on-the-fly generation using the same rule set as the batch generator when
// the row is missing. Falls back to the hardcoded diagnostic `QUESTIONS`
// when the bank is empty so the app keeps working before Pass 3 seeding.
//
// Per spec: Daily 5 is NOT personalized. Every free user on a given calendar
// day sees the exact same 5, in the same order. Bonus rounds stay adaptive
// and are still driven by per-user mastery in `free.functions.ts`.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { QUESTIONS, expectedSecondsFor, type Difficulty } from "./diagnostic";
import { DOMAINS, domainById, domainIdFor } from "./freeUser";

export interface DailyQuestion {
  questionId: string;
  domainId: string;
  domainLabel: string;
  difficulty: Difficulty;
  expectedSeconds: number;
  prompt: string;
  passage?: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  skill?: string;
  passageGroupId?: string | null;
  diagramGroupId?: string | null;
}

export interface DailySetResponse {
  setDate: string; // ISO YYYY-MM-DD
  questions: DailyQuestion[];
  source: "db" | "generated" | "fallback";
}

// ---- rule set (also used by the batch generator) ---------------------------

const DIFFICULTY_PATTERN: Difficulty[] = [1, 1, 2, 2, 3];

function daysSinceEpoch(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
}

// Deterministic per-date section mix: alternate 3M/2RW ↔ 2M/3RW.
function sectionPattern(iso: string): ("math" | "rw")[] {
  const day = daysSinceEpoch(iso);
  const mathHeavy = day % 2 === 0;
  // Interleaved so no two adjacent slots are the same section.
  return mathHeavy ? ["math", "rw", "math", "rw", "math"] : ["rw", "math", "rw", "math", "rw"];
}

// Deterministic 2-week domain rotation. Yields the 5 domain IDs used for a
// given date, matched positionally to `sectionPattern(iso)`.
function domainRotation(iso: string, sections: ("math" | "rw")[]): string[] {
  const mathDomains = DOMAINS.filter((d) => d.section === "math").map((d) => d.id);
  const rwDomains = DOMAINS.filter((d) => d.section === "rw").map((d) => d.id);
  const day = daysSinceEpoch(iso);
  const mathOffset = day % mathDomains.length;
  const rwOffset = day % rwDomains.length;
  let mi = 0;
  let ri = 0;
  return sections.map((s) => {
    if (s === "math") return mathDomains[(mathOffset + mi++) % mathDomains.length];
    return rwDomains[(rwOffset + ri++) % rwDomains.length];
  });
}

// ---- server function -------------------------------------------------------

export const getTodayDailySet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DailySetResponse> => {
    // Server-anchored UTC date. Workers run in UTC, so toISOString().slice(0,10)
    // is the canonical calendar date for the universal set.
    const today = new Date().toISOString().slice(0, 10);

    // 1. Read today's row.
    const { data: setRow } = await context.supabase
      .from("daily_sets")
      .select("question_ids")
      .eq("set_date", today)
      .maybeSingle();

    if (setRow?.question_ids?.length === 5) {
      const questions = await hydrateByIds(context.supabase, setRow.question_ids);
      if (questions.length === 5) return { setDate: today, questions, source: "db" };
    }

    // 2. Attempt on-the-fly generation from live bank.
    const generated = await generateForDate(context.supabase, today);
    if (generated.length === 5) {
      // Best-effort persist so every user on this date sees the same 5.
      await context.supabase
        .from("daily_sets")
        .upsert(
          { set_date: today, question_ids: generated.map((q) => q.questionId) },
          { onConflict: "set_date" },
        );
      return { setDate: today, questions: generated, source: "generated" };
    }

    // 3. Bank empty — fall back to the hardcoded diagnostic pool so the UI
    //    keeps functioning. Uses the first 5 questions; deterministic.
    return { setDate: today, questions: hardcodedFallback(), source: "fallback" };
  });

// ---- helpers ---------------------------------------------------------------

async function hydrateByIds(supabase: any, ids: string[]): Promise<DailyQuestion[]> {
  const { data } = await supabase
    .from("questions")
    .select(
      "id, domain_id, difficulty, expected_seconds, payload, passage_group_id, diagram_group_id",
    )
    .in("id", ids);
  if (!data) return [];
  const byId = new Map<string, any>(data.map((r: any) => [r.id, r]));
  const out: DailyQuestion[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) return []; // missing → treat as invalid, force regeneration
    const q = rowToDaily(r);
    if (!q) return [];
    out.push(q);
  }
  return out;
}

function rowToDaily(row: any): DailyQuestion | null {
  const p = row.payload ?? {};
  const domain = domainById(row.domain_id);
  if (!domain) return null;

  // Dual-shape adapter:
  //   NEW: { question, choices: {A,B,C,D}, correct: "A"|"B"|"C"|"D" }
  //   OLD: { prompt, choices: [...4...], correctIndex: 0..3 }
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

  return {
    questionId: row.id,
    domainId: row.domain_id,
    domainLabel: domain.label,
    difficulty: (row.difficulty as Difficulty) ?? 2,
    expectedSeconds:
      row.expected_seconds ?? expectedSecondsFor((row.difficulty as Difficulty) ?? 2),
    prompt,
    passage: typeof p.passage === "string" ? p.passage : undefined,
    choices,
    correctIndex: correctIndex as 0 | 1 | 2 | 3,
    skill: p.skill,
    passageGroupId: row.passage_group_id ?? null,
    diagramGroupId: row.diagram_group_id ?? null,
  };
}

export async function generateForDate(supabase: any, isoDate: string): Promise<DailyQuestion[]> {
  const sections = sectionPattern(isoDate);
  const targetDomains = domainRotation(isoDate, sections);
  const targetDifficulties = DIFFICULTY_PATTERN;

  // Fetch every question already used in prior daily_sets so we can exclude them.
  const { data: priorRows } = await supabase
    .from("daily_sets")
    .select("question_ids")
    .neq("set_date", isoDate);
  const used = new Set<string>();
  for (const r of priorRows ?? []) {
    for (const id of (r.question_ids ?? []) as string[]) used.add(id);
  }

  const chosen: DailyQuestion[] = [];
  const chosenIds = new Set<string>();

  for (let slot = 0; slot < 5; slot++) {
    const domainId = targetDomains[slot];
    const difficulty = targetDifficulties[slot];
    const q = await pickOne(supabase, domainId, difficulty, used, chosenIds);
    if (!q) return []; // bank too small for this slot; caller falls through
    chosen.push(q);
    chosenIds.add(q.questionId);
  }
  return chosen;
}

async function pickOne(
  supabase: any,
  domainId: string,
  difficulty: Difficulty,
  used: Set<string>,
  chosenIds: Set<string>,
): Promise<DailyQuestion | null> {
  // First pass: unused questions matching domain + difficulty.
  const tries: Array<{ excludeUsed: boolean; matchDifficulty: boolean }> = [
    { excludeUsed: true, matchDifficulty: true },
    { excludeUsed: false, matchDifficulty: true }, // recycle if exhausted
    { excludeUsed: true, matchDifficulty: false }, // relax difficulty
    { excludeUsed: false, matchDifficulty: false },
  ];
  for (const t of tries) {
    let query = supabase
      .from("questions")
      .select(
        "id, domain_id, difficulty, expected_seconds, payload, passage_group_id, diagram_group_id",
      )
      .eq("domain_id", domainId)
      .eq("is_active", true)
      .limit(50);
    if (t.matchDifficulty) query = query.eq("difficulty", difficulty);
    const { data } = await query;
    const pool = (data ?? []).filter((r: any) => {
      if (chosenIds.has(r.id)) return false;
      if (t.excludeUsed && used.has(r.id)) return false;
      return true;
    });
    if (pool.length === 0) continue;
    // Deterministic pick: sort by id, take first.
    pool.sort((a: any, b: any) => (a.id < b.id ? -1 : 1));
    const q = rowToDaily(pool[0]);
    if (q) return q;
  }
  return null;
}

function hardcodedFallback(): DailyQuestion[] {
  const out: DailyQuestion[] = [];
  for (let i = 0; i < 5 && i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const domainId = domainIdFor(q.domainLabel) ?? "math-algebra";
    const difficulty = (q.difficulty ?? 2) as Difficulty;
    out.push({
      questionId: `fallback-${q.n}`,
      domainId,
      domainLabel: q.domainLabel,
      difficulty,
      expectedSeconds: q.expectedSeconds ?? expectedSecondsFor(difficulty),
      prompt: q.prompt,
      passage: q.passage,
      choices: q.choices,
      correctIndex: q.correctIndex,
      skill: q.skill,
      passageGroupId: null,
      diagramGroupId: null,
    });
  }
  return out;
}
