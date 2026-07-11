// Free-user data layer implementing the TestPhi Scoring Algorithm spec.
// All numbers are mastery 0..100 (the spec's 0..1 ratio × 100), surfaced
// throughout the UI as a percent. Predicted score uses the spec's
// per-domain transform once all 8 domains are calibrated; before that
// the diagnostic score is shown.

import {
  QUESTIONS,
  loadDiag,
  scoreFor,
  timeFactor,
  type DiagQuestion,
  type Difficulty,
} from "./diagnostic";

// ---------- Constants from spec ----------

export const SCORING = {
  THRESHOLD_QUESTIONS: 5,                  // 2 diag + 3 practice
  BONUS_DIFFICULTIES: [1, 2, 3] as Difficulty[],
  MASTERY_INIT_FLOOR: 15,                  // %
  MASTERY_INIT_CEIL: 90,                   // %
  MASTERY_FLOOR: 0,
  MASTERY_CEIL: 100,
  DIFF_WEIGHTS: { 1: 1, 2: 2, 3: 3 } as Record<Difficulty, number>,
  BASE_GAIN: { 1: 1.5, 2: 2.5, 3: 4.0 } as Record<Difficulty, number>,
  BASE_LOSS: { 1: 3.0, 2: 2.0, 3: 1.0 } as Record<Difficulty, number>,
  // null = no cap / no floor
  GAIN_CEILING: { 1: 50, 2: 85, 3: null } as Record<Difficulty, number | null>,
  LOSS_FLOOR:   { 1: null, 2: 25, 3: 50 } as Record<Difficulty, number | null>,
  MOMENTUM_MIN: 1.0,
  MOMENTUM_MAX: 1.5,
  MOMENTUM_STEP: 0.05,                     // ±0.05 per calendar day
  QUALIFYING_QUESTIONS: 5,                 // questions/day to count as qualifying
  DECAY_GRACE_DAYS: 3,
  DECAY_PER_WEEK: 2,                       // %
  DECAY_FLOOR: 30,                         // %
} as const;

// ---------- Domains ----------

export const DOMAINS: { id: string; label: string; section: "math" | "rw" }[] = [
  { id: "math-algebra", label: "Math · Algebra", section: "math" },
  { id: "math-advanced", label: "Math · Advanced Math", section: "math" },
  { id: "math-data", label: "Math · Problem-Solving & Data", section: "math" },
  { id: "math-geo", label: "Math · Geometry & Trig", section: "math" },
  { id: "rw-info", label: "R&W · Information & Ideas", section: "rw" },
  { id: "rw-craft", label: "R&W · Craft & Structure", section: "rw" },
  { id: "rw-expr", label: "R&W · Expression of Ideas", section: "rw" },
  { id: "rw-conv", label: "R&W · Standard English Conventions", section: "rw" },
];

const LABEL_TO_ID = new Map(DOMAINS.map((d) => [d.label, d.id]));

export function domainIdFor(label: string): string | null {
  return LABEL_TO_ID.get(label) ?? null;
}

export function domainById(id: string) {
  return DOMAINS.find((d) => d.id === id);
}

// ---------- State ----------

export interface BatchEntry {
  difficulty: Difficulty;
  correct: boolean;
  timeFactor: number;
}

export interface DomainStat {
  answered: number;            // total questions answered in this domain (diag + practice + bonus)
  initialized: boolean;        // mastery has been initialized via the batch formula
  mastery: number;             // 0..100; meaningless until initialized
  lastAnsweredISO: string;     // for decay tracking
  batch: BatchEntry[];         // up to 8 entries used for one-time mastery init
  bonusStep: 0 | 1 | 2 | 3;    // 0..3 bonus questions completed
}

export interface SessionResult {
  n: number;                    // 1..5 ordinal within the session
  questionId?: string;          // real bank ID (falls back to String(n) if absent)
  domainId: string;
  difficulty: Difficulty;
  correct: boolean;
  elapsedSeconds: number;
  isBonus?: boolean;
}

export interface DomainDiff {
  domainId: string;
  wasInitialized: boolean;
  nowInitialized: boolean;
  justUnlocked: boolean;
  prevAnswered: number;
  newAnswered: number;
  prevMastery: number;
  newMastery: number;
  baseGain: number;
  actualGain: number;
  bonusUnlockedThisSession: boolean;
}

export interface LastSession {
  date: string;
  results: SessionResult[];
  prevOverall: number;
  newOverall: number;
  delta: number;
  domainDiffs: DomainDiff[];
  momentumBefore: number;
  momentumAfter: number;
  momentumIncreased: boolean;
  streakBefore: number;
  streakAfter: number;
  streakIncreased: boolean;
  wasCalibrated: boolean;
  nowCalibrated: boolean;
  calibrationMilestone: boolean;
}

export interface FreeState {
  name: string;
  email: string;
  plan: "free" | "powerup";
  seeded: boolean;
  diagnosticScore: number;                 // 400..1600, snapshot from /diagnostic
  domainStats: Record<string, DomainStat>;
  momentumNeedle: number;                  // 0..10 (multiplier = 1 + 0.05 × needle)
  lastMomentumDateISO: string;             // last date momentum was updated
  qualifyingDays: string[];                // ISO dates with ≥5 non-diag questions
  streak: number;
  lastDailyDate: string;                   // ISO date of last completed Daily 5
  lastSession: LastSession | null;
  // Derived snapshots kept on the state for read convenience.
  domainScores: Record<string, number>;    // mastery 0..100 per domain
  overall: number;                         // predicted SAT score 400..1600
}

const KEY = "testphi:free:v2";
const LEGACY_KEY = "testphi:free:v1";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoMinusDays(iso: string, days: number): string {
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

function emptyDomainStat(): DomainStat {
  return {
    answered: 0,
    initialized: false,
    mastery: 0,
    lastAnsweredISO: "",
    batch: [],
    bonusStep: 0,
  };
}

function defaultState(): FreeState {
  const stats: Record<string, DomainStat> = {};
  const scores: Record<string, number> = {};
  for (const d of DOMAINS) {
    stats[d.id] = emptyDomainStat();
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

// ---------- Predicted Score ----------

// Domain Score = 50 + 150 × (mastery/100)^1.4 → 50..200.
function domainScore(masteryPct: number): number {
  const m = Math.max(0, Math.min(100, masteryPct)) / 100;
  return 50 + 150 * Math.pow(m, 1.4);
}

function computePredicted(state: FreeState): number {
  const allInit = DOMAINS.every((d) => state.domainStats[d.id]?.initialized);
  if (!allInit) {
    return state.diagnosticScore || 800;
  }
  let total = 0;
  for (const d of DOMAINS) {
    total += domainScore(state.domainStats[d.id].mastery);
  }
  return Math.max(400, Math.min(1600, Math.round(total / 10) * 10));
}

export function sectionScore(state: FreeState, section: "math" | "rw"): number {
  const allInit = DOMAINS.every((d) => state.domainStats[d.id]?.initialized);
  if (allInit) {
    const ids = DOMAINS.filter((d) => d.section === section).map((d) => d.id);
    const sum = ids.reduce((acc, id) => acc + domainScore(state.domainStats[id].mastery), 0);
    return Math.max(200, Math.min(800, Math.round(sum / 10) * 10));
  }
  // Pre-calibration: split diagnostic score 50/50.
  return Math.round(state.diagnosticScore / 2 / 10) * 10;
}

// ---------- Migration / seeding ----------

// Seed per-domain `answered` and per-question batch entries from the diagnostic.
// Diagnostic questions count toward the 5-question threshold and contribute to
// the batch initialization, but do NOT individually update mastery.
function seedFromDiagnostic(state: FreeState): FreeState {
  const diag = loadDiag();
  const next: FreeState = {
    ...state,
    name: state.name || diag.name || "",
    seeded: true,
  };
  next.diagnosticScore = scoreFor(diag).total;
  for (const a of diag.answers) {
    const q = QUESTIONS.find((qq) => qq.n === a.n);
    if (!q) continue;
    const id = domainIdFor(q.domainLabel);
    if (!id) continue;
    const stat = next.domainStats[id];
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
  next.overall = computePredicted(next);
  return next;
}

function migrateLegacy(raw: string): FreeState | null {
  try {
    const old = JSON.parse(raw);
    const base = defaultState();
    base.name = old.name ?? "";
    base.email = old.email ?? "";
    base.plan = old.plan ?? "free";
    base.streak = old.streak ?? 0;
    base.lastDailyDate = old.lastDailyDate ?? "";
    base.diagnosticScore = old.overall ?? 800;
    if (old.domainScores && typeof old.domainScores === "object") {
      for (const d of DOMAINS) {
        const m = Number(old.domainScores[d.id]);
        if (Number.isFinite(m)) {
          base.domainStats[d.id].mastery = m;
          base.domainScores[d.id] = m;
          // Legacy users won't have proper batch data; leave initialized=false
          // so the spec's threshold flow still runs for them.
        }
      }
    }
    base.overall = computePredicted(base);
    return base;
  } catch {
    return null;
  }
}

// ---------- Decay ----------

function applyDecayInPlace(state: FreeState) {
  const today = todayISO();
  for (const d of DOMAINS) {
    const stat = state.domainStats[d.id];
    if (!stat || !stat.initialized || !stat.lastAnsweredISO) continue;
    const idle = daysBetween(stat.lastAnsweredISO, today);
    if (idle <= SCORING.DECAY_GRACE_DAYS) continue;
    const weeks = (idle - SCORING.DECAY_GRACE_DAYS) / 7;
    const loss = SCORING.DECAY_PER_WEEK * weeks;
    stat.mastery = Math.max(SCORING.DECAY_FLOOR, stat.mastery - loss);
  }
}

// ---------- Momentum ----------

function recomputeMomentum(state: FreeState) {
  const today = todayISO();
  const last = state.lastMomentumDateISO || today;
  const idleDays = daysBetween(last, today);
  let needle = state.momentumNeedle;
  // We've already credited qualifying days at session-complete time, so here
  // we only decay for days with no qualifying session since `last`.
  const qualifiedDays = new Set(state.qualifyingDays);
  for (let i = 1; i <= idleDays; i++) {
    const day = isoMinusDays(today, idleDays - i);
    if (!qualifiedDays.has(day)) {
      needle = Math.max(0, needle - 1); // −0.05 multiplier = −1 needle tick
    }
  }
  state.momentumNeedle = Math.max(0, Math.min(10, needle));
  state.lastMomentumDateISO = today;
}

function momentumMultiplier(state: FreeState): number {
  const m = SCORING.MOMENTUM_MIN + state.momentumNeedle * SCORING.MOMENTUM_STEP;
  return Math.max(SCORING.MOMENTUM_MIN, Math.min(SCORING.MOMENTUM_MAX, m));
}

// ---------- Persistence ----------

export function loadFree(): FreeState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FreeState;
      const merged: FreeState = { ...defaultState(), ...parsed };
      // Repair domainStats if shape drifted.
      for (const d of DOMAINS) {
        merged.domainStats[d.id] = {
          ...emptyDomainStat(),
          ...(merged.domainStats?.[d.id] ?? {}),
        };
        merged.domainScores[d.id] = merged.domainStats[d.id].mastery;
      }
      applyDecayInPlace(merged);
      recomputeMomentum(merged);
      merged.overall = computePredicted(merged);
      syncSnapshots(merged);
      return merged;
    }
    // Try legacy v1 → v2 migration.
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const migrated = migrateLegacy(legacyRaw);
      if (migrated) {
        const seeded = seedFromDiagnostic(migrated);
        syncSnapshots(seeded);
        saveFree(seeded);
        return seeded;
      }
    }
  } catch {}
  // First-ever load: seed from diagnostic if it's been completed.
  const fresh = seedFromDiagnostic(defaultState());
  syncSnapshots(fresh);
  saveFree(fresh);
  return fresh;
}

function syncSnapshots(s: FreeState) {
  for (const d of DOMAINS) {
    s.domainScores[d.id] = s.domainStats[d.id].mastery;
  }
  s.overall = computePredicted(s);
}

export function saveFree(s: FreeState) {
  if (typeof window === "undefined") return;
  syncSnapshots(s);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

// ---------- Daily 5 selection ----------

// Daily 5 selection now lives server-side in `src/lib/dailySet.functions.ts`.
// It reads the universal `daily_sets` row per calendar date and is not
// personalized. Bonus-round selection stays adaptive and is handled per
// domain via `isBonusQuestionFor` / `nextBonusDifficulty` below.


export function hasCompletedToday(s: FreeState): boolean {
  return s.lastDailyDate === todayISO();
}

// Is this question being served as part of an unfinished bonus round for the
// given domain? The caller uses this both to label the UI and to stamp the
// SessionResult with `isBonus`.
export function isBonusQuestionFor(state: FreeState, domainId: string): boolean {
  const st = state.domainStats[domainId];
  if (!st) return false;
  return !st.initialized && st.answered >= SCORING.THRESHOLD_QUESTIONS && st.bonusStep < 3;
}

export function nextBonusDifficulty(state: FreeState, domainId: string): Difficulty {
  const st = state.domainStats[domainId];
  const step = st?.bonusStep ?? 0;
  return (SCORING.BONUS_DIFFICULTIES[step] ?? 2) as Difficulty;
}

// ---------- Mastery update ----------

// Spec Mastery Initialization (Batch):
//   question_score = difficulty_weight × time_factor   [if correct, else 0]
//   question_max   = difficulty_weight × 1.25
//   ratio          = Σ question_score / Σ question_max
//   mastery_init   = 0.15 + 0.75 × ratio^0.7  → clamp [0.15, 0.90]
function initializeMastery(batch: BatchEntry[]): number {
  if (batch.length === 0) return SCORING.MASTERY_INIT_FLOOR;
  let scoreSum = 0;
  let maxSum = 0;
  for (const e of batch) {
    const w = SCORING.DIFF_WEIGHTS[e.difficulty];
    maxSum += w * 1.25;
    if (e.correct) scoreSum += w * e.timeFactor;
  }
  const ratio = maxSum === 0 ? 0 : scoreSum / maxSum;
  const m = 0.15 + 0.75 * Math.pow(Math.max(0, ratio), 0.7);
  const pct = m * 100;
  return Math.max(SCORING.MASTERY_INIT_FLOOR, Math.min(SCORING.MASTERY_INIT_CEIL, pct));
}

// Spec Post-Initialization deltas with ceilings/floors.
function deltaFor(
  mastery: number,
  difficulty: Difficulty,
  correct: boolean,
  tf: number,
  momentum: number,
): number {
  if (correct) {
    const ceiling = SCORING.GAIN_CEILING[difficulty];
    if (ceiling !== null && mastery >= ceiling) return 0;
    const scale = Math.sqrt(Math.max(0, 1 - mastery / 100));
    return SCORING.BASE_GAIN[difficulty] * scale * tf * momentum;
  }
  const floor = SCORING.LOSS_FLOOR[difficulty];
  if (floor !== null && mastery <= floor) return 0;
  return -SCORING.BASE_LOSS[difficulty] * tf;
}

// Apply a single answered question to the state. Returns base + actual gain
// contribution for the diff (post-init only; pre-init returns 0).
function applyOneResult(
  state: FreeState,
  r: SessionResult,
): { base: number; actual: number } {
  const stat = state.domainStats[r.domainId];
  if (!stat) return { base: 0, actual: 0 };
  const tf = timeFactor(r.correct, r.elapsedSeconds, expectedSecondsForDifficulty(r.difficulty));

  stat.answered += 1;
  stat.lastAnsweredISO = todayISO();

  if (!stat.initialized) {
    stat.batch.push({ difficulty: r.difficulty, correct: r.correct, timeFactor: tf });
    if (r.isBonus) stat.bonusStep = Math.min(3, stat.bonusStep + 1) as 0 | 1 | 2 | 3;
    if (stat.bonusStep >= 3 || stat.batch.length >= 8) {
      stat.mastery = initializeMastery(stat.batch);
      stat.initialized = true;
    }
    return { base: 0, actual: 0 };
  }

  const momentum = momentumMultiplier(state);
  const base = deltaFor(stat.mastery, r.difficulty, r.correct, tf, 1);
  const actual = deltaFor(stat.mastery, r.difficulty, r.correct, tf, momentum);
  const prev = stat.mastery;
  stat.mastery = Math.max(
    SCORING.MASTERY_FLOOR,
    Math.min(SCORING.MASTERY_CEIL, stat.mastery + actual),
  );
  return { base, actual: stat.mastery - prev };
}

function expectedSecondsForDifficulty(d: Difficulty): number {
  if (d === 1) return 30;
  if (d === 3) return 90;
  return 60;
}


function yesterdayISO() {
  return isoMinusDays(todayISO(), 1);
}

// Apply a completed session. Updates mastery, momentum, streak, snapshots,
// and stores a rich LastSession diff for the post-session screen.
export function applySession(prev: FreeState, results: SessionResult[]): FreeState {
  const next: FreeState = JSON.parse(JSON.stringify(prev));
  const prevOverall = prev.overall;
  const wasCalibrated = isCalibrated(prev);

  // Snapshot per-domain pre-state for diffing.
  const pre: Record<string, { answered: number; mastery: number; initialized: boolean; bonusStep: number }> = {};
  for (const d of DOMAINS) {
    const s = prev.domainStats[d.id];
    pre[d.id] = {
      answered: s?.answered ?? 0,
      mastery: s?.mastery ?? 0,
      initialized: s?.initialized ?? false,
      bonusStep: s?.bonusStep ?? 0,
    };
  }

  const baseByDomain: Record<string, number> = {};
  const actualByDomain: Record<string, number> = {};
  for (const r of results) {
    const { base, actual } = applyOneResult(next, r);
    baseByDomain[r.domainId] = (baseByDomain[r.domainId] ?? 0) + base;
    actualByDomain[r.domainId] = (actualByDomain[r.domainId] ?? 0) + actual;
  }

  // Clamp newly-initialized domains to the initial mastery ceiling so the
  // first score revealed on unlock never exceeds 90%.
  for (const d of DOMAINS) {
    const p = pre[d.id];
    const s = next.domainStats[d.id];
    if (!p.initialized && s.initialized) {
      s.mastery = Math.min(s.mastery, SCORING.MASTERY_INIT_CEIL);
    }
  }


  // Streak
  const td = todayISO();
  const streakBefore = next.streak;
  let streak = next.streak;
  if (results.length >= SCORING.QUALIFYING_QUESTIONS && next.lastDailyDate !== td) {
    if (next.lastDailyDate === yesterdayISO()) streak += 1;
    else streak = 1;
  }
  next.streak = streak;
  if (results.length >= SCORING.QUALIFYING_QUESTIONS) next.lastDailyDate = td;

  // Momentum
  const momentumBefore = prev.momentumNeedle;
  if (results.length >= SCORING.QUALIFYING_QUESTIONS) {
    if (!next.qualifyingDays.includes(td)) {
      next.qualifyingDays = [...next.qualifyingDays, td].slice(-30);
      next.momentumNeedle = Math.min(10, next.momentumNeedle + 1);
    }
    next.lastMomentumDateISO = td;
  }

  syncSnapshots(next);

  const nowCalibrated = isCalibrated(next);
  const domainDiffs: DomainDiff[] = DOMAINS.map((d) => {
    const p = pre[d.id];
    const s = next.domainStats[d.id];
    const justUnlocked = !p.initialized && s.initialized;
    const bonusUnlocked = !p.initialized && s.answered >= SCORING.THRESHOLD_QUESTIONS && p.answered < SCORING.THRESHOLD_QUESTIONS;
    return {
      domainId: d.id,
      wasInitialized: p.initialized,
      nowInitialized: s.initialized,
      justUnlocked,
      prevAnswered: p.answered,
      newAnswered: s.answered,
      prevMastery: p.mastery,
      newMastery: s.mastery,
      baseGain: baseByDomain[d.id] ?? 0,
      actualGain: actualByDomain[d.id] ?? 0,
      bonusUnlockedThisSession: bonusUnlocked,
    };
  }).filter((d) => d.newAnswered > d.prevAnswered);

  next.lastSession = {
    date: td,
    results,
    prevOverall,
    newOverall: next.overall,
    delta: next.overall - prevOverall,
    domainDiffs,
    momentumBefore,
    momentumAfter: next.momentumNeedle,
    momentumIncreased: next.momentumNeedle > momentumBefore,
    streakBefore,
    streakAfter: next.streak,
    streakIncreased: next.streak > streakBefore,
    wasCalibrated,
    nowCalibrated,
    calibrationMilestone: !wasCalibrated && nowCalibrated,
  };
  return next;
}

export function isCalibrated(s: FreeState): boolean {
  return DOMAINS.every((d) => s.domainStats[d.id]?.initialized);
}

export function momentumNeedleOf(s: FreeState): number {
  return s.momentumNeedle;
}

export function momentumMultiplierOf(s: FreeState): number {
  return momentumMultiplier(s);
}

export function bonusStepOf(s: FreeState, domainId: string): number {
  return s.domainStats[domainId]?.bonusStep ?? 0;
}



// ---------- Mastery → category (for Domains) ----------

export type Tier = "weak" | "developing" | "strong" | "locked";

export function tierOf(mastery: number, initialized = true): Tier {
  if (!initialized) return "locked";
  if (mastery < 45) return "weak";
  if (mastery < 70) return "developing";
  return "strong";
}

export function tierColor(t: Tier): string {
  if (t === "weak") return "#ff4d6d";
  if (t === "developing") return "#FFE600";
  if (t === "locked") return "rgba(246,240,250,0.45)";
  return "#B8FF00";
}

export function tierLabel(t: Tier): string {
  if (t === "weak") return "Weak spot";
  if (t === "developing") return "Developing";
  if (t === "locked") return "Not yet calibrated";
  return "Strength";
}

// ---------- Headlines ----------

export const POSITIVE_HEADLINES = [
  "Nice work, {name}.",
  "Locked in, {name}.",
  "You're climbing, {name}.",
  "Sharp session, {name}.",
  "That's how it's done, {name}.",
  "Momentum, {name}.",
  "Big moves, {name}.",
  "Score's heading up, {name}.",
  "Keep stacking wins, {name}.",
  "Solid run, {name}.",
];

export const NEGATIVE_HEADLINES = [
  "Nice try, {name}.",
  "Tomorrow's another shot, {name}.",
  "Shake it off, {name}.",
  "Tough one, {name}.",
  "Every rep counts, {name}.",
  "Stick with it, {name}.",
  "Off day, not off track, {name}.",
  "Back at it tomorrow, {name}.",
  "Progress isn't linear, {name}.",
  "Don't sweat it, {name}.",
];

export function pickHeadline(positive: boolean, name: string): string {
  const list = positive ? POSITIVE_HEADLINES : NEGATIVE_HEADLINES;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx].replace("{name}", name || "champ");
}
