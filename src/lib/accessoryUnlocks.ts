// Evaluates accessory unlocks based on the latest FreeState + session diff.
// Called after each daily session finalize; returns the set of newly-unlocked
// accessory IDs so callers can toast/celebrate if desired.

import type { AccessoryId } from "@/components/Avatar";
import { DOMAINS, isCalibrated, type FreeState } from "./freeUser";
import { getState, unlockAccessories } from "./store";

function totalAnswered(s: FreeState): number {
  let n = 0;
  for (const d of DOMAINS) n += s.domainStats[d.id]?.answered ?? 0;
  return n;
}

export function evaluateAccessoryUnlocks(prev: FreeState | null, next: FreeState): AccessoryId[] {
  const unlocks: AccessoryId[] = [];
  const session = next.lastSession;

  // Predicted score tiers
  if (next.overall >= 1200) unlocks.push("tophat");
  if (next.overall >= 1400) unlocks.push("brain");
  if (next.overall >= 1600) unlocks.push("crown");

  // All domains calibrated
  if (isCalibrated(next)) unlocks.push("grad");

  // First-ever Daily 5 complete
  if ((!prev || !prev.lastDailyDate) && next.lastDailyDate) unlocks.push("cap");

  // 100% mastery in any domain
  for (const d of DOMAINS) {
    if ((next.domainStats[d.id]?.mastery ?? 0) >= 100) {
      unlocks.push("star");
      break;
    }
  }

  // Total questions answered
  const total = totalAnswered(next);
  if (total >= 50) unlocks.push("flower");
  if (total >= 100) unlocks.push("bolt");

  // Momentum peaks / drops
  if (next.momentumNeedle >= 10) unlocks.push("fire");
  if (session && session.momentumAfter < session.momentumBefore) unlocks.push("ice");

  // Streak
  if (next.streak >= 5) unlocks.push("goggles");

  // Per-session sweeps (Daily 5 only — exclude bonus questions)
  if (session) {
    const daily = session.results.filter((r) => !r.isBonus);
    if (daily.length === 5) {
      if (daily.every((r) => r.correct)) unlocks.push("bulb");
      if (daily.every((r) => !r.correct)) unlocks.push("poop");
    }
  }

  // Raised predicted score by 100+ from the diagnostic baseline
  if (next.overall - (next.diagnosticScore || 0) >= 100) unlocks.push("disco");

  // Persist to local store (dedupes internally).
  const before = new Set(getState().unlockedAccessories);
  unlockAccessories(unlocks);
  return unlocks.filter((id) => !before.has(id));
}
