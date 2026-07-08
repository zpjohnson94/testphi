## Fixes for Daily 5 flow

### 1. Batch-load all 5 questions up front

Add a new server function `serveDailySetBatch` in `src/lib/dailyAttempt.functions.ts` that returns all 5 `ServedQuestion` objects in one round trip (looping the same idempotent serve logic — reuses existing shuffles when present, inserts fresh attempts otherwise).

Add `useServeDailySetBatch()` in `src/lib/useFree.ts`. On mount of `/daily/question/$n` slot 1 (and on entry to the daily flow via `home` if we want it earlier — keep it in the question route to keep scope small), fire this once and prime the per-slot query cache via `queryClient.setQueryData(servedQuestionKey(i), q)` for each slot. Subsequent slot navigations then hit the cache instantly.

Keep `useServeDailyQuestion(slot)` as the read hook so no other refactor is required — it just resolves from primed cache.

### 2. Complete screen shows nothing

Two problems on `/daily/complete`:
- If `finalizeDailySession` errors (e.g. race where the last grade hasn't committed yet, or a transient failure), the current code silently `navigate({ to: "/home" })`. The user sees "nothing".
- While the mutation is in flight, the route renders an empty `topo-bg` div with no spinner.

Fix:
- Render a visible loading state ("Wrapping up your session…") while `finalize` is pending.
- On error, render an error card with a Retry button (re-invokes `finalize.mutate`) and a "Back to home" secondary action, instead of a silent redirect.
- Add a brief retry inside `finalize` handling: if the server throws `Session incomplete: N/5`, wait 400ms and retry once (covers the grade-not-yet-committed race).

### 3. Selection color treatment

In `src/routes/_authenticated/daily.question.$n.tsx`, decouple "submitted" (user clicked) from "graded" (server response arrived).

New local state `graded: boolean` set true only after `grade.mutateAsync` resolves. Style rules become:
- Not submitted → default lavender card
- Submitted, not yet graded, selected → **purple** fill (`rgba(168,85,247,0.25)` with `var(--neon)` border) — the current "selected-before-submit" style, held during the grade round-trip
- Graded + selected + correct → chartreuse (`--volt`) + `animate-pop`
- Graded + selected + incorrect → red + `animate-shake`
- Graded + correct choice highlighted regardless of selection

Since answers are now prefetched, `grade.mutateAsync` is the only network hop on click; the purple hold is naturally brief (~100–300ms), giving the "moment of purple" the user described before resolving to red or chartreuse.

### Technical notes

- Files touched: `src/lib/dailyAttempt.functions.ts` (add batch fn), `src/lib/useFree.ts` (add hook + priming helper), `src/routes/_authenticated/daily.question.$n.tsx` (prime cache on slot 1, add `graded` state, adjust style branches), `src/routes/_authenticated/daily.complete.tsx` (loading + error UI, single retry on incomplete-session error).
- No DB migrations. No changes to grading logic or scoring.
