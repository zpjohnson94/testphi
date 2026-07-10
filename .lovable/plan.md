## Why it feels slow today

The `/daily/complete` screen shows the spinner until one big server call — `finalizeDailySession` — resolves. That call:

1. Runs `loadFreeState` (3 DB reads) — serially before anything else
2. Then fetches today's `daily_attempts` (4th DB read)
3. Then loads today's daily set
4. Then inserts a `sessions` row
5. Then inserts 5 `answers` rows
6. Then does 2 upserts to persist scoring + mastery

Only *after* all of that does the UI unblock. On top of that, the reveal animation itself adds ~2s of staggered fades (260ms × ~8 sections) before the "Finish Session" button appears.

And critically: none of this starts until the user taps "Next" on Q5 and lands on `/daily/complete`. The network round-trip is entirely on the critical path.

## Plan

### 1. Prewarm finalize on Q5 grade (biggest win)

In `daily.question.$n.tsx`, as soon as Q5 is graded successfully, kick off `finalizeDailySession` in the background and stash the promise/result on the query cache (e.g. under a `["dailyFinalize", today]` key). The `/daily/complete` route reads from that key instead of firing its own mutation. By the time the user reads the correct/incorrect feedback for Q5 and taps Next, the finalize call is usually already done — the interstitial either flashes or skips entirely.

Guardrails:
- If the user refreshes `/daily/complete` directly (no cached promise), fall back to today's existing behavior of firing the mutation on mount.
- Keep `submittedRef` idempotency so we never double-finalize.

### 2. Parallelize server work inside `finalizeDailySession`

In `src/lib/dailyAttempt.functions.ts`:
- Run `loadFreeState`, the `daily_attempts` fetch, and `getTodayDailySet()` concurrently with `Promise.all` instead of serially.
- After computing `next`, run the 3 writes concurrently: `sessions` insert (needed for its id), then in parallel the `answers` insert and `persistFreeState` upserts.
- Return the `FreeState` response as soon as `persistFreeState` resolves; treat the `answers` insert as fire-and-forget (nothing in the UI reads it in this session — the review modal reads from the client cache of served questions). If we want strict durability, still `await` it but in parallel with persistFreeState.

Expected: ~30–50% reduction in server time (from ~4 serial round-trips to ~2).

### 3. Trim the reveal choreography

In `daily.complete.tsx` `CompleteContent`:
- Drop the per-step delay from 260ms → 120ms.
- Reveal all domain rows together instead of one-per-step (they're the bulk of the steps).
- Show the "Finish Session" button as soon as the last conditional section (momentum/streak) has faded in, not on an extra timer beat.

This shaves ~1.5s off perceived wait even when finalize is instant.

### 4. Better placeholder while we wait

While the (now hopefully brief) call is still pending, replace the generic spinner with an optimistic scaffold: predicted score frame with a subtle shimmer, and the missed-count card computed from the local cache of served questions (we already know which of the 5 are correct client-side). If finalize resolves in under ~150ms, skip the scaffold entirely to avoid a flash.

### Technical notes

- Files touched: `src/routes/_authenticated/daily.question.$n.tsx` (prewarm), `src/routes/_authenticated/daily.complete.tsx` (read prewarmed result, reveal timing, optimistic scaffold), `src/lib/dailyAttempt.functions.ts` (parallelize), and a small helper in `src/lib/useFree.ts` for the shared cache key.
- No schema or RLS changes.
- No behavior change to grading correctness or persisted state — same writes, just concurrent and started sooner.
- Error handling stays the same: existing retry/"stuck after 20s" fallback UI still applies if the prewarmed call fails.

### Out of scope

- Restructuring finalize into per-question incremental aggregation (bigger refactor; the wins above should be enough).
- Changing the visual design of the complete screen.