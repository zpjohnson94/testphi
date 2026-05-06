## Goal

Wire up real Google sign-in on `/signup` so that one-click Google users land in the same `signups` table as email signups, and continue through the rest of the funnel (`/plans`, `/coming-soon`) just like email users.

## 1. Enable Google in Lovable Cloud

The provider must be turned on once in **Cloud → Users & Auth → Sign-in methods → Google → Enable (Managed)**. No credentials needed — Lovable's managed OAuth handles it. I'll surface a button in the response so you can do this in one click.

## 2. Wire the Lovable auth SDK

The `@lovable.dev/cloud-auth-js` package is already installed. Add a tiny wrapper at `src/integrations/lovable/index.ts`:

```ts
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
export const lovable = { auth: createLovableAuth() };
```

This is the standard pattern for Lovable-managed social auth. Per project rules, this folder is agent-managed — no manual edits to its contents beyond this file.

## 3. Hook up the "Continue with Google" button on `/signup`

Replace the existing analytics-only `onClick` with a real flow:

1. Fire existing `signup_click { method: "google" }` GA event.
2. Call `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/signup" })`.
3. If `result.redirected` → return (browser navigates to Google).
4. If `result.error` → show an inline error message under the button.
5. If tokens come back → the Supabase session is set automatically. Fetch the user via `supabase.auth.getUser()`, extract `email` and `name` (from `user_metadata.full_name` or `name`), then:
   - Save `signup_email` to `localStorage` (so `/plans` and `/coming-soon` can update the same row).
   - Call the existing `submitSignup` server function with `{ email, name, diagnostic_score: loadDiag(), referrer: document.referrer }`.
   - Fire GA `signup_submit { method: "google" }`.
   - Navigate to `/plans`.

## 4. Handle the OAuth return trip

When Google bounces the user back to `/signup?...`, the Lovable SDK will resolve the `signInWithOAuth` promise with tokens. The flow above captures that. To be safe, also add a `useEffect` on mount that:

- Reads `supabase.auth.getSession()`.
- If a session exists AND no `signup_email` is yet stored AND we haven't recorded this user before in this browser session, runs the same "extract email/name → submitSignup → navigate to /plans" logic.

This covers the case where the redirect lands the user back on `/signup` and the SDK has already set the session before our promise handler runs.

## 5. No DB or schema changes

The existing `signups` table already has everything we need (`email`, `name`, `diagnostic_score`, `referrer`, `user_agent`, `ip_address`). Google signups will just appear as new rows like any other lead. If the same email later submits the password form, the upsert merges them into one row.

## Out of scope

- Real authenticated app surface (dashboard gating, profile rows, RLS-protected data). The Google session sets up Supabase auth, but the rest of the app continues to work as-is — this is purely lead capture for now.
- Apple sign-in (easy to add later — same SDK, just `"apple"` instead of `"google"`).
- Storing the Google `sub`/user-id in the `signups` table (the email is enough for outreach).

## Technical details

- Files touched: `src/integrations/lovable/index.ts` (new), `src/routes/signup.tsx` (Google handler + return-trip effect).
- Auth state: we rely on `supabase.auth.getUser()` after tokens land. The browser Supabase client already persists the session in `localStorage`.
- Fallback: if `supabase.auth.getUser()` returns no email (shouldn't happen for Google, scope `email` is included by default), we skip the `submitSignup` call and still navigate to `/plans` so UX isn't blocked.
- Error UX: a small `text-red-400` line under the Google button if OAuth fails (`result.error.message`), no toasts.
