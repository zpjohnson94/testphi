# TestPhi Scoring Algorithm Spec

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

Each domain reaches its threshold when **5 questions** have been answered in that domain. The 2 diagnostic questions per domain count toward this threshold, so 3 additional practice questions are needed after the diagnostic.

At the threshold, the bonus round triggers — mastery does not unlock immediately.

**Variable-N note:** the threshold check does not always land exactly at 5. If a session serves multiple domain-specific questions in a single pass (e.g. Daily 5 containing 2 questions from a domain that already had 4 threshold questions answered), the domain can pass through the 5-question threshold before the bonus round is triggered — landing at 6, 7, or more threshold questions answered by the time the bonus round actually fires. When this happens, the batch grows to include all threshold questions actually answered before the bonus round begins, rather than being capped at exactly 5. See **Batch Composition** below for how this affects the initialization calculation.

---

## Bonus Round

When a domain hits the 5-question threshold, a bonus round of 3 domain-specific questions is served before mastery unlocks. The questions are always delivered in this fixed order:

1. **Easy**
2. **Medium**
3. **Hard**

The escalating difficulty is intentional — confidence builder, expected challenge, climax question. All 3 bonus questions count toward the mastery initialization batch.

The bonus round persists if abandoned mid-session. It remains queued until completed, even across sessions. Mastery does not initialize until all 3 are answered.

Free users receive domain-specific bonus round questions as a special exception to the universal daily question format.

---

## Mastery Initialization (Batch)

When the bonus round is completed, mastery is initialized using all questions from the threshold portion collectively plus the 3 bonus questions. This is a one-time calibration calculation. The delta system takes over from the initialized value for all subsequent questions.

### Batch Composition (typical case — exactly 5 threshold questions)

| Source | Count | Difficulty |
|---|---|---|
| Diagnostic | 2 | Medium (always) |
| Practice | 3 | Variable |
| Bonus round | 3 | 1 Easy + 1 Medium + 1 Hard (always) |
| **Total** | **8** | |

### Variable-N Batch Composition

The threshold portion of the batch is not hard-capped at 5. It includes **however many threshold questions were actually answered** before the bonus round triggered (diagnostic questions + practice questions, in whatever count actually occurred — 5, 6, 7, etc.), plus the fixed 3 bonus questions. The formula below scales naturally to this: both `performance_ratio`'s numerator and denominator sum over the real batch, whatever its size, rather than assuming a fixed 8-question total. No separate formula is needed for the variable-N case — it's the same calculation applied to a larger `batch_question_ids` array.

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

mastery_init = 0.15 + 0.75 × performance_ratio^0.5
```

- **Floor: 15%** — minimum initialized mastery regardless of performance
- **Cap: 90%** — maximum initialized mastery regardless of performance; reaching 100% requires sustained practice after unlock
- Total max possible score for the typical 8-question batch: **(2×2 + 3×2 + 1×1 + 1×2 + 1×3) × 1.25 = 20 points**. For variable-N batches, this scales up proportionally with each additional threshold question included.

### Reference Table

*Assumes practice questions are Medium difficulty. Hard practice questions shift ratio and mastery upward. Table reflects the 8-question typical batch case.*

| Threshold (5q) | Bonus Round (3q) | Speed | Ratio | Mastery Init |
|---|---|---|---|---|
| 5/5 correct | 3/3 correct | Fast | 100% | 90% |
| 5/5 correct | 3/3 correct | Normal | 80% | 82% |
| 5/5 correct | 3/3 correct (bonus fast) | Mixed | 88% | 85% |
| 5/5 correct | 2/3 correct (miss hard) | Normal | 65% | 75% |
| 5/5 correct | 1/3 correct (miss M+H) | Normal | 55% | 71% |
| 5/5 correct | 0/3 correct | Normal | 50% | 68% |
| 4/5 correct | 3/3 correct | Normal | 70% | 78% |
| 3/5 correct | 3/3 correct | Normal | 60% | 73% |
| 2/5 correct | 3/3 correct | Normal | 50% | 68% |
| 0/5 correct | 0/3 correct | Any | 0% | 15% |

---

## Calibration

When all 8 domains have reached the unlock threshold, the diagnostic score is replaced by the mastery-composite predicted score. From this point forward the predicted score updates in real time after every answer.

---

## Predicted Score (Post-Calibration)

### Per-Domain Score

```
Domain Score = 50 + 150 × mastery^1.4
```

| Mastery % | Domain Score |
|---|---|
| 0% | 50 |
| 30% | 78 |
| 50% | 107 |
| 60% | 122 |
| 70% | 136 |
| 80% | 152 |
| 90% | 179 |
| 100% | 200 |

### Section and Total Score

- **Math score** = sum of 4 math domain scores → range 200–800
- **R&W score** = sum of 4 R&W domain scores → range 200–800
- **Predicted score** = Math score + R&W score → range 400–1600, rounded to nearest 10

---

## Difficulty Levels

| Rating | Label | Expected Time |
|---|---|---|
| 1 | Easy | 30 seconds |
| 2 | Medium | 60 seconds |
| 3 | Hard | 90 seconds |

---

## Mastery Deltas — Base Values

### Gains (correct answers)

| Difficulty | Base Gain |
|---|---|
| Easy (1) | +1.5% |
| Medium (2) | +2.5% |
| Hard (3) | +4.0% |

### Losses (incorrect answers)

| Difficulty | Base Loss |
|---|---|
| Easy (1) | −3.0% |
| Medium (2) | −2.0% |
| Hard (3) | −1.0% |

---

## Mastery Ceilings and Floors

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
| < 0.50 | 0.70 |
| 0.50 – 0.75 | 0.85 |
| 0.75 – 1.25 | 1.00 |
| 1.25 – 1.75 | 1.15 |
| > 1.75 | 1.30 |

---

## Momentum

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

### Gains (correct answers)

Gains scale progressively — the closer mastery is to 100%, the smaller the gain per correct answer. This makes high mastery genuinely hard to earn.

```
effective_gain = base_gain × (1 − mastery)^0.5 × time_factor × momentum
```

The scaling factor `(1 − mastery)^0.5` at key mastery levels:

| Mastery | Scale Factor | Hard Correct Fast Effective Gain |
|---|---|---|
| 15% | 0.922 | 4.61% |
| 50% | 0.707 | 3.54% |
| 75% | 0.500 | 2.50% |
| 90% | 0.316 | 1.58% |
| 95% | 0.224 | 1.12% |
| 99% | 0.100 | 0.50% |

### Losses (incorrect answers)

Losses are not scaled — the base loss applies regardless of mastery level.

```
mastery_loss = base_loss × time_factor
```

### Questions to Reach 100% from Initialization Cap (hard correct)

| Speed | Questions Needed |
|---|---|
| Fast | 11 |
| Normal | 14 |
| Slow | 21 |

Mastery is hard-capped at 0–100%.

---

## Mastery Decay

Mastery decays per domain independently based on inactivity in that specific domain. Decay only applies to domains that have been initialized — uninitialized domains are unaffected.

- Decay begins after **3 days** of no questions answered in a domain
- Rate: **−2% per week** of inactivity, applied continuously
- Floor: **30%** — mastery cannot decay below this value
- Decay pauses immediately when any question in that domain is answered
