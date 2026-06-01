// Free-user data layer: per-domain mastery, predicted SAT score,
// Daily 5 selection, streak tracking, and the scoring update applied
// after each Daily 5 session.

import { QUESTIONS, type DiagQuestion, loadDiag } from "./diagnostic";

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

export interface SessionResult {
  n: number;
  domainId: string;
  correct: boolean;
  elapsedSeconds: number;
}

export interface LastSession {
  date: string;
  results: SessionResult[];
  prevOverall: number;
  newOverall: number;
  delta: number;
}

export interface FreeState {
  name: string;
  email: string;
  plan: "free" | "powerup";
  seeded: boolean;
  domainScores: Record<string, number>; // 0..100 mastery
  overall: number; // 400..1600
  streak: number;
  lastDailyDate: string; // ISO date "YYYY-MM-DD" of last completed Daily 5
  lastSession: LastSession | null;
}

const KEY = "testphi:free:v1";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultScores(): Record<string, number> {
  const r: Record<string, number> = {};
  for (const d of DOMAINS) r[d.id] = 40;
  return r;
}

function seedFromDiag(): { scores: Record<string, number>; name: string } {
  const diag = loadDiag();
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const a of diag.answers) {
    const q = QUESTIONS.find((qq) => qq.n === a.n);
    if (!q) continue;
    const id = domainIdFor(q.domainLabel);
    if (!id) continue;
    const cur = buckets.get(id) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.correct) cur.correct += 1;
    buckets.set(id, cur);
  }
  const scores = defaultScores();
  for (const [id, b] of buckets.entries()) {
    if (b.total === 0) continue;
    const ratio = b.correct / b.total;
    scores[id] = Math.round(ratio * 70 + 15); // 15..85
  }
  return { scores, name: diag.name || "" };
}

export function computeOverall(scores: Record<string, number>): number {
  const mathAvg = avg(DOMAINS.filter((d) => d.section === "math").map((d) => scores[d.id] ?? 40));
  const rwAvg = avg(DOMAINS.filter((d) => d.section === "rw").map((d) => scores[d.id] ?? 40));
  const mathSec = 200 + (mathAvg / 100) * 600;
  const rwSec = 200 + (rwAvg / 100) * 600;
  const total = Math.round((mathSec + rwSec) / 10) * 10;
  return Math.max(400, Math.min(1600, total));
}

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function defaultState(): FreeState {
  const scores = defaultScores();
  return {
    name: "",
    email: "",
    plan: "free",
    seeded: false,
    domainScores: scores,
    overall: computeOverall(scores),
    streak: 0,
    lastDailyDate: "",
    lastSession: null,
  };
}

export function loadFree(): FreeState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FreeState;
      return { ...defaultState(), ...parsed };
    }
  } catch {}
  // Seed from diagnostic on first load.
  const { scores, name } = seedFromDiag();
  const s: FreeState = {
    name,
    email: "",
    plan: "free",
    seeded: true,
    domainScores: scores,
    overall: computeOverall(scores),
    streak: 0,
    lastDailyDate: "",
    lastSession: null,
  };
  saveFree(s);
  return s;
}

export function saveFree(s: FreeState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

// ---------- Daily 5 selection ----------

function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function pickDailyQuestions(): DiagQuestion[] {
  // Rotate through QUESTIONS deterministically by day.
  const offset = (dayOfYear() * 5) % QUESTIONS.length;
  const out: DiagQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    out.push(QUESTIONS[(offset + i) % QUESTIONS.length]);
  }
  return out;
}

export function hasCompletedToday(s: FreeState): boolean {
  return s.lastDailyDate === todayISO();
}

// ---------- Score update ----------

function timeMul(correct: boolean, elapsed: number, expected: number): number {
  const slow = elapsed > expected;
  if (correct) return slow ? 0.75 : 1.2;
  return slow ? 1.4 : 1.0;
}

export function applySession(prev: FreeState, results: SessionResult[]): FreeState {
  const scores = { ...prev.domainScores };
  for (const r of results) {
    const q = QUESTIONS.find((qq) => qq.n === r.n);
    if (!q) continue;
    const mastery = scores[r.domainId] ?? 40;
    const tm = timeMul(r.correct, r.elapsedSeconds, q.expectedSeconds);
    let delta: number;
    if (r.correct) {
      // Stronger move when mastery is low; tiny when already high.
      delta = (100 - mastery) * 0.12 * tm;
    } else {
      // Stronger penalty when mastery is high (regression) capped.
      delta = -(3 + mastery * 0.06) * tm;
    }
    scores[r.domainId] = Math.max(0, Math.min(100, mastery + delta));
  }
  const prevOverall = prev.overall;
  const newOverall = computeOverall(scores);
  const td = todayISO();
  let streak = prev.streak;
  if (prev.lastDailyDate === yesterdayISO()) streak += 1;
  else if (prev.lastDailyDate !== td) streak = 1;
  return {
    ...prev,
    domainScores: scores,
    overall: newOverall,
    streak,
    lastDailyDate: td,
    lastSession: {
      date: td,
      results,
      prevOverall,
      newOverall,
      delta: newOverall - prevOverall,
    },
  };
}

// ---------- Mastery → category ----------

export type Tier = "weak" | "developing" | "strong";

export function tierOf(mastery: number): Tier {
  if (mastery < 45) return "weak";
  if (mastery < 70) return "developing";
  return "strong";
}

export function tierColor(t: Tier): string {
  if (t === "weak") return "#ff4d6d";
  if (t === "developing") return "#FFE600";
  return "#B8FF00";
}

export function tierLabel(t: Tier): string {
  if (t === "weak") return "Weak spot";
  if (t === "developing") return "Developing";
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
