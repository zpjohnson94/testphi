## Fix: brand fonts not loading

The Google Fonts `@import` in `src/styles.css` is placed after `@import "tailwindcss"` and `@source "../src"`. Per CSS spec, `@import` rules must come before any other rules, so the browser silently ignores the fonts import. Confirmed in the live preview: only Inter loads, and the h1 / wordmark / nav button all render in Inter, not Exo 2.

## Changes

1. **`src/styles.css`** — remove the broken `@import url("https://fonts.googleapis.com/...")` line (line 5).

2. **`src/routes/__root.tsx`** — add the Google Fonts stylesheet via `<link>` tags in the route's `head().links` array, alongside the existing `appCss` link. Include `preconnect` hints for faster font loading:
   - `preconnect` to `https://fonts.googleapis.com`
   - `preconnect` to `https://fonts.gstatic.com` (crossOrigin anonymous)
   - `stylesheet` for `https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800;900&family=Nunito:wght@400;600;700;800;900&display=swap`

This loads the fonts at the document level (more reliable with Tailwind v4 + Vite than CSS `@import`) so that `--font-display: "Exo 2"` and `--font-sans: "Nunito"` resolve correctly across every page.

No changes to component code are needed — the existing `.display`, `h1–h4`, and body styles will pick up the fonts automatically once they load.