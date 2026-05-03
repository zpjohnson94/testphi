# Replace homepage progression background

I generated a stylized 3-island illustration (Algebra Atoll, Grammar Grove, Advanced Math Moonscape) in the brand palette — deep violet, lavender, volt-green — with the center island deliberately the largest so it remains the focal point on mobile when the side islands crop off.

Preview of generated asset: `journey-bg-v1.png` (already saved to `/mnt/documents/`).

## Changes

### 1. Add the asset
- Copy `/mnt/documents/journey-bg-v1.png` → `src/assets/journey-bg.png`.

### 2. Swap the decor in `src/routes/index.tsx`
- Remove the `PuzzleMapDecor` import and its container div.
- Replace with an `<img src={journeyBg}>` block:
  - Absolutely positioned behind the hero (`z-0`, `pointer-events-none`, `aria-hidden`).
  - `object-cover object-center` so the center island stays anchored at all viewport widths.
  - Width capped at ~`max-w-[1600px]`, centered with `left-1/2 -translate-x-1/2`.
  - Top offset roughly `top-[260px] sm:top-[320px]` so it sits below the headline/CTA, not behind them.
  - Height ~`h-[520px] sm:h-[640px]`.
  - Opacity ~`0.55` plus a soft top→bottom mask (`maskImage: linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)`) so it dissolves into the topo background instead of having a hard edge.
- Keep a soft radial vignette layer behind the hero CTA so the headline area stays high contrast over the new image.

### 3. Cleanup
- Delete `src/components/PuzzleMapDecor.tsx` (no other route imports it — verified).

## Why this layout works
- The illustration is rendered with the Grammar Grove island centered. With `object-cover object-center` the side islands crop first on narrow viewports, leaving the center hero island intact on mobile (≤390px).
- Placing the image *below* the hero CTA (rather than behind it) keeps the predict-my-score button readable while the islands act as a visual base/foundation for the page — exactly the role the numbered-tile map played, just more compelling.

## Open questions (optional follow-ups, not blocking)
- If you want the islands to peek up *behind* the CTA card instead of sitting under it, I can shift the `top` offset upward and lean harder on the radial vignette.
- If the AI text on the signs ("Algebra Atoll", "Grammar Grove", "Advanced Math Moonscape") doesn't read crisply enough at final size, I can regenerate with larger sign typography or strip the sign text entirely.
