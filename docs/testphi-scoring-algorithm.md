# TestPhi Scoring Algorithm Spec (v3)

> **Revision note:** This version supersedes v2. v2 addressed why a Daily 5 could move predicted score by an unexpectedly large amount (linear domain score, revised base gains, mastery-scaled losses). v3 folds in three additional decisions made in a separate thread on mastery initialization tuning and marathon-session behavior: the mastery init exponent, a unified time factor table, the variable-N batch model, and the explicit rejection of a session-level mastery-delta cap. Changes since v2 are marked **[CHANGED SINCE V2]**. Everything else carries over from v2 unchanged.

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

*Unchanged since v1.*

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

## Domain Unlock Threshold — **[CHANGED SINCE V2: variable-N batch model]**

**v1/v2 (old):** Fixed at exactly 5 questions per domain, with a hard cap on batch size.

**v3 (new):** The threshold is still nominally 5 questions, but the batch is **variable-N**. If a session (e.g., a Daily 5 that happens to draw multiple questions from a domain already close to its threshold) pushes the domain past 5 threshold questions before the bonus round actually fires, all of those questions are included in the batch rather than being truncated at exactly 5. The batch grows to include however many threshold questions were genuinely answered before the bonus round triggers.

**Why this changed:** a session-overlap edge case could produce a 9-question batch (6 threshold + 3 bonus) when a Daily 5 pushed a domain past the nominal 5-question line in a single session. Capping at exactly 5 would have silently discarded a real answered question from the calculation; variable-N ensures every answered question is counted.

At the threshold (whatever N turns out to be), the bonus round triggers — mastery does not unlock immediately.

---

## Bonus Round

*Unchanged since v1.*

When a domain hits its threshold, a bonus round of 3 domain-specific questions is served before mastery unlocks. The questions are always delivered in this fixed order:

1. **Easy**
2. **Medium**
3. **Hard**

The escalating difficulty is intentional — confidence builder, expected challenge, climax question. All 3 bonus questions count toward the mastery initialization batch.

The bonus round persists if abandoned mid-session. It remains queued until completed, even across sessions. Mastery does not initialize until all 3 are answered.

Free users receive domain-specific bonus round questions as a special exception to the universal daily question format.

---

## Mastery Initialization (Batch)

When the bonus round is completed, mastery is initialized using all threshold questions collectively (N, per the variable-N model above) plus the 3 bonus questions. This is a one-time calibration calculation. The delta system takes over from the initialized value for all subsequent questions.

### Batch Composition — **[CHANGED SINCE V2: N is variable, not fixed at 5]**

| Source | Count | Difficulty |
|---|---|---|
| Diagnostic | 2 | Medium (always) |
| Practice (threshold) | N − 2, minimum 3 | Variable |
| Bonus round | 3 | 1 Easy + 1 Medium + 1 Hard (always) |
| **Total** | **N + 3** (typically 8) | |

### Difficulty Weights

*Unchanged.*

| Difficulty | Weight |
|---|---|
| Easy (1) | 1 |
| Medium (2) | 2 |
| Hard (3) | 3 |

### Formula — **[CHANGED SINCE V2: exponent 0.7 → 0.5]**

```
question_score = difficulty_weight × time_factor_i   [if correct]
question_score = 0                                   [if wrong]
question_max   = difficulty_weight × 1.25

performance_ratio = Σ question_score / Σ question_max

mastery_init = 0.15 + 0.75 × performance_ratio^0.5
```

- **Floor: 15%** — minimum initialized mastery regardless of performance
- **Cap: 90%** — maximum initialized mastery regardless of performance; reaching 100% requires sustained practice after unlock
- The ×1.25 multiplier on `question_max` is retained (unchanged from v1/v2)

**Why the exponent changed:** at 0.7, a strong-but-imperfect performance (e.g., missing only the Hard bonus question) produced initialized mastery in the mid-60s to low-70s — punishing enough that it read as a bug rather than intended design (a real test case of 8/9 correct landing at 66% mastery prompted the review). A comparison table across exponents 0.3, 0.4, 0.5, and 0.7 was reviewed directly; 0.5 was selected as the best balance — meaningfully more forgiving of near-perfect performance than 0.7, without compressing the gap between "fast and imperfect" and "slow and correct" as much as the more aggressive 0.3/0.4 options did.

### Reference Table — recalculated for the 0.5 exponent

*Ratios are unchanged from v1/v2 (they depend on correct/incorrect counts and time factor, not the exponent) — only the resulting Mastery Init % column changes.*

| Threshold (5q) | Bonus Round (3q, fixed E→M→H) | Speed | Ratio | Mastery Init (0.5 exp) |
|---|---|---|---|---|
| 5/5 correct | 3/3 correct | Fast | 100% | 90% (capped) |
| 5/5 correct | 3/3 correct | Normal | 80% | 82.1% |
| 5/5 correct | 3/3 correct (bonus fast) | Mixed | 88% | 85.4% |
| 5/5 correct | 2/3 correct (miss Hard) | Normal | 65% | 75.5% |
| 5/5 correct | 1/3 correct (miss Med+Hard) | Normal | 55% | 70.6% |
| 5/5 correct | 0/3 correct | Normal | 50% | 68.0% |
| 4/5 correct | 3/3 correct | Normal | 70% | 77.8% |
| 3/5 correct | 3/3 correct | Normal | 60% | 73.1% |
| 2/5 correct | 3/3 correct | Normal | 50% | 68.0% |
| 0/5 correct | 0/3 correct | Any | 0% | 15% (floor) |

Note: with variable-N batches, a batch larger than 8 questions (e.g., 6 threshold + 3 bonus = 9 total) uses the same formula with the larger N folded into `Σ question_score` and `Σ question_max` — no separate table needed, since the ratio-based formula scales naturally to any N.

---

## Calibration

*Unchanged.*

When all 8 domains have reached the unlock threshold, the diagnostic score is replaced by the mastery-composite predicted score. From this point forward the predicted score updates in real time after every answer.

---

## Predicted Score (Post-Calibration)

### Per-Domain Score — carried over from v2, unchanged since v2

```
Domain Score = 50 + 150 × mastery
```

| Mastery % | Domain Score |
|---|---|
| 0% | 50 |
| 30% | 95 |
| 50% | 125 |
| 60% | 140 |
| 70% | 155 |
| 80% | 170 |
| 90% | 185 |
| 100% | 200 |

50 is the literal SAT per-domain floor; 200 is the ceiling at 100% mastery. Every mastery point is worth exactly 1.5 predicted-score points, always — no interior sweet spot. (v2 replaced the old `mastery^1.4` convex formula, which produced a hidden, unintended sweet spot around 44% mastery where per-question score movement was maximized.)

### Section and Total Score

*Unchanged.*

- **Math score** = sum of 4 math domain scores → range 200–800
- **R&W score** = sum of 4 R&W domain scores → range 200–800
- **Predicted score** = Math score + R&W score → range 400–1600, rounded to nearest 10

---

## Difficulty Levels

*Unchanged.*

| Rating | Label | Expected Time |
|---|---|---|
| 1 | Easy | 30 seconds |
| 2 | Medium | 60 seconds |
| 3 | Hard | 90 seconds |

---

## Mastery Deltas — Base Values

### Gains (correct answers) — carried over from v2, unchanged since v2

| Difficulty | Base Gain |
|---|---|
| Easy (1) | +1.0% |
| Medium (2) | +2.0% |
| Hard (3) | +3.0% |

(Reduced proportionally from v1's 1.5% / 2.5% / 4.0% to lower the ceiling on max possible single-session movement.)

### Losses (incorrect answers)

*Base values unchanged since v1 — only the mastery-scaling term applied to them changed in v2 (see Loss Formula below).*

| Difficulty | Base Loss |
|---|---|
| Easy (1) | −3.0% |
| Medium (2) | −2.0% |
| Hard (3) | −1.0% |

---

## Mastery Ceilings and Floors

*Unchanged.*

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

## Time Factor — **[CHANGED SINCE V2: unified into one 5-tier table]**

**v1/v2 (old):** two structurally different tables — 5 tiers for correct answers, 3 tiers for incorrect answers, with different breakpoints.

**v3 (new):** a single set of 5 tiers with shared breakpoints, applied to both correct and incorrect answers, with mirrored factor values around the "on pace" center.

```
time_ratio = actual_time / expected_time
```

| Time Ratio | Correct → Time Factor | Incorrect → Time Factor |
|---|---|---|
| < 0.50 | 1.25 | 0.70 |
| 0.50 – 0.75 | 1.10 | 0.85 |
| 0.75 – 1.25 | 1.00 | 1.00 |
| 1.25 – 1.75 | 0.85 | 1.15 |
| > 1.75 | 0.70 | 1.30 |

**Why this changed:** the old incorrect-answer table only had 3 tiers and treated any ratio above 1.25 identically (flat 1.30x), which didn't distinguish "slightly slow and wrong" from "very slow and wrong." The correct-answer column is untouched from v1. The incorrect-answer column keeps its original center value (1.00 at on-pace) and mirrors the correct-answer curve's shape outward in both directions: a rushed wrong answer is treated more like a slip (down to 0.70x), while a slow, deliberated-but-still-wrong answer signals a real gap and costs more (up to 1.30x).

Note: because the middle tier (0.75–1.25 ratio → 1.00 factor) is unchanged from v1/v2 in both directions, any calculation using "Normal" speed for incorrect answers is unaffected by this change. Only Fast/Slow incorrect answers are affected.

---

## Momentum

*Unchanged.*

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

### Gains (correct answers) — carried over from v2, unchanged since v2

Gains scale progressively — the closer mastery is to 100%, the smaller the gain per correct answer. This makes high mastery genuinely hard to earn.

```
effective_gain = base_gain × (1 − mastery)^0.5 × time_factor × momentum
```

`base_gain` uses 1.0% / 2.0% / 3.0% (Easy/Medium/Hard).

The scaling factor `(1 − mastery)^0.5` at key mastery levels:

| Mastery | Scale Factor |
|---|---|
| 15% | 0.922 |
| 50% | 0.707 |
| 75% | 0.500 |
| 90% | 0.316 |
| 95% | 0.224 |
| 99% | 0.100 |

**Hard Correct Fast effective gain at key mastery levels:**

| Mastery | Effective Gain |
|---|---|
| 15% | 3.46% |
| 50% | 2.65% |
| 75% | 1.88% |
| 90% | 1.18% |
| 95% | 0.84% |
| 99% | 0.38% |

### Losses (incorrect answers) — carried over from v2, unchanged since v2

```
mastery_loss = base_loss × time_factor × (0.5 + (1 − (1 − mastery)^0.5))
```

**Why this exists:** losses were originally flat (unscaled by mastery at all). The design intent is that a correct answer should matter less as mastery rises, and an incorrect answer should matter *more* as mastery rises — so high mastery is genuinely fragile and must be actively maintained, not just earned once.

Two mirror candidates were rejected before landing here: `mastery^0.5` decelerates near 100% (wrong direction), and the pure reflection `1 − (1 − mastery)^0.5` alone reaches zero penalty at 0% mastery (a beginner missing an Easy question would face no consequence). The adopted formula adds a fixed 0.5x floor to the reflected curve, ranging smoothly from 0.5x at 0% mastery to 1.5x at 100% — the same 0.5x–1.5x range as a simpler linear version, but ramping increasingly sharply in the final stretch toward 100%.

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

**Effective loss by difficulty, floors applied, Normal time (base losses: Easy −3.0%, Medium −2.0%, Hard −1.0%):**

*Unaffected by the v3 time factor change, since Normal-speed incorrect answers still resolve to a 1.00 time factor in both versions.*

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

**Note on Easy-question asymmetry (unchanged, flagged for awareness):** Easy questions have a gain ceiling at 50% mastery (no gain above it) but no loss floor at all. Above 75–80% mastery, an Easy question is pure downside — zero possible gain, and loss growing toward −4.5% at the mastery ceiling. This is intentional: a high-mastery user slipping on a below-level question is expected to feel it.

### Questions to Reach 100% from Initialization Cap (hard correct)

*Not recalculated in this revision — figures below are the v1 estimate (base gain 4.0%) and are now stale given the v2 base gain reduction to 3.0%. Expect somewhat more questions needed than shown. Flag if exact updated counts are wanted.*

| Speed | Questions Needed (stale v1 estimate) |
|---|---|
| Fast | 11 |
| Normal | 14 |
| Slow | 21 |

Mastery is hard-capped at 0–100%.

---

## Mastery Decay

*Unchanged.*

Mastery decays per domain independently based on inactivity in that specific domain. Decay only applies to domains that have been initialized — uninitialized domains are unaffected.

- Decay begins after **3 days** of no questions answered in a domain
- Rate: **−2% per week** of inactivity, applied continuously
- Floor: **30%** — mastery cannot decay below this value
- Decay pauses immediately when any question in that domain is answered

---

## Session/Domain Mastery-Delta Cap — Explicitly Rejected

**This is not an open item. It was proposed and deliberately turned down.**

During the v2 review, a hard per-domain-per-session cap on total mastery movement (e.g., ±15 mastery-points per domain per session, applied as a clamp after all per-question deltas are summed) was proposed as a structural fix for marathon-session scenarios — e.g., a 50-question Power Up drilling session compounding into a very large single-day score swing regardless of how gentle the per-question curve is.

**Decision: rejected.** The stated reasoning is that this mechanism would feel bad to users and would likely be rejected by them — an invisible ceiling silently capping earned progress reads as arbitrary and punitive, especially for engaged Power Up users doing exactly the kind of extended practice the product wants to reward. The v2 formula changes (linear domain score, reduced base gains, accelerating loss curve) are left to stand on their own as the full answer to the movement problem. No cap mechanism should be implemented; if marathon-session movement resurfaces as a concern, it should be solved some other way, not with this mechanism.

---

## Reference: Max Session Movement (Daily 5, 5 questions)

*Carried over from v2. Note: these figures were computed before the exponent/time-factor changes above and have not been re-verified against them — the Daily 5 scenarios described use post-initialization delta formulas (gain/loss), which are unaffected by the mastery-init-exponent change, but may be marginally affected by the unified time factor table if the "slow" incorrect scenario falls in a different tier than originally assumed. Treat as directionally correct, not exact.*

| Scenario | Approx. Total Points |
|---|---|
| Max gain — Daily 5, boundary case (Hard/Fast/max momentum, mastery → 0%, spread across 5 domains) | ~42 pts |
| Max loss — Daily 5, boundary case (Easy/Slow, mastery → 100%, spread across 5 domains) | ~44 pts |
| Typical "great but not extreme" day (5 Medium/correct/Normal time, 50% mastery, max momentum) | ~16 pts |

Gain and loss ceilings are approximately symmetric and both occur predictably at mastery boundaries (0% or 100%) rather than at a hidden interior point.
