# Bonus Round Unlock Card + Chest Reveal

## Important note before building

The spec says "Bonus round question selection … is already handled server-side — don't touch that logic." In the current codebase this is only half-true:

- `isBonusQuestionFor` / `nextBonusDifficulty` exist in `src/lib/freeUser.ts`.
- BUT bonus questions are only served **inline inside the Daily 5 slot flow** (`dailyAttempt.functions.ts` → `serveDailyQuestion(slot)` → returns bonus flag when the domain crosses threshold during that slot). There is no standalone "serve me 3 bonus questions for domain X, on demand" server function today.

So to build the modal that serves Easy → Medium → Hard for a specific domain outside the Daily 5, one of these has to be true:

**Option A (recommended, smaller):** Add a thin new server function `serveBonusRoundForDomain(domainId)` that returns the 3 fixed-order questions (E/M/H) using the existing bank + selection helpers, plus `gradeBonusAnswer` that writes attempts identical to the Daily 5 grader but flagged `is_bonus`. Mastery init still happens automatically in `applyOneResult` when `bonusStep >= 3`. No scoring logic changes.

**Option B:** Keep the current inline behavior — the "unlock ready" card just deep-links the user back into the next Daily 5 where the bonus questions are auto-injected. Simpler, but the spec's "3 more questions — Easy, Medium, and Hard" modal isn't literally the Daily 5.

I'll assume **Option A** unless you say otherwise.

## Scope

UI/UX only. No changes to scoring, mastery init, momentum, or streak logic.

## Files touched

### New

- `src/components/UnlockReadyCard.tsx` — chartreuse vibrating card with electric texture, tappable.
- `src/components/BonusUnlockModal.tsx` — the 5-screen modal (Start → Q1 → Q2 → Q3 → Chest).
- `src/components/ChestReveal.tsx` — chest illustration + tap-to-crack interaction + mastery reveal.
- `src/assets/chest-buried.png` — new illustration (imagegen, same art style as avatars).
- `src/lib/bonusRound.functions.ts` — `serveBonusRound({domainId})` returns 3 fixed-order questions; `gradeBonusAnswer(...)` writes attempts with `is_bonus=true`. Both are auth-gated `createServerFn`s that reuse existing selection/grade helpers.
- `src/lib/useBonusRound.ts` — `useServeBonusRound(domainId)`, `useGradeBonusAnswer()`.

### Edited

- `src/routes/_authenticated/skill-map.tsx` — for each domain where `!initialized && answered >= THRESHOLD && bonusStep < 3`, replace the mastery box with `<UnlockReadyCard />`. Tapping opens `<BonusUnlockModal />`.
- `src/routes/_authenticated/daily.complete.tsx` — in `DomainRow`, when a domain became bonus-ready this session (`diff.bonusUnlockedThisSession && !diff.nowInitialized`), render `<UnlockReadyCard />` in place of the progress-bar block.
- `src/routes/_authenticated/home.tsx` — if any domain is bonus-ready, show a compact list of `<UnlockReadyCard />`s above the Daily 5 card.
- `src/styles.css` — 2 keyframes: `unlock-vibrate` (subtle continuous shake) and `electric-flow` (SVG stroke-dashoffset loop for the lightning texture).

## Key visual/interaction details

### UnlockReadyCard
- Full-bleed chartreuse (`var(--volt)` = `#B8FF00`) background.
- Continuous `unlock-vibrate` (~0.35° rotate + 1px translate, 90ms loop, `prefers-reduced-motion: reduce` disables).
- SVG overlay: two jagged polylines with `stroke-dasharray` animated on `stroke-dashoffset` to give the flowing lightning look. Uses `mix-blend-mode: overlay` for the "across the surface" wash.
- Copy: **"{Domain Name} Mastery score ready to unlock"** + tiny "Tap to begin →" affordance.

### BonusUnlockModal
- Full-screen sheet, chartreuse-tinted backdrop.
- **Screen 1 (Start):** spec copy verbatim + single "Begin" button.
- **Screens 2–4 (Questions):** renders the same visual shell as `daily.question.$n.tsx` (lavender card, choices, timer). Extracts the question card into a reusable `<QuestionCard />` component — or inlines the JSX for now with a note. Timer starts on mount, elapsedMs sent to `gradeBonusAnswer`.
- Auto-advances to next screen 800ms after grade returns.
- **Screen 5 (Chest):** described below.

### ChestReveal
- Full-screen dark backdrop with a chartreuse radial glow at the bottom.
- Chest illustration half-buried in sand (`chest-buried.png`), centered.
- Idle: gentle scale pulse 1.0 ↔ 1.04 at 2.4s ease-in-out.
- "TAP to unlock!" text below.
- On each tap (up to 12):
  - Emit 6–10 sand particles from base of chest, fly outward + fall with gravity, fade after 700ms.
  - Chest shakes: amplitude grows linearly with tap count (2° → 12° rotation range, 60ms period).
  - sfx.tap() on each.
- Tap 12: chest scales up + rotates, screen flashes chartreuse (full-viewport `background: var(--volt)` opacity 0→1→0 over 500ms), then reveal the initialized mastery % using the existing `CalibrationMilestone`-style celebration (reuse styling: chartreuse border + radial pulse + big `PredictedScore`-style number). "Continue" button closes modal and refetches free state so the domain box now shows the initialized mastery.

## Data flow

1. Modal mounts → `useServeBonusRound(domainId)` fetches all 3 questions.
2. User answers each → `gradeBonusAnswer({attemptId, selectedPosition, elapsedMs})` → server writes attempt row with `is_bonus=true`. Server does NOT eagerly initialize mastery on Q3 — it stays the responsibility of `applySession` / whichever aggregator already handles it (need to confirm during implementation; may add a small `finalizeBonusRound({domainId})` that runs the same `applyOneResult` loop as Daily 5 finalize but scoped to bonus attempts, so mastery init fires deterministically before the chest reveal).
3. After finalize, refetch `freeState`; the newly initialized mastery is what the chest reveals.

## Out of scope

- Any change to scoring formulas, momentum, streak.
- Analytics events (can add later if desired).
- Sound design beyond existing `sfx.tap()`.

## Open question for you

Confirm **Option A** (new small server function for standalone bonus round) vs **Option B** (just deep-link into Daily 5). Option A matches the spec literally; Option B ships faster but the modal would only cover the "not calibrated yet" card + chest, and the 3 questions would still happen inside the regular Daily 5.
