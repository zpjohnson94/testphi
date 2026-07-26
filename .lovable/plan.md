## Battle Mode

A once-daily async race against a "ghost" — a replayed run from another user. Fully separate from Daily 5, mastery, momentum, and predicted score.

### Rules
- 2:00 clock, starts after a 3-2-1 countdown
- 3 wrong answers ends the run
- Score = questions correct; ties allowed
- One run per user per calendar day (DB unique constraint)
- Free for all users

### Data model (new tables, additive)

**`battle_sets`** — one row per day, frozen ordered array of 60 question ids.
- `date` (pk), `question_ids uuid[]`, `generated_at`

**`battle_runs`** — one row per user per day, immutable once completed.
- `id`, `user_id`, `battle_date`, `opponent_run_id` (nullable), `questions_correct`, `questions_wrong`, `total_time_ms`, `event_log jsonb`, `result` ('win'/'loss'/'tie'), `daily_rank`, `completed_at`
- Unique `(user_id, battle_date)`
- Index `(battle_date, questions_correct DESC, total_time_ms ASC)`
- RLS: read own runs + any run referenced as an `opponent_run_id`; insert own; no updates

**`battle_leaderboard_alerts`** — dedupe Top 100 alerts.
- `id`, `user_id`, `battle_date`, `rank`, `alerted_at`
- Unique `(user_id, battle_date)`
- RLS: read own; write service-role only

### Server functions (`src/lib/battle.functions.ts`)

- `getTodaysBattleSet()` — lazy generates today's `battle_sets` row if missing (random draw across 8 domains, ~even weighting, 60 questions); returns full question payloads in order
- `pickOpponent()` — most recent completed run today excluding self; falls back to most recent from prior day; null on first-ever day
- `startBattle()` — validates no existing run for `(user_id, today)`; returns `{ questions, opponent: { run_id, event_log, user: {name, avatar} } | null }`
- `finalizeBattleRun({ event_log, questions_correct, questions_wrong, total_time_ms, opponent_run_id })` — inserts `battle_runs`; computes `result` vs opponent; computes `daily_rank` (null if >100); if rank <=100 inserts `battle_leaderboard_alerts` on conflict do nothing; returns final row + total wins to date
- `getBattleStatus()` — has user completed today? total wins? — for home module state

### Daily set generation

Extend existing cron endpoint pattern: add `src/routes/api/public/hooks/generate-battle-sets.ts` mirroring `generate-daily-sets.ts`. Also lazy-generate on first request of the day inside `getTodaysBattleSet()` so it works without cron.

Schedule via `pg_cron` (insert tool) to POST once per day early UTC.

### UI

**Home module** — new card between Daily 5 and Momentum, styled like the other purple modules:
- Header: "Battle Mode"
- Subheader: "Go head-to-head with a random opponent to see who can answer more questions correctly in 2 minutes"
- CTA "Battle!" (or "Come back tomorrow" + wins-to-date when today's run is complete)

**Routes under `_authenticated/`**:
- `battle.intro.tsx` — pre-battle interstitial: both avatars + first names, "vs.", header "Let's battle!", then 3-2-1 countdown with motion
- `battle.play.tsx` — live battle screen: question + choices, running clock (counts up to 2:00), 3-box wrong counter for user, opponent indicator ("Opponent: Q4" + 3-box wrong counter advancing on a `setInterval` keyed to ghost `elapsed_ms`), submit button, correct/incorrect sfx reuse from Daily 5
- `battle.results.tsx` — final score, W/L/T vs opponent, running total wins, conditional Top 100 alert modal with share action

Prefetch opponent + questions in `battle.intro.tsx` loader so `battle.play.tsx` starts instantly.

### Copy convention
No em dashes. Match existing TestPhi tone.

### Out of scope
- No changes to mastery, predicted score, momentum, answers, or existing scoring
- No persistent ranking display; Top 100 is only surfaced when earned
- No live multiplayer; ghosts only

### Technical notes
- Ghost timing: since everyone that day answers the same frozen ordered question array, `event_log[i].question_index === i` maps directly onto the current user's progression — no cross-user question mapping needed
- Opponent indicator advances via `setInterval` reading ghost `event_log` against `Date.now() - battleStartMs`
- Wrong-answer cap enforced client-side and validated server-side in `finalizeBattleRun` (reject if `questions_wrong > 3` or `total_time_ms > 120500`)
- `daily_rank` computed with a windowed SQL query: `SELECT count(*)+1 FROM battle_runs WHERE battle_date = $1 AND (questions_correct, -total_time_ms) > (own.questions_correct, -own.total_time_ms)`; store null if > 100
