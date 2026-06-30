// Diagnostic test data, scoring, and persistent state.
// Client-only — questions are hardcoded for MVP.

export type Section = "math" | "rw";

export type Difficulty = 1 | 2 | 3; // 1 = Easy, 2 = Medium, 3 = Hard

export interface DiagQuestion {
  n: number;
  section: Section;
  domainLabel: string;     // e.g. "Math · Algebra"
  skill: string;           // short skill name for breakdown
  expectedSeconds: number;
  correctWeight: number;
  incorrectWeight: number;
  difficulty?: Difficulty; // optional; defaults to Medium (2). Per spec all diagnostic questions are Medium.
  prompt: string;
  passage?: string;        // optional short passage shown above prompt
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

// Per-spec time factor tables (Section "Time Factor").
export function timeFactor(correct: boolean, actualSeconds: number, expectedSeconds: number): number {
  const ratio = expectedSeconds > 0 ? actualSeconds / expectedSeconds : 1;
  if (correct) {
    if (ratio < 0.5) return 1.25;
    if (ratio < 0.75) return 1.1;
    if (ratio < 1.25) return 1.0;
    if (ratio < 1.75) return 0.85;
    return 0.7;
  }
  if (ratio < 0.75) return 0.8;
  if (ratio < 1.25) return 1.0;
  return 1.3;
}

export function expectedSecondsFor(difficulty: Difficulty): number {
  if (difficulty === 1) return 30;
  if (difficulty === 3) return 90;
  return 60;
}

export const QUESTIONS: DiagQuestion[] = [
  {
    n: 1, section: "math", domainLabel: "Math · Algebra", skill: "Linear Equations",
    expectedSeconds: 60, correctWeight: 28, incorrectWeight: 20,
    prompt: "If 3x + 7 = 22, what is the value of x?",
    choices: ["3", "5", "7", "9"], correctIndex: 1,
  },
  {
    n: 2, section: "rw", domainLabel: "R&W · Information & Ideas", skill: "Main Idea",
    expectedSeconds: 75, correctWeight: 28, incorrectWeight: 20,
    passage: "Climate scientists rely on a mix of satellite imagery, ocean buoys, and ice-core samples to track how Earth's climate has shifted over decades and centuries. By weaving these data sources together, researchers build models that reveal long-term patterns rather than short-term noise.",
    prompt: "Which choice best states the main purpose of the text?",
    choices: [
      "To warn readers about climate dangers",
      "To explain how scientists study climate patterns",
      "To argue for immediate policy change",
      "To compare two scientific theories",
    ], correctIndex: 1,
  },
  {
    n: 3, section: "math", domainLabel: "Math · Algebra", skill: "Systems of Equations",
    expectedSeconds: 75, correctWeight: 24, incorrectWeight: 16,
    prompt: "If 2x + y = 10 and x − y = 2, what is the value of x?",
    choices: ["2", "3", "4", "5"], correctIndex: 2,
  },
  {
    n: 4, section: "rw", domainLabel: "R&W · Craft & Structure", skill: "Words in Context",
    expectedSeconds: 45, correctWeight: 22, incorrectWeight: 15,
    passage: "Her notes were meticulous — every margin filled with cross-references, every figure double-checked against the source.",
    prompt: "As used in the text, what does the word \"meticulous\" most nearly mean?",
    choices: ["Careless", "Thorough", "Hasty", "Ambitious"], correctIndex: 1,
  },
  {
    n: 5, section: "math", domainLabel: "Math · Advanced Math", skill: "Quadratic Equations",
    expectedSeconds: 90, correctWeight: 30, incorrectWeight: 22,
    prompt: "Which of the following is a solution to x² − 5x + 6 = 0?",
    choices: ["x = 1", "x = 2", "x = 4", "x = 5"], correctIndex: 1,
  },
  {
    n: 6, section: "rw", domainLabel: "R&W · Information & Ideas", skill: "Command of Evidence",
    expectedSeconds: 90, correctWeight: 26, incorrectWeight: 18,
    passage: "A profile of a long-distance runner emphasizes how she returned to training after each injury and continued chasing qualifying times that most peers had given up on.",
    prompt: "Which quotation best supports the conclusion that the author values perseverance?",
    choices: [
      "\"She continued despite every setback.\"",
      "\"The results were surprising to everyone.\"",
      "\"Most researchers disagree on this point.\"",
      "\"The timeline was longer than expected.\"",
    ], correctIndex: 0,
  },
  {
    n: 7, section: "math", domainLabel: "Math · Problem-Solving & Data", skill: "Ratios & Proportions",
    expectedSeconds: 60, correctWeight: 24, incorrectWeight: 16,
    prompt: "A recipe uses 3 cups of flour for every 2 cups of sugar. How many cups of flour are needed for 5 cups of sugar?",
    choices: ["6.5", "7", "7.5", "8"], correctIndex: 2,
  },
  {
    n: 8, section: "rw", domainLabel: "R&W · Expression of Ideas", skill: "Transitions",
    expectedSeconds: 45, correctWeight: 22, incorrectWeight: 15,
    prompt: "The experiment failed on the first attempt. ______, the team revised their approach and succeeded.",
    choices: ["Therefore", "However", "Meanwhile", "Similarly"], correctIndex: 1,
  },
  {
    n: 9, section: "math", domainLabel: "Math · Problem-Solving & Data", skill: "Data Interpretation",
    expectedSeconds: 75, correctWeight: 26, incorrectWeight: 18,
    passage: "Sales by year (units): 2020 → 100, 2021 → 120, 2022 → 180, 2023 → 200.",
    prompt: "Which year showed the greatest percent increase from the previous year?",
    choices: ["2020", "2021", "2022", "2023"], correctIndex: 2,
  },
  {
    n: 10, section: "rw", domainLabel: "R&W · Standard English Conventions", skill: "Punctuation",
    expectedSeconds: 45, correctWeight: 20, incorrectWeight: 14,
    prompt: "The scientist published her findings ______ the results surprised the entire research community.",
    choices: ["and", "; however,", "because", "although"], correctIndex: 1,
  },
  {
    n: 11, section: "math", domainLabel: "Math · Advanced Math", skill: "Exponential Functions",
    expectedSeconds: 90, correctWeight: 28, incorrectWeight: 20,
    prompt: "A population doubles every 3 years. If it starts at 500, what is the population after 9 years?",
    choices: ["2000", "3000", "4000", "4500"], correctIndex: 2,
  },
  {
    n: 12, section: "rw", domainLabel: "R&W · Craft & Structure", skill: "Author's Purpose",
    expectedSeconds: 75, correctWeight: 24, incorrectWeight: 16,
    passage: "In an essay about climate, the author writes that average global temperatures have climbed by more than 1.1°C since 1880, framing the figure as the centerpiece of her argument that warming is accelerating.",
    prompt: "The author includes the statistic about rising temperatures primarily to…",
    choices: [
      "Entertain with surprising facts",
      "Provide evidence strengthening the central argument",
      "Introduce a counterargument",
      "Explain the history of climate research",
    ], correctIndex: 1,
  },
  {
    n: 13, section: "math", domainLabel: "Math · Geometry & Trig", skill: "Geometry: Area & Angles",
    expectedSeconds: 75, correctWeight: 22, incorrectWeight: 15,
    prompt: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
    choices: ["10", "11", "12", "14"], correctIndex: 0,
  },
  {
    n: 14, section: "rw", domainLabel: "R&W · Standard English Conventions", skill: "Subject-Verb Agreement",
    expectedSeconds: 45, correctWeight: 20, incorrectWeight: 14,
    prompt: "Neither the students nor the teacher ______ aware of the schedule change.",
    choices: ["were", "are", "was", "have been"], correctIndex: 2,
  },
  {
    n: 15, section: "math", domainLabel: "Math · Advanced Math", skill: "Nonlinear Functions & Graphs",
    expectedSeconds: 90, correctWeight: 30, incorrectWeight: 22,
    prompt: "The function f(x) = x² − 4x + 3 equals zero at two points. What are those values of x?",
    choices: ["x = 1 and x = 3", "x = −1 and x = −3", "x = 2 and x = 4", "x = 0 and x = 4"], correctIndex: 0,
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;

export interface AnswerRecord {
  n: number;
  choice: number;          // 0..3
  correct: boolean;
  elapsedSeconds: number;
}

export interface DiagState {
  name: string;
  emoji: string;           // legacy emoji (kept for back-compat)
  avatarId: string;        // illustrated avatar id (see AVATAR_OPTIONS)
  color: string;           // hex — ring color
  startedAt: number | null;
  answers: AnswerRecord[]; // length 0..15
}

const KEY = "testphi:diag:v1";

export function loadDiag(): DiagState {
  if (typeof window === "undefined") return defaultDiag();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultDiag();
    return { ...defaultDiag(), ...JSON.parse(raw) };
  } catch {
    return defaultDiag();
  }
}

export function saveDiag(s: DiagState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function defaultDiag(): DiagState {
  return { name: "", emoji: "🦊", avatarId: "fox", color: "#B8FF00", startedAt: null, answers: [] };
}

export function clearDiag() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(KEY); } catch {}
}

// --- Scoring ---

export interface Subscores {
  math: number;            // raw points (centered around 500)
  rw: number;
  total: number;           // rounded to nearest 10, 400..1600
  mathScaled: number;      // 200..800
  rwScaled: number;        // 200..800
  percentile: string;      // human label
}

const MAX_MATH_POINTS = QUESTIONS.filter(q => q.section === "math").reduce((s, q) => s + q.correctWeight, 0);
const MAX_RW_POINTS = QUESTIONS.filter(q => q.section === "rw").reduce((s, q) => s + q.correctWeight, 0);

function pointsForAnswer(q: DiagQuestion, a: AnswerRecord): number {
  if (a.correct && a.elapsedSeconds > q.expectedSeconds) return q.correctWeight * 0.7;
  if (a.correct) return q.correctWeight;
  return -q.incorrectWeight;
}

function scaleToSection(pointsFromBaseline: number, max: number): number {
  // Baseline 500. Full credit on every question maps to 800. -max maps to ~200.
  const scaled = 500 + (pointsFromBaseline / max) * 300;
  return Math.max(200, Math.min(800, scaled));
}

export function scoreFor(state: DiagState): Subscores {
  let mathPts = 0, rwPts = 0;
  for (const a of state.answers) {
    const q = QUESTIONS.find(qq => qq.n === a.n);
    if (!q) continue;
    const p = pointsForAnswer(q, a);
    if (q.section === "math") mathPts += p; else rwPts += p;
  }
  const mathScaled = scaleToSection(mathPts, MAX_MATH_POINTS);
  const rwScaled = scaleToSection(rwPts, MAX_RW_POINTS);
  const totalRaw = mathScaled + rwScaled;
  const total = Math.max(400, Math.min(1600, Math.round(totalRaw / 10) * 10));
  return {
    math: mathPts, rw: rwPts, total,
    mathScaled: Math.round(mathScaled / 10) * 10,
    rwScaled: Math.round(rwScaled / 10) * 10,
    percentile: percentileLabel(total),
  };
}

export function percentileLabel(score: number): string {
  if (score >= 1560) return "Top 1% nationally";
  if (score >= 1500) return "Top 1% nationally";
  if (score >= 1400) return "Top 4% nationally";
  if (score >= 1300) return "Top 9% nationally";
  if (score >= 1200) return "Top 26% nationally";
  if (score >= 1100) return "Top 40% nationally";
  if (score >= 1000) return "Top 60% nationally";
  if (score >= 900) return "Top 73% nationally";
  if (score >= 800) return "Top 90% nationally";
  return "Bottom 10% nationally";
}

// Group skills into Strong / Developing / Needs Work based on per-domain accuracy.
export interface SkillBreakdown {
  strong: string[];
  developing: string[];
  needsWork: string[];
}

export function breakdownFor(state: DiagState): SkillBreakdown {
  // Group by domainLabel; tally correct/total within each domain.
  const byDomain = new Map<string, { correct: number; total: number }>();
  for (const a of state.answers) {
    const q = QUESTIONS.find(qq => qq.n === a.n);
    if (!q) continue;
    const cur = byDomain.get(q.domainLabel) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.correct) cur.correct += 1;
    byDomain.set(q.domainLabel, cur);
  }
  const strong: string[] = [];
  const developing: string[] = [];
  const needsWork: string[] = [];
  for (const [domain, { correct, total }] of byDomain.entries()) {
    if (total === 0) continue;
    const ratio = correct / total;
    if (ratio >= 0.99) strong.push(domain);
    else if (ratio <= 0.01) needsWork.push(domain);
    else developing.push(domain);
  }
  return { strong, developing, needsWork };
}

export const ANIMAL_OPTIONS: { id: string; emoji: string; name: string }[] = [
  { id: "frog", emoji: "🐸", name: "Frog" },
  { id: "cat", emoji: "🐱", name: "Cat" },
  { id: "bear", emoji: "🐻", name: "Bear" },
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "penguin", emoji: "🐧", name: "Penguin" },
  { id: "hippo", emoji: "🦛", name: "Hippo" },
  { id: "giraffe", emoji: "🦒", name: "Giraffe" },
  { id: "panda", emoji: "🐼", name: "Panda" },
  { id: "otter", emoji: "🦦", name: "Otter" },
  { id: "bunny", emoji: "🐰", name: "Bunny" },
  { id: "axolotl", emoji: "🦎", name: "Axolotl" },
];

export const COLOR_OPTIONS = [
  "#B8FF00", "#A855F7", "#FF6B6B", "#00AAFF", "#FFE600",
  "#FF9F43", "#00C27C", "#FF6EB4", "#00D4FF", "#FFFFFF",
];

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
