## Pass 3 — Question Bank Integration

Wires the `questions` table to real content and switches Daily 5 to a universal, pre-generated set. Bonus rounds stay adaptive. Diagnostic stays fully decoupled and hardcoded.

### 1. Schema changes

Migration adds:

- `questions.is_active boolean not null default true` — retirement flag (append-only; never hard-delete).
- `questions.passage_group_id uuid null` and `questions.diagram_group_id uuid null` — nullable now, populated later. Indexed for grouped-render lookups.
- `questions.skill text null` — mirror of `payload.skill` for cheap filtering. Optional, can also live only in payload.
- New table `daily_sets`:

  ```text
  set_date       date primary key
  question_ids   uuid[]  -- exactly 5, ordered
  generated_at   timestamptz default now()
  ```

  GRANTs: `SELECT` to `authenticated` (Daily 5 fetch), `ALL` to `service_role`. RLS on, single policy `for select using (true)` for authenticated. Writes only via service role from the batch generator.

- Frozen `questions.payload` shape (documented in a comment on the column):

  ```json
  {
    "prompt": "...",
    "choices": ["...","...","...","..."],
    "correctIndex": 0,
    "skill": "algebra",
    "passage_group_id": null,
    "diagram_group_id": null
  }
  ```

  No `correctWeight`/`incorrectWeight` — those are derived at answer-time in `scoring.ts` from difficulty + mastery ceiling/floor + time factor + momentum. If they ever slip into a seeded payload, seeding strips them.

### 2. Question bank seeding

New folder `supabase/seed/questions/` holds the bank JSON files (one file per domain or one combined file — TBD when bank arrives). A migration reads them via `COPY … FROM STDIN` equivalent (actually `INSERT … ON CONFLICT (id) DO UPDATE`) so re-running is idempotent and edits to the JSON reseed on next migration. Each row:

- `id` = bank ID (text, from the bank file).
- `domain_id` = one of the 8 known IDs (`math-algebra`, `math-advanced`, `math-data`, `math-geo`, `rw-info`, `rw-craft`, `rw-expr`, `rw-conv`).
- `difficulty` = 1/2/3 from bank.
- `expected_seconds` = derived from difficulty via `expectedSecondsFor()` (30/60/90) unless the bank overrides.
- `payload` = strict shape above.

### 3. Daily 5 — universal set

New server function `getTodayDailySet` (auth required):

1. Compute `today = current_date` in UTC (server-side, `select current_date`).
2. `select question_ids from daily_sets where set_date = today`.
3. If missing (batch job hasn't run / gap), fall back to on-the-fly generation using the same rule set below and insert the row so all users on that day get the same 5.
4. Fetch the 5 `questions` rows in the stored order and return prompt/choices/domain/difficulty/expected_seconds.

`pickDailyQuestions` (per-user, mastery-aware) is deleted for Daily 5. Bonus-round selection stays adaptive and continues to read `bonusStep` + domain mastery — unchanged.

`daily.question.$n.tsx` and `daily.complete.tsx` switch from local `QUESTIONS` to the server-fetched daily set. `applySessionFn` continues to persist answers and update mastery/momentum; it uses `question_id` from the daily set (real bank IDs), which lets historical `answers` rows resolve to bank rows forever.

### 4. Daily set generator (batch)

New TanStack server route `POST /api/public/hooks/generate-daily-sets` (secured via `apikey` header with the anon key, per the standard cron pattern). Behavior:

- Generates rows for the next 30 days that don't yet exist in `daily_sets`.
- For each date, picks 5 questions using:
  - **Difficulty shape:** 2 Easy + 2 Medium + 1 Hard.
  - **Section mix:** alternate 3M/2RW and 2M/3RW day over day.
  - **Domain rotation:** deterministic 2-week cycle across the 8 domains — each domain appears at least twice per 16-day window.
  - **No-repeat:** exclude any `question_id` present in any prior `daily_sets` row until the eligible pool for a slot is exhausted, then allow recycling.
  - **Active only:** `where is_active = true`.
- Deterministic per `set_date` seed so re-runs produce the same set until the pool changes.

Scheduled via `pg_cron` daily at 03:00 UTC calling the endpoint. One-shot manual trigger endpoint also usable for backfill.

### 5. Retirement flow

No UI. Retirement is a manual SQL step: `update questions set is_active = false where id = '…'`. `answers.question_id` remains valid. Already-generated `daily_sets` rows are not rewritten — retirement takes effect for future generations only.

### 6. Diagnostic — no change

`migrateAnonymousDiagnostic` continues to reference the hardcoded `QUESTIONS` array in `src/lib/diagnostic.ts`. Diagnostic never reads from the `questions` table. When the finalized 15-question diagnostic set arrives, it replaces the hardcoded array — no schema or server-fn change.

### Files touched

- `supabase/migrations/<ts>_questions_bank.sql` — schema deltas + `daily_sets` + GRANTs + RLS.
- `supabase/migrations/<ts>_seed_questions.sql` — bulk upsert from bank JSON (added once the bank file arrives).
- `src/lib/dailySet.functions.ts` — new `getTodayDailySet` server fn.
- `src/lib/free.functions.ts` — remove per-user Daily 5 picker; keep bonus adaptive path.
- `src/lib/useFree.ts` — add `useTodayDailySet()` hook.
- `src/routes/_authenticated/daily.question.$n.tsx` and `daily.complete.tsx` — read from `useTodayDailySet()` instead of local `QUESTIONS`.
- `src/routes/api/public/hooks/generate-daily-sets.ts` — batch generator route.
- One `supabase--insert` call to install the `pg_cron` schedule (kept out of migrations because it holds the anon key URL).

### Open items (not blocking this pass)

- Exact bank file layout (one JSON vs per-domain) — align once you drop the file.
- Whether Daily 5 should also enforce a "no domain twice in one day" rule inside the 5.
- Diagnostic count 15 vs 16 — tracked separately, not touched here.
