## Pre-launch fixes for fake-door test

Small code changes to tighten up the funnel and make shared links look right. GA4 dashboard config and the actual publish step are yours to do after this.

### 1. Fix landing "Already have an account? Sign in" link
`src/routes/index.tsx` line ~91 — change `to="/dashboard"` to `to="/diagnostic"` so cold visitors stay in the funnel. Keep the existing `cta_click` tracking intact.

### 2. Gate `/dashboard` for unonboarded visitors
`src/routes/dashboard.tsx` already redirects to `/diagnostic` when `!hasOnboarded`, but it does so inside a `useEffect` after a 50ms timeout — which means a flash of the dashboard UI. Tighten this:
- Render `null` (or a tiny loading state) while `!hasOnboarded` so nothing flashes.
- Keep the redirect logic.

This ensures anyone who pastes `/dashboard` directly gets pushed into the diagnostic.

### 3. Add Open Graph image for shared links
Currently no `og:image` anywhere — links shared on Reddit / Discord / DMs render as blank cards.
- Reuse `src/assets/logo.png` (or `journey-bg.png`) as the share image.
- In `src/routes/index.tsx` `head()`, add `og:image`, `og:image:width`, `og:image:height`, `twitter:card` (`summary_large_image`), `twitter:image`. Import the asset with `?url` so Vite gives a stable URL.
- Also add `og:url` and `og:type` (`website`).

### 4. Add a favicon
No favicon currently. Add a `link rel="icon"` in `src/routes/__root.tsx` head pointing at the imported `logo.png` URL. Quick win — looks unfinished without it.

### 5. Verify `/plans` and `/signup` titles render
Spot-check after build — both already have unique `<title>` and meta description, no change needed unless something looks off.

### Out of scope (you'll do these manually)
- Click Publish, then re-run GA4 "Test Installation" against the published `.lovable.app` URL.
- In GA4 Admin → Events, mark `diagnostic_complete`, `signup_submit`, `waitlist_opt_in` as key events.
- Walk the funnel once in incognito and confirm GA4 Realtime shows each step.
- Append `?utm_source=...&utm_campaign=fakedoor_v1` to whatever link you share.
- (Optional, Pro plan) Hide the "Edit with Lovable" badge on the published site.

### Files touched
- `src/routes/index.tsx` — fix sign-in link, add OG tags
- `src/routes/dashboard.tsx` — gate render on `hasOnboarded`
- `src/routes/__root.tsx` — favicon link
