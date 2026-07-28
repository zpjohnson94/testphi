// Static ghost pacing profile used when a player is the first to attempt
// today's battle_set (no battle_runs row exists yet for today), and also
// as the developer-mode opponent. Pure client-side pacing reference —
// never written to battle_runs, never counted toward daily rank, never
// eligible for battle_leaderboard_alerts.

import type { AnimalId, AccessoryId } from "@/components/Avatar";

export interface StaticGhostEvent {
  question_index: number; // 1-based
  cumulative_elapsed_ms: number;
  correct: boolean;
}

export const STATIC_GHOST_PROFILE: StaticGhostEvent[] = [
  { question_index: 1, cumulative_elapsed_ms: 6800, correct: true },
  { question_index: 2, cumulative_elapsed_ms: 14000, correct: true },
  { question_index: 3, cumulative_elapsed_ms: 21500, correct: true },
  { question_index: 4, cumulative_elapsed_ms: 29600, correct: true },
  { question_index: 5, cumulative_elapsed_ms: 36500, correct: true },
  { question_index: 6, cumulative_elapsed_ms: 47700, correct: false },
  { question_index: 7, cumulative_elapsed_ms: 55000, correct: true },
  { question_index: 8, cumulative_elapsed_ms: 62600, correct: true },
  { question_index: 9, cumulative_elapsed_ms: 71000, correct: true },
  { question_index: 10, cumulative_elapsed_ms: 78100, correct: true },
  { question_index: 11, cumulative_elapsed_ms: 88900, correct: false },
  { question_index: 12, cumulative_elapsed_ms: 96300, correct: true },
  { question_index: 13, cumulative_elapsed_ms: 104000, correct: true },
  { question_index: 14, cumulative_elapsed_ms: 112000, correct: true },
];

export const STATIC_GHOST = {
  name: "Ghost",
  animal: "shiba" as AnimalId, // Dog
  color: "#FFFFFF", // white
  accessory: "tophat" as AccessoryId,
};

// Derive live progress by comparing elapsed run time to cumulative_elapsed_ms.
export function staticGhostProgress(elapsedMs: number): {
  qIndex: number;
  correct: number;
  wrong: number;
} {
  let qIndex = 0;
  let correct = 0;
  let wrong = 0;
  for (const e of STATIC_GHOST_PROFILE) {
    if (e.cumulative_elapsed_ms > elapsedMs) break;
    qIndex = e.question_index;
    if (e.correct) correct++;
    else wrong++;
  }
  return { qIndex, correct, wrong };
}
