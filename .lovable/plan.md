## What's actually wrong

Verified against the database:

- `battle_sets` has **0 rows** (no day has ever been generated).
- `battle_runs` has **0 rows** — not just fake runs, real runs too.
- `battle_fake_profiles` has 100 rows, so seeding is fine.
- `battle_runs.battle_date` has a foreign key to `battle_sets(set_date)`.

Root cause chain:

1. `ensureTodaysBattleSet()` writes today's `battle_sets` row using the **user-scoped** client (`context.supabase`). `battle_sets` has only a read policy for authenticated users, no insert/update policy, so the upsert is rejected by row-level security. The error is never checked, so it fails silently.
2. With no `battle_sets` row for today, every `battle_runs` insert violates the `battle_date` foreign key. Fake-run inserts swallow the error (`if (error) return;`), so 100 rows quietly become 0.
3. `getBattleLeaderboard` never calls `ensureFakeRunsForDay`, so opening the leaderboard alone never repairs the day.

## The fix

**1. Write the daily set with the admin client** (`src/lib/battle.functions.ts`)

- In `ensureTodaysBattleSet`, keep reading with the user client but perform the `battle_sets` upsert via `supabaseAdmin` (dynamically imported inside the handler path, as elsewhere in the file).
- Check the upsert error and throw a clear message instead of returning silently.

**2. Stop swallowing fake-run insert errors** (`ensureFakeRunsForDay`)

- Log/throw on insert error rather than `return;`, and make `devRegenerateFakeRuns` surface the error so the dev button reports failure instead of "inserted: 0".
- Have `ensureFakeRunsForDay` first make sure the day's `battle_sets` row exists (call the set generator if missing), so it can never hit the foreign key.

**3. Populate the leaderboard on view** (`getBattleLeaderboard`)

- Ensure today's set and fake runs exist before reading, so the leaderboard is populated even if the user never starts a battle.

**4. Backfill today**

- Run the dev "Generate fake runs" action (or an equivalent one-off) after the fix so today's leaderboard has its 100 entries immediately.

## Optional cleanup (recommended, ask before doing)

The `battle_runs.battle_date -> battle_sets.set_date` foreign key is what turned a soft failure into total data loss, and it adds no real value (a run is valid whether or not the set row is still around, and the FK cascades deletes). I'd suggest dropping it in a migration so a missing set can never silently wipe out runs again. This requires a database migration; say the word and I'll include it.

## Technical notes

Files touched: `src/lib/battle.functions.ts` only (plus one migration if we drop the foreign key). No UI changes needed — `battle.leaderboard.tsx` already renders fake profiles correctly once rows exist.
