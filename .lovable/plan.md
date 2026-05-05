## Wire up GA4 (G-M9WMJ97P5M)

Hardcoding the Measurement ID — it's a public identifier, safe in the codebase.

### 1. Inject the gtag snippet
In `src/routes/__root.tsx`, add to the root route's `head()`:
- `<script async src="https://www.googletagmanager.com/gtag/js?id=G-M9WMJ97P5M">`
- An inline init script that sets up `window.dataLayer`, defines `gtag()`, calls `gtag('js', new Date())` and `gtag('config', 'G-M9WMJ97P5M', { send_page_view: false })` (we'll fire pageviews manually on route change so SPA navigations get tracked).

### 2. Create `src/lib/analytics.ts`
Tiny helper, SSR-safe (no-op when `window` undefined):
- `trackEvent(name: string, params?: Record<string, any>)` → `window.gtag?.('event', name, params)`
- `trackPageView(path: string)` → `window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href })`
- TS declaration for `window.gtag` and `window.dataLayer`.

### 3. Auto pageviews on route change
In `src/router.tsx`, subscribe to router `onResolved` (or use `router.subscribe('onResolved', ...)`) and call `trackPageView(location.pathname)`. Fires on initial load + every SPA navigation.

### 4. Instrument key CTAs
- `src/routes/index.tsx` — landing CTA(s): `cta_click` with `{ location: 'landing', label: '<button text>' }`
- `src/routes/plans.tsx` — both plan buttons: `cta_click` with `{ location: 'plans', plan: 'power_up' | 'free', billing }`
- `src/routes/coming-soon.tsx` — waitlist form submit: `waitlist_opt_in`
- `src/routes/signup.tsx` — Google button: `signup_click` with `{ method: 'google' }`; email submit: `signup_submit` with `{ method: 'email' }`
- `src/routes/diagnostic.index.tsx` — start button: `diagnostic_start`
- `src/routes/diagnostic.results.tsx` — on mount: `diagnostic_complete`

### 5. Mark conversions in GA4 (manual, after deploy)
After events show up in GA4 (24–48h, or instantly via DebugView), go to **Admin → Events** and toggle these as **Key events**: `waitlist_opt_in`, `signup_submit`, `diagnostic_complete`, `cta_click` (optional).

### Testing
- Open the preview, open GA4 → **Admin → DebugView**.
- Add `?debug_mode=1` to the URL, or install the GA Debugger Chrome extension.
- Click around — events should appear in real time.

### Notes
- No cookie banner yet. Fine for now; revisit before launching to EU traffic (add a consent banner + `gtag('consent', ...)`).
- Unique visitors: GA4 tracks this automatically via the `_ga` cookie — nothing extra needed.
