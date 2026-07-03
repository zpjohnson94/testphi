# Question Bank Integration — Serving & Grading

## Decisions locked
- **Grading cadence:** per-question, on submit (not batched at end of session).
- **Shuffle statefulness:** Option A — `daily_attempts` table stores the per-serve shuffle mapping and grade result.
- **Hardcoded fallback:** keep temporarily with dual-shape support (recommendation — flag if you want it deleted instead).

## New payload shape (from spec)
`questions.payload` (jsonb):
```
{ question, choices: {A,B,C,D}, correct: "A"|"B"|"C"|"D",
  passage_group_id?, diagram_group_id? }
```
- `skill` column dropped (unused).
- Add `questions.source text default 'ai_generated'`.
- IDs stay text (e.g. `ALG-M-004`); existing `text` columns are fine.

## Migration
1. `ALTER TABLE questions` — drop `skill`, add `source`.
2. `CREATE TABLE daily_attempts`:
   - `id uuid pk`, `user_id uuid`, `set_date date`, `question_id text`,
     `slot smallint` (1–5), `shuffled_order text[]` (e.g. `['C','A','D','B']`),
     `correct_position smallint` (0–3), `selected_position smallint null`,
     `is_correct bool null`, `elapsed_ms int null`,
     `served_at timestamptz`, `answered_at timestamptz null`.
   - Unique `(user_id, set_date, slot)`.
   - GRANTs for `authenticated` + `service_role`; RLS: user can select/insert/update own rows.

## Server functions
- **`serveDailyQuestion({ slot })`** — auth required.
  - Looks up today's `daily_sets.question_ids[slot]`.
  - Upserts a `daily_attempts` row: generates shuffle, stores `shuffled_order` + `correct_position` server-side.
  - Returns `{ questionId, slot, question, choices: [4 strings in shuffled order], domain, difficulty, expectedSeconds, attemptId }`. **No `correct` field leaves the server.**
  - If a row already exists for this slot (refresh), returns the same shuffle — never regrades or reshuffles once answered.
- **`gradeDailyAnswer({ attemptId, selectedPosition, elapsedMs })`** — auth required.
  - Loads the attempt, verifies ownership, rejects if already `answered_at`.
  - Computes `is_correct = shuffled_order[selectedPosition] === correct_letter`.
  - Persists `selected_position`, `is_correct`, `elapsed_ms`, `answered_at`.
  - Returns `{ isCorrect, correctPosition, explanation? }` for immediate UI feedback.
- **`finalizeDailySession()`** — called from the complete page.
  - Reads today's 5 `daily_attempts` for user, writes the `sessions` + `answers` rows, updates mastery/streak. Replaces client-computed `SessionResult` submission.

## Client changes
- `daily.question.$n.tsx`: calls `serveDailyQuestion({ slot: n })` on mount; on Submit calls `gradeDailyAnswer` and shows correct/incorrect immediately before Next.
- `daily.complete.tsx`: calls `finalizeDailySession()` instead of posting a client-built session.
- `freeUser.ts`: strip `isCorrect` computation and `SessionResult.isCorrect` field from the submission path; anonymous free-tier path (if kept) keeps client grading against local `QUESTIONS` only.
- `useFree.ts`: replace `useTodayDailySet` with per-slot `useDailyQuestion(slot)` + `useGradeAnswer()` mutation.

## Fallback handling (temporary)
`serveDailyQuestion` tries DB bank → deterministic generator → hardcoded `QUESTIONS`. Add a payload-shape adapter so old-shape hardcoded questions (`prompt`/`choices[]`/`correctIndex`) are normalized to the new shape before shuffling. Delete the fallback in a follow-up once the bank JSON is imported.

## Not in scope this pass
- Question bank JSON importer (separate pass once file arrives).
- Passage/diagram grouping UI (schema columns are ready; rendering later).
- Diagnostic question set (fully decoupled per prior decision).

## Files touched
- Migration: `questions` alter + `daily_attempts` create.
- New: `src/lib/dailyAttempt.functions.ts` (serve/grade/finalize).
- Edit: `src/lib/dailySet.functions.ts` (payload adapter, remove client-facing `correctIndex`), `src/lib/useFree.ts`, `src/lib/freeUser.ts`, `src/lib/free.functions.ts`, `src/routes/_authenticated/daily.question.$n.tsx`, `src/routes/_authenticated/daily.complete.tsx`.
