# TestPhi Scoring Algorithm Spec (v2)

> **Revision note:** This version supersedes the original scoring algorithm spec. Three formulas changed as a result of a review session focused on why a Daily 5 (5 questions) could move predicted score by an unexpectedly large amount. Changes are marked **[CHANGED]** below. Everything else is unchanged from v1.

---

## The 8 Domains

### Math → contributes 200–800 to predicted score

1. Algebra
2. Advanced Math
3. Problem Solving & Data Analysis
4. Geometry & Trigonometry

### Reading & Writing → contributes 200–800 to predicted score

5. Information & Ideas
6. Craft & Structure
7. Expression of Ideas
8. Standard English Conventions

---

## Diagnostic Score

*Unchanged from v1.*

15 questions, all Medium difficulty (rating: 2), served approximately 2 per domain.

Diagnostic questions count toward each domain's mastery initialization threshold but do not individually update mastery via the delta formula. The `time_factor_i` computed for each diagnostic answer contributes to both the diagnostic score and the batch mastery initialization calculation at the unlock threshold.

The diagnostic does not count as a qualifying session for Momentum purposes.

### Formula

```
base        = 400 + (correct / 15)^1.3 × 1120
time_bonus  = Σ (time_factor_i − 1.0) × 20  [correct answers only; 0 for wrong]
Diagnostic Score = clamp(round(base + time_bonus, −1), 400, 1560)
```

### Reference Table

| Correct | Fast | Normal | Slow |
|---|---|---|---|
| 0/15 | 400 | 400 | 400 |
| 3/15 | 550 | 540 | 520 |
| 5/15 | 690 | 670 | 640 |
| 8/15 | 930 | 890 | 850 |
| 10/15 | 1110 | 1060 | 1000 |
| 12/15 | 1300 | 1240 | 1170 |
| 13/15 | 1390 | 1330 | 1250 |
| 14/15 | 1490 | 1420 | 1340 |
| 15/15 | 1560 | 1520 | 1430 |

---

## Domain Unlock Threshold

*Unchanged from v1.*

Each domain reaches its threshold when **5 questions** have been answered in that domain. The 2 diagnostic questions per domain count toward this threshold, so 3 additional practice questions are needed after the diagnostic.

At the threshold, the bonus round triggers — mastery does not unlock immediately.

---

## Bonus Round

*Unchanged from v1.*

When a domain hits the 5-question threshold, a bonus round of 3 domain-specific questions is served before mastery unlocks. The questions are always delivered in this fixed order:

1. **Easy**
2. **Medium**
3. **Hard**

The escalating difficulty is intentional — confidence builder, expected challenge, climax question. All 3 bonus questions count toward the mastery initialization batch.

The bonus round persists if abandoned mid-session. It remains queued until completed, even across sessions. Mastery does not initialize until all 3 are answered.

Free users receive domain-specific bonus round questions as a special exception to the universal daily question format.

---

## Mastery Initialization (Batch)

*Unchanged from v1.*

When the bonus round is completed, mastery is initialized using all 8 questions collectively — the 5 threshold questions plus the 3 bonus questions. This is a one-time calibration calculation. The delta system takes over from the initialized value for all subsequent questions.

### Batch Composition

| Source | Count | Difficulty |
|---|---|---|
| Diagnostic | 2 | Medium (always) |
| Practice | 3 | Variable |
| Bonus round | 3 | 1 Easy + 1 Medium + 1 Hard (always) |
| **Total** | **8** | |

### Difficulty Weights

| Difficulty | Weight |
|---|---|
| Easy (1) | 1 |
| Medium (2) | 2 |
| Hard (3) | 3 |

### Formula

```
question_score = difficulty_weight × time_factor_i   [if correct]
question_score = 0                                   [if wrong]
question_max   = difficulty_weight × 1.25

performance_ratio = Σ question_score / Σ question_max

mastery_init = 0.15 + 0.75 × performance_ratio^0.7
```

- **Floor: 15%** — minimum initialized mastery regardless of performance
- **Cap: 90%** — maximum initialized mastery regardless of performance; reaching 100% requires sustained practice after unlock
- Total max possible score: **(2×2 + 3×2 + 1×1 + 1×2 + 1×3) × 1.25 = 20 points**

### Reference Table

*Assumes practice questions are Medium difficulty. Hard practice questions shift ratio and mastery upward.*

| Threshold (5q) | Bonus Round (3q) | Speed | Ratio | Mastery Init |
|---|---|---|---|---|
| 5/5 correct | 3/3 correct | Fast | 100% | 90% |
| 5/5 correct | 3/3 correct | Normal | 80% | 79% |
| 5/5 correct | 3/3 correct (bonus fast) | Mixed | 88% | 83% |
| 5/5 correct | 2/3 correct (miss hard) | Normal | 65% | 70% |
| 5/5 correct | 1/3 correct (miss M+H) | Normal | 55% | 64% |
| 5/5 correct | 0/3 correct | Normal | 50% | 61% |
| 4/5 correct | 3/3 correct | Normal | 70% | 73% |
| 3/5 correct | 3/3 correct | Normal | 60% | 67% |
| 2/5 correct | 3/3 correct | Normal | 50% | 61% |
| 0/5 correct | 0/3 correct | Any | 0% | 15% |

---

## Calibration

*Unchanged from v1.*

When all 8 domains have reached the unlock threshold, the diagnostic score is replaced by the mastery-composite predicted score. From this point forward the predicted score updates in real time after every answer.

---

## Predicted Score (Post-Calibration)

### Per-Domain Score — **[CHANGED: now linear, not convex]**

**v1 (old):**
```
Domain Score = 50 + 150 × mastery^1.4
```

**v2 (new):**
```
Domain Score = 50 + 150 × mastery
```

**Why this changed:** the `^1.4` exponent made domain score sensitivity to mastery gains vary across the mastery range — flattest in the middle (~40-60%), steepest at both ends. Combined with the gain formula's own mastery-dependent scaling, this produced a non-obvious "sweet spot" around 44% mastery where per-question score movement was maximized — a side effect nobody intended and that made maximum session movement hard to predict or bound. A linear relationship means every mastery point is worth exactly 1.5 predicted-score points, always. All diminishing-returns behavior now lives entirely in the gain and loss formulas below, where it's intentional and singular rather than duplicated and interacting.

50 is preserved as the literal SAT per-domain floor; 200 remains the ceiling at 100% mastery.

| Mastery % | Domain Score (v1, convex) | Domain Score (v2, linear) |
|---|---|---|
| 0% | 50 | 50 |
| 30% | 78 | 95 |
| 50% | 107 | 125 |
| 60% | 122 | 140 |
| 70% | 136 | 155 |
| 80% | 152 | 170 |
| 90% | 179 | 185 |
| 100% | 200 | 200 |

### Section and Total Score

*Unchanged from v1.*

- **Math score** = sum of 4 math domain scores → range 200–800
- **R&W score** = sum of 4 R&W domain scores → range 200–800
- **Predicted score** = Math score + R&W score → range 400–1600, rounded to nearest 10

---

## Difficulty Levels

*Unchanged from v1.*

| Rating | Label | Expected Time |
|---|---|---|
| 1 | Easy | 30 seconds |
| 2 | Medium | 60 seconds |
| 3 | Hard | 90 seconds |

---

## Mastery Deltas — Base Values

### Gains (correct answers) — **[CHANGED: values revised]**

**v1 (old):** Easy +1.5%, Medium +2.5%, Hard +4.0%
**v2 (new):**

| Difficulty | Base Gain |
|---|---|
| Easy (1) | +1.0% |
| Medium (2) | +2.0% |
| Hard (3) | +3.0% |

**Why this changed:** reducing Hard's base gain from 4.0% to 3.0% (a proportional cut across all three tiers) directly lowers the ceiling on maximum possible score movement in a single session, without altering the shape of the gain curve or how it interacts with mastery, time, or momentum.

### Losses (incorrect answers)

*Base values unchanged from v1 — only the mastery-scaling term applied to them has changed (see Loss Formula below).*

| Difficulty | Base Loss |
|---|---|
| Easy (1) | −3.0% |
| Medium (2) | −2.0% |
| Hard (3) | −1.0% |

---

## Mastery Ceilings and Floors

*Unchanged from v1.*

### Gain Ceilings

Correct answers above this mastery level produce no gain:

| Difficulty | Gain Ceiling |
|---|---|
| Easy (1) | 50% |
| Medium (2) | 85% |
| Hard (3) | None |

### Loss Floors

Incorrect answers below this mastery level produce no loss:

| Difficulty | Loss Floor |
|---|---|
| Easy (1) | None |
| Medium (2) | 25% |
| Hard (3) | 50% |

### Combined Reference Table

| Mastery Range | Easy | Medium | Hard |
|---|---|---|---|
| 0–25% | gain + loss | gain only | gain only |
| 25–50% | gain + loss | gain + loss | gain only |
| 50–85% | loss only | gain + loss | gain + loss |
| 85–100% | loss only | loss only | gain + loss |

---

## Time Factor

*Unchanged from v1 — expected times and tier boundaries remain 30/60/90s for Easy/Medium/Hard.*

```
time_ratio = actual_time / expected_time
```

### For Correct Answers

| Time Ratio | Time Factor |
|---|---|
| < 0.50 | 1.25 |
| 0.50 – 0.75 | 1.10 |
| 0.75 – 1.25 | 1.00 |
| 1.25 – 1.75 | 0.85 |
| > 1.75 | 0.70 |

### For Incorrect Answers

| Time Ratio | Time Factor |
|---|---|
| < 0.75 | 0.80 |
| 0.75 – 1.25 | 1.00 |
| > 1.25 | 1.30 |

---

## Momentum

*Unchanged from v1.*

Momentum is a multiplier applied to mastery gains only. It never worsens losses. A qualifying session is 5 or more questions completed. The diagnostic does not count as a qualifying session.

- **Range:** 1.0 – 1.5
- **Build:** +0.05 per calendar day a qualifying session is completed
- **Decay:** −0.05 per calendar day with no qualifying session

### Needle-to-Multiplier Reference

| Needle (0–10) | Multiplier |
|---|---|
| 0 | 1.0x |
| 1 | 1.05x |
| 2 | 1.1x |
| 3 | 1.15x |
| 4 | 1.2x |
| 5 | 1.25x |
| 6 | 1.3x |
| 7 | 1.35x |
| 8 | 1.4x |
| 9 | 1.45x |
| 10 | 1.5x |

---

## Post-Initialization Delta Formulas

These formulas apply to all questions answered after mastery initialization. Questions answered as part of the threshold batch use the batch initialization formula instead.

Ceilings and floors are evaluated first. If a question's difficulty falls outside the valid range for the current mastery level, the delta is zero.

### Gains (correct answers) — formula shape unchanged, base values updated

Gains scale progressively — the closer mastery is to 100%, the smaller the gain per correct answer. This makes high mastery genuinely hard to earn.

```
effective_gain = base_gain × (1 − mastery)^0.5 × time_factor × momentum
```

*(`base_gain` now uses the revised v2 values above: 1.0% / 2.0% / 3.0%.)*

The scaling factor `(1 − mastery)^0.5` at key mastery levels — unchanged:

| Mastery | Scale Factor |
|---|---|
| 15% | 0.922 |
| 50% | 0.707 |
| 75% | 0.500 |
| 90% | 0.316 |
| 95% | 0.224 |
| 99% | 0.100 |

**Hard Correct Fast effective gain at key mastery levels (v2 base gain 3.0%):**

| Mastery | Effective Gain |
|---|---|
| 15% | 3.46% |
| 50% | 2.65% |
| 75% | 1.88% |
| 90% | 1.18% |
| 95% | 0.84% |
| 99% | 0.38% |

### Losses (incorrect answers) — **[CHANGED: now mastery-scaled]**

**v1 (old):** losses were not scaled by mastery at all — the base loss applied identically regardless of mastery level.
```
mastery_loss = base_loss × time_factor
```

**v2 (new):**
```
mastery_loss = base_loss × time_factor × (0.5 + (1 − (1 − mastery)^0.5))
```

**Why this changed:** the team wanted losses to mirror gains conceptually — a correct answer should matter less as mastery rises, and an incorrect answer should matter *more* as mastery rises, so that high mastery is genuinely fragile and must be maintained through continued practice, not just earned once. A literal mirror of the gain curve (`mastery^0.5`, or `1 − (1−mastery)^0.5`) was evaluated in two forms:

- `mastery^0.5` (naive variable swap) — rejected. This shape decelerates near 100% mastery, the opposite of the intended effect.
- `1 − (1 − mastery)^0.5` (true reflection of the gain curve) — closer, but reaches **zero** penalty at 0% mastery, meaning a beginner missing an Easy question would face no consequence at all. Rejected on its own.

The adopted formula combines a **fixed floor** (0.5x, preserving some penalty even at 0% mastery) with the **accelerating** reflected curve on top, ranging smoothly from 0.5x at 0% mastery to 1.5x at 100% mastery — matching the same 0.5x–1.5x range the team had already tuned into a simpler linear version, but with the punishment ramping increasingly sharply in the final stretch toward 100% rather than climbing at a flat rate.

**Loss multiplier `(0.5 + (1 − (1 − mastery)^0.5))` at key mastery levels:**

| Mastery | Multiplier |
|---|---|
| 0% | 0.500 |
| 15% | 0.578 |
| 25% | 0.634 |
| 50% | 0.793 |
| 75% | 1.000 |
| 90% | 1.184 |
| 95% | 1.276 |
| 100% | 1.500 |

**Effective loss by difficulty, floors applied, Normal time (base losses unchanged: Easy −3.0%, Medium −2.0%, Hard −1.0%):**

| Mastery | Easy (no floor) | Medium (floor 25%) | Hard (floor 50%) |
|---|---|---|---|
| 0% | −1.50% | floor | floor |
| 15% | −1.73% | floor | floor |
| 25% | −1.90% | −1.27% | floor |
| 50% | −2.38% | −1.59% | −0.79% |
| 75% | −3.00% | −2.00% | −1.00% |
| 90% | −3.55% | −2.37% | −1.18% |
| 95% | −3.83% | −2.55% | −1.28% |
| 100% | −4.50% | −3.00% | −1.50% |

**Note on Easy-question asymmetry (unchanged interaction, flagged for awareness):** Easy questions have a gain ceiling at 50% mastery (no gain above it) but no loss floor at all. Above 75-80% mastery, an Easy question is pure downside — zero possible gain, and loss growing toward −4.5% at the mastery ceiling. This was already true in v1 and is preserved intentionally: a high-mastery user slipping on a below-level question is expected to feel it.

### Questions to Reach 100% from Initialization Cap (hard correct)

*Reference table below is approximate under the v2 base gain (3.0% vs. v1's 4.0%) — expect slightly more questions needed than v1's figures. Not recalculated in this revision; flag if you want exact updated counts.*

| Speed | Questions Needed (v1 estimate, for reference only) |
|---|---|
| Fast | 11 |
| Normal | 14 |
| Slow | 21 |

Mastery is hard-capped at 0–100%.

---

## Mastery Decay

*Unchanged from v1.*

Mastery decays per domain independently based on inactivity in that specific domain. Decay only applies to domains that have been initialized — uninitialized domains are unaffected.

- Decay begins after **3 days** of no questions answered in a domain
- Rate: **−2% per week** of inactivity, applied continuously
- Floor: **30%** — mastery cannot decay below this value
- Decay pauses immediately when any question in that domain is answered

---

## Reference: Max Session Movement (Daily 5, 5 questions)

*New section — added to document the outcome of the v2 revision, for context on future tuning decisions.*

Under v2 (linear domain score, revised 1/2/3 base gains, unchanged loss formula shape):

| Scenario | Approx. Total Points |
|---|---|
| Max gain — Daily 5, boundary case (Hard/Fast/max momentum, mastery → 0%, spread across 5 domains) | ~42 pts |
| Max loss — Daily 5, boundary case (Easy/Slow, mastery → 100%, spread across 5 domains) | ~44 pts |
| Typical "great but not extreme" day (5 Medium/correct/Normal time, 50% mastery, max momentum) | ~16 pts |

Gain and loss ceilings are now approximately symmetric and both occur predictably at mastery boundaries (0% or 100%) rather than at a hidden interior point — a direct improvement over v1, where the convex domain-score curve caused max gain and max loss to peak at different, non-obvious mastery values and produced a larger loss-side ceiling (~61 pts) than gain-side (~44 pts).


