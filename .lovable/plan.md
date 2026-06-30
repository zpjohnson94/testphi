# Apply TestPhi Scoring Algorithm

The spec replaces ad-hoc scoring with: a new diagnostic formula, per-domain mastery thresholds, a 3-question bonus round, batch mastery initialization, post-init delta math with ceilings/floors, time factor, momentum multiplier, and weekly decay.

All work stays client-side (localStorage); no backend changes.

## Scope of changes

### 1. `src/lib/diagnostic.ts` — diagnostic scoring
- Tag every question with `difficulty: 1|2|3` (all 15 = `2` per spec).
- Replace `scoreFor` with: `base = 400 + (correct/15)^1.3 * 1120`, plus `time_bonus = Σ (time_factor − 1.0) * 20` for correct answers only. Clamp 400–1560, round to nearest 10.
- Export a shared `timeFactor(correct, ratio)` helper using the spec's two tables.
- Keep `mathScaled` / `rwScaled` as a rough split of the total (so the existing UI still renders) but mark them as approximate — true section scores come post-calibration.

### 2. `src/lib/freeUser.ts` — mastery, momentum, decay, predicted score
Rewrite the math layer; keep public types (`FreeState`, `SessionResult`, `loadFree`, `saveFree`, `applySession`, `pickDailyQuestions`, headlines, tier helpers) so call sites compile.

New `FreeState` fields:
- `domainStats: Record<domainId, { answered: number; initialized: boolean; mastery: number; lastAnsweredISO: string; pendingBonus: number }>` — replaces flat `domainScores`.
- `momentum: number` (0–10 needle, multiplier = 1 + 0.05 × needle).
- `lastQualifyingISO: string` for momentum build/decay.
- `calibrated: boolean` — true once all 8 domains initialized.
- Keep `overall` for back-compat; recompute either from diagnostic score (pre-calibration) or domain-composite (post).

New logic:
- `recordAnswer({domainId, difficulty, correct, elapsedSeconds, isDiagnostic})` — single source of truth. Tracks per-domain `answered++`, applies ceilings/floors and delta formulas, applies time factor, multiplies gains by momentum.
- Batch init at 5 answered: queue 3 bonus questions (E/M/H); only initialize mastery once all 3 answered using the spec's `mastery_init = 0.15 + 0.75 × performance_ratio^0.7` formula across the 8-question batch (stored per-domain in `bonusBatch`).
- `applyDecay(state)` called on load: for each initialized domain idle >3 days, subtract 2%/week (floor 30%). Pure function; updates `lastAnsweredISO` semantics.
- `updateMomentum(state, didQualifyToday)` — +0.05 per day of qualifying session, −0.05 per idle day, range 1.0–1.5. A "qualifying session" = ≥5 questions completed on that calendar date (non-diagnostic).
- `computePredictedScore(state)` — if `!calibrated`, use last diagnostic score; otherwise `Σ (50 + 150 × mastery^1.4)` across 8 domains, summed then rounded to nearest 10.
- `pickDailyQuestions` extended: if any domain has a pending bonus round, surface its next bonus question first (E→M→H ordering).

### 3. `src/routes/daily.question.$n.tsx` — wire to new layer
- After each answer call `recordAnswer` with the question's difficulty + elapsed time instead of buffering raw `SessionResult`s.
- Detect bonus-round questions (flag returned from `pickDailyQuestions`) so UI can label them and avoid double-counting momentum.

### 4. `src/routes/daily.complete.tsx` & `src/routes/home.tsx`
- Read `predicted` and `delta` from new helpers.
- Show momentum needle (existing streak pill can be repurposed or kept alongside).

### 5. `src/routes/skill-map.tsx`
- Use new `mastery` and `initialized` flags. Uninitialized domains render with a "Locked — practice 3 more" hint instead of a numeric mastery.

### 6. `src/routes/diagnostic.results.tsx`
- Pull diagnostic score from updated `scoreFor`.

## Technical notes

```text
diagnostic answer ─┐
                   ├─► recordAnswer ─► domainStats[d].answered++
practice answer  ─┘                    if not initialized:
                                          push to bonusBatch
                                          if answered == 5 → queue bonus E/M/H
                                          if batch complete → initialize mastery
                                       else:
                                          apply ceilings/floors + delta + time + momentum
                                       update lastAnsweredISO
```

Reference table values from the spec are encoded as switch/if-chain lookups (not interpolated) for fidelity. All numeric constants live in a `SCORING` constants block at the top of `freeUser.ts` for auditability.

## Out of scope (this pass)

- UI redesigns beyond surfacing momentum + locked-domain state.
- Server persistence — still localStorage-only.
- Question content additions for the bonus round; for now the bonus round reuses existing questions tagged by domain & difficulty, repeating if the pool is too small (logged with a TODO).
