## Problem

The current signup flow doesn't create real accounts:

- `/signup` collects name+email into the `signups` marketing table but never calls Supabase auth. The "account" doesn't exist.
- After `/signup → /plans`, "Continue with Free" routes to `/home`, which is protected — the user is bounced to `/auth` and asked for their email again (magic link).
- No Google option anywhere, despite Lovable Cloud defaults.

## Plan

### 1. `/signup` becomes real account creation

Rewrite `src/routes/signup.tsx` with:
- Name, email, password fields (zod-validated: email format, password ≥ 8 chars).
- "Continue with Google" button using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`.
- On email submit: `supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin + "/auth/callback" } })`.
- Keep the existing `submitSignup` call so marketing capture still happens (fire-and-forget after auth succeeds).
- On success (session returned immediately, since email confirmation is currently off): navigate to `/plans`.
- If Supabase is configured to require email confirmation later, show a "check your email" state instead.
- Link at bottom: "Already have an account? Sign in" → `/auth`.

The existing `handle_new_user` DB trigger already creates the `profiles` row from `raw_user_meta_data.name`, so no schema work is needed.

### 2. Add a public `/auth/callback` route

New file `src/routes/auth.callback.tsx`:
- Public route (SSR off) that waits for `supabase.auth.getSession()` / `onAuthStateChange`.
- Once a session exists, navigate to `/plans` for brand-new users or `/home` for returning users. We can detect "new" by whether `sessionStorage` has a `post_signup_pending` flag set on `/signup` submit; otherwise default to `/home`.
- Renders a minimal "Signing you in…" spinner.

This is the OAuth `redirect_uri` target and satisfies the rule that OAuth must not return directly into a protected route.

### 3. `/auth` becomes sign-in only

Rewrite `src/routes/auth.tsx`:
- Email + password sign-in form (`supabase.auth.signInWithPassword`).
- "Continue with Google" button (same `lovable.auth.signInWithOAuth` call).
- Small "Forgot password?" link → `/auth/forgot` (new minimal route that calls `resetPasswordForEmail` with `redirectTo: origin + "/reset-password"`).
- New `/reset-password` route that reads the recovery token and calls `supabase.auth.updateUser({ password })`.
- Keep the existing "Preview as demo user" button.
- Remove the magic-link flow (superseded by password + Google) unless you'd rather keep it — say the word and I'll leave it as a third option.

### 4. Enable Google provider

Call `supabase--configure_social_auth` with `providers: ["google"]` in the same change so first click doesn't error with "Unsupported provider". Email/password stays enabled.

### 5. Plans routing stays as-is

`/plans` "Continue with Free" → `/home` now works because the user has a real session. Power Up still goes to `/coming-soon`.

## Files

- edit `src/routes/signup.tsx` — real signup form
- edit `src/routes/auth.tsx` — password + Google sign-in
- new `src/routes/auth.callback.tsx` — OAuth landing
- new `src/routes/auth.forgot.tsx` — request reset email
- new `src/routes/reset-password.tsx` — set new password
- call `supabase--configure_social_auth` for Google

## Out of scope

- Email confirmation / verification UX (assumes current auto-confirm setting; happy to add if you want it required).
- Password strength meter, CAPTCHA, rate limiting.
- Migrating the `signups` marketing table into `profiles` — kept separate as today.
