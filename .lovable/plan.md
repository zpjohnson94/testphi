## Migrate TestPhi off localStorage to Lovable Cloud

Move all user data (scores, mastery, sessions, answers, streaks, momentum) from `localStorage` into the backend, behind magic-link auth. Diagnostic stays anonymous in `localStorage` until signup, then migrates.

### 1. Auth

- Add magic-link email auth (Supabase). Reuse existing email capture: entering email at the end of the diagnostic sends a magic link instead of a plain insert.
- New public route `/auth/callback` to hydrate the session, then redirect into `/home`.
- Wrap authenticated routes (`/home`, `/skill-map`, `/account`, `/daily/*`) under `src/routes/_authenticated/`. Managed layout gates them client-side.
- Root route: single `onAuthStateChange` listener → `router.invalidate()` on identity transitions.

### 2. Schema (Lovable Cloud)

Hot layer (per-user computed state, one row per user):
- `profiles` — name, email, avatar_id, plan
- `user_scoring_state` — momentum_needle, last_momentum_date, qualifying_days (jsonb), streak, last_daily_date, diagnostic_score, seeded
- `user_domain_mastery` — (user_id, domain_id), answered, initialized, mastery, last_answered_at, bonus_step, batch (jsonb of up to 8 entries)

Cold layer (immutable history):
- `sessions` — id, user_id, kind (`diagnostic`|`daily`|`drill`), started_at, completed_at, prev_overall, new_overall, delta, momentum_before/after, streak_before/after
- `answers` — id, session_id, user_id, question_id, domain_id, difficulty, correct, elapsed_seconds, is_bonus, answered_at

Support:
- `questions` — id (text, matches question bank IDs the user will provide), domain_id, difficulty, expected_seconds, payload (jsonb prompt/choices/answer). Seeded via migration once IDs arrive.
- All tables: GRANTs + RLS scoped to `auth.uid()`. `service_role` grants for admin ops.
- Trigger to auto-create `profiles` + `user_scoring_state` + 8 `user_domain_mastery` rows on new user signup.

### 3. Server functions (`src/lib/*.functions.ts`)

All wrap `requireSupabaseAuth`:
- `getFreeState` — returns hot state + snapshots. Applies decay + momentum recompute server-side (moved from `freeUser.ts`).
- `applySession({ results })` — inserts `sessions` + `answers` rows, updates mastery/momentum/streak atomically, returns new `LastSession` diff.
- `pickDailyQuestions` — server-side selection using current mastery + bonus-pending domains.
- `updateProfile({ name, avatarId })`.
- `migrateAnonymousDiagnostic({ diag })` — called once right after magic-link signup: replays diagnostic answers into `answers` + seeds domain batches. Idempotent (no-op if `seeded=true`).

Scoring math (`freeUser.ts` logic — initializeMastery, deltaFor, momentumMultiplier, computePredicted) moves into a shared `src/lib/scoring.ts` used only by server handlers.

### 4. Client

- Replace `loadFree()`/`saveFree()` with TanStack Query hooks: `useFreeState()`, `useApplySession()`, etc.
- `home.tsx`, `skill-map.tsx`, `account.tsx`, `daily.question.$n.tsx`, `daily.complete.tsx` refactored to read from Query cache instead of `localStorage`.
- Diagnostic flow (`/diagnostic/*`) unchanged — still stores answers in `localStorage`. On signup, `migrateAnonymousDiagnostic` is called and `localStorage` diag key is cleared.

### 5. Rollout

- Fake-door `/coming-soon` and `/plans` untouched (still just insert into `signups`).
- Existing `localStorage` users on the live site: on first sign-in after deploy, if `testphi:free:v2` exists locally we call `migrateAnonymousDiagnostic` with that data and then clear it. Best-effort — some device-locked users will start fresh.

### Order of operations

**Pass 1 (this turn after approval):** enable magic-link auth, ship schema + RLS + GRANTs + signup trigger, add `/auth` and `/auth/callback` routes, gate authenticated routes.

**Pass 2:** build server functions + move scoring math server-side, refactor client to Query, wire anonymous-diagnostic migration.

**Pass 3 (when you provide the question bank):** seed `questions` table via migration; switch `pickDailyQuestions` to read from DB.

### Open items to confirm before I start

- Question IDs: current questions are integers 1–15 hardcoded in `src/lib/diagnostic.ts`. Until your bank arrives, I'll keep the `questions` table empty and have server fns reference question metadata from the existing `QUESTIONS` constant (imported server-side). When you deliver the bank, we seed and swap. OK?
