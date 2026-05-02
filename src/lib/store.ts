// Browser-local progress store. Persisted to localStorage.
// v1 keeps everything client-side so we can ship the loop fast.

import { useEffect, useSyncExternalStore } from "react";
import { WORLDS, SKILLS, type Section } from "./content";
import { updateElo } from "./elo";
import { defaultAvatar, type AvatarConfig, type AccessoryId } from "@/components/Avatar";

const STORAGE_KEY = "satquest:v2";

export interface NodeProgress {
  best: number;        // 0..3 best correct count
  attempts: number;
  lastScore?: number;  // last attempt correct count
}

export interface State {
  hasOnboarded: boolean;
  name: string;
  avatar: AvatarConfig;
  unlockedAccessories: AccessoryId[];
  dailyGoalXp: number;
  xpToday: number;
  xpDate: string;       // ISO date for xpToday
  totalXp: number;
  streak: number;
  lastActiveDate: string;
  rwElo: number;
  mathElo: number;
  mastery: Record<string, number>;     // skillId -> 0..100
  progress: Record<string, NodeProgress>; // nodeId -> progress
  eloHistory: { date: string; rw: number; math: number }[];
  lastNodeId?: string;
  soundEnabled: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

function defaultMastery(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of SKILLS) m[s.id] = 35; // start a bit behind
  return m;
}

function defaultState(): State {
  return {
    hasOnboarded: false,
    name: "Player",
    avatar: defaultAvatar(),
    unlockedAccessories: ["none"],
    dailyGoalXp: 20,
    xpToday: 0,
    xpDate: today(),
    totalXp: 0,
    streak: 0,
    lastActiveDate: "",
    rwElo: 1000,
    mathElo: 1000,
    mastery: defaultMastery(),
    progress: {},
    eloHistory: [{ date: today(), rw: 1000, math: 1000 }],
    soundEnabled: true,
  };
}

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function emit() { listeners.forEach((l) => l()); }

function setState(updater: (s: State) => State) {
  state = updater(state);
  persist();
  emit();
}

export function getState() { return state; }

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  // Use server snapshot to avoid hydration mismatch (defaults).
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(defaultState()),
  );
}

// Hydrate from localStorage after mount (avoids SSR/CSR mismatch).
export function useHydration() {
  useEffect(() => {
    state = load();
    emit();
  }, []);
}

// --- Mutations ---

export function completeOnboarding(opts: {
  name: string;
  avatar: AvatarConfig;
  dailyGoalXp: number;
  rwElo: number;
  mathElo: number;
  mastery: Record<string, number>;
}) {
  setState((s) => ({
    ...s,
    hasOnboarded: true,
    name: opts.name,
    avatar: opts.avatar,
    dailyGoalXp: opts.dailyGoalXp,
    rwElo: opts.rwElo,
    mathElo: opts.mathElo,
    mastery: { ...s.mastery, ...opts.mastery },
    eloHistory: [{ date: today(), rw: opts.rwElo, math: opts.mathElo }],
  }));
}

export function recordAttempt(opts: {
  section: Section;
  skillId: string;
  difficulty: number;
  correct: boolean;
}) {
  setState((s) => {
    const before = opts.section === "rw" ? s.rwElo : s.mathElo;
    const after = updateElo(before, opts.difficulty, opts.correct);
    const masteryDelta = opts.correct ? 6 : -4;
    const newMastery = Math.max(0, Math.min(100, (s.mastery[opts.skillId] ?? 50) + masteryDelta));
    return {
      ...s,
      rwElo: opts.section === "rw" ? after : s.rwElo,
      mathElo: opts.section === "math" ? after : s.mathElo,
      mastery: { ...s.mastery, [opts.skillId]: newMastery },
    };
  });
}

export function finishLesson(opts: { nodeId: string; correctCount: number; xp: number }) {
  setState((s) => {
    const td = today();
    let xpToday = s.xpDate === td ? s.xpToday : 0;
    xpToday += opts.xp;
    let streak = s.streak;
    if (s.lastActiveDate !== td) {
      // simple streak: increment if yesterday was active OR start new
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yIso = y.toISOString().slice(0, 10);
      streak = s.lastActiveDate === yIso ? s.streak + 1 : 1;
    }
    const prev = s.progress[opts.nodeId] ?? { best: 0, attempts: 0 };
    const progress: NodeProgress = {
      best: Math.max(prev.best, opts.correctCount),
      attempts: prev.attempts + 1,
      lastScore: opts.correctCount,
    };
    // ELO history snapshot per day
    const history = [...s.eloHistory];
    const last = history[history.length - 1];
    if (last && last.date === td) {
      history[history.length - 1] = { date: td, rw: s.rwElo, math: s.mathElo };
    } else {
      history.push({ date: td, rw: s.rwElo, math: s.mathElo });
    }
    return {
      ...s,
      xpToday,
      xpDate: td,
      totalXp: s.totalXp + opts.xp,
      streak,
      lastActiveDate: td,
      lastNodeId: opts.nodeId,
      progress: { ...s.progress, [opts.nodeId]: progress },
      eloHistory: history,
    };
  });
}

export function resetAll() {
  setState(() => defaultState());
}

// --- Helpers ---

export function weakestSkill(state: State): { id: string; name: string; mastery: number } | null {
  let weakest: { id: string; name: string; mastery: number } | null = null;
  for (const skill of SKILLS) {
    const m = state.mastery[skill.id] ?? 50;
    if (!weakest || m < weakest.mastery) weakest = { id: skill.id, name: skill.name, mastery: m };
  }
  return weakest;
}

export function nextRecommendedNode(state: State): { nodeId: string; section: Section } | null {
  for (const w of WORLDS) {
    for (const n of w.nodes) {
      const p = state.progress[n.id];
      if (!p || p.best < 3) return { nodeId: n.id, section: w.section };
    }
  }
  return null;
}
