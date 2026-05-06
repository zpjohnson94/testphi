## Goal

Securely capture every email entered on `/signup`, along with the plan they pick on `/plans` and whether they kept the "Notify me" box checked on `/coming-soon`. Add a lightweight Privacy Policy page reachable from a subtle link on every page.

## 1. Enable Lovable Cloud (Supabase)

Right now there is no backend — the signup form just navigates to `/plans` and the waitlist box only writes to `localStorage`. To store emails durably and securely, we need to enable Lovable Cloud (one click, no config needed from you).

## 2. New `signups` table

Create a single table that captures the full funnel for one person:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto |
| `email` | citext, unique | normalized lowercase |
| `name` | text | from the signup form |
| `plan` | text | `free`, `power_up`, or `null` if they bailed before /plans |
| `billing` | text | `monthly` / `annual` (only meaningful for power_up) |
| `notify_opt_in` | boolean | from the coming-soon checkbox; defaults true |
| `diagnostic_score` | jsonb | snapshot of `loadDiag()` (target score, predicted score, weak skills) so outreach can be personalized |
| `referrer` | text | `document.referrer` at signup |
| `user_agent` | text | from request headers server-side |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | bumped on each upsert |

### Security (RLS)

- RLS **enabled**.
- **No** SELECT / UPDATE / DELETE policies for `anon` or `authenticated` — the table is write-only from the public perspective. Nobody can read the list from the browser, even by guessing the API.
- Inserts/updates only happen through a server function (see below) using the service-role client, which bypasses RLS safely.
- You (the project owner) can read the data anytime via the Cloud → Database viewer or by exporting CSV.

## 3. Server function: `submitSignup`

A `createServerFn` in `src/server/signups.functions.ts` that:

1. Validates input with Zod (`email` required + format, `name` ≤ 100 chars, optional `plan`/`billing`/`notify_opt_in`/`diagnostic_score`).
2. Reads `user-agent` and client IP via TanStack server utilities.
3. Upserts on `email` (so progressing through signup → plans → coming-soon updates the same row instead of creating duplicates), using `supabaseAdmin`.
4. Returns `{ ok: true }` only — never echoes other users' data.

A second tiny server function `updateSignup` takes `{ email, plan?, billing?, notify_opt_in? }` and patches the existing row. Used by `/plans` and `/coming-soon`.

## 4. Wire the three touchpoints

- **`/signup`** — on form submit, call `submitSignup({ name, email, diagnostic_score, referrer })` before navigating to `/plans`. Keep the existing `signup_submit` analytics event. Password field stays in the UI (it's collected but not stored anywhere yet — note: real auth comes later; we are intentionally NOT storing passwords in this table).
- **`/plans`** — when they click either "Get Power Up" or "Continue with Free", call `updateSignup({ email: lastEmail, plan, billing })`. We'll persist the email from the signup step in `localStorage` (key `signup_email`) so plans/coming-soon know who to update. Existing GA `cta_click` events stay.
- **`/coming-soon`** — replace the localStorage-only `waitlist` write with `updateSignup({ email: lastEmail, notify_opt_in })`. Keep `waitlist_opt_in` GA event.

If `signup_email` is missing (someone landed on /plans directly), the update calls just no-op silently — no errors, no broken UX.

## 5. Privacy Policy page

New route `src/routes/privacy.tsx` (`/privacy`) with a clean, lightweight policy covering:

- What we collect (email, name, diagnostic results, plan interest, opt-in choice, basic device info).
- Why (to email you when TestPhi launches and tailor onboarding).
- Who we share it with (nobody — stored on Lovable Cloud / Supabase; not sold).
- How to request deletion (email contact — placeholder `privacy@testphi.com`, you can change).
- Effective date.

Plain prose, same `topo-bg` styling as other routes, max-width readable column.

## 6. Subtle footer link on every page

Add a small `<Footer />` component (text-xs, muted lavender) with:

```
© 2026 TestPhi · Privacy
```

Render it inside `RootComponent` in `src/routes/__root.tsx` so it appears on every route automatically, positioned at the bottom of the viewport without disrupting existing layouts (a thin centered bar with `mt-auto` won't conflict because it lives outside the `<Outlet />`'s flex containers — it'll sit at the page bottom on short pages and below content on tall ones).

## Technical details

- Email normalization: `.toLowerCase().trim()` before insert; `citext` extension makes the unique constraint case-insensitive as a belt-and-suspenders.
- Upsert: `supabaseAdmin.from('signups').upsert({...}, { onConflict: 'email' })`.
- Server function file split: `src/server/signups.functions.ts` (RPC wrappers) + `src/server/signups.server.ts` (Supabase calls), per project's server-function authoring conventions.
- `useServerFn` hook used in components for proper React integration.
- No password storage anywhere — the password input on `/signup` remains UI-only until real auth is added later. Calling this out so there's no false sense of security.

## Out of scope

- Real authentication (Supabase Auth flows). The signup page stays a fake-door / lead capture for now.
- Admin dashboard inside the app to view leads — you'll use the Cloud database viewer.
- Email sending (no welcome email yet — leads sit in the table until you launch).
