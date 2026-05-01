// Simple Elo update + SAT score projection.

const K = 28;

export function expectedScore(playerRating: number, questionRating: number) {
  return 1 / (1 + Math.pow(10, (questionRating - playerRating) / 400));
}

export function updateElo(playerRating: number, questionRating: number, correct: boolean) {
  const expected = expectedScore(playerRating, questionRating);
  const actual = correct ? 1 : 0;
  return Math.round(playerRating + K * (actual - expected));
}

// Map a section ELO (roughly 600-1800) to SAT section score (200-800).
export function sectionEloToSAT(elo: number) {
  // Linear: 600 -> 200, 1800 -> 800
  const score = ((elo - 600) / (1800 - 600)) * 600 + 200;
  return Math.round(Math.max(200, Math.min(800, score)) / 10) * 10;
}

export function overallProjected(rwElo: number, mathElo: number) {
  return sectionEloToSAT(rwElo) + sectionEloToSAT(mathElo);
}

export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export function tierFromOverall(overall: number): { tier: Tier; color: string; next?: number } {
  if (overall >= 1450) return { tier: "Diamond", color: "var(--tier-diamond)" };
  if (overall >= 1300) return { tier: "Platinum", color: "var(--tier-platinum)", next: 1450 };
  if (overall >= 1150) return { tier: "Gold", color: "var(--tier-gold)", next: 1300 };
  if (overall >= 1000) return { tier: "Silver", color: "var(--tier-silver)", next: 1150 };
  return { tier: "Bronze", color: "var(--tier-bronze)", next: 1000 };
}
