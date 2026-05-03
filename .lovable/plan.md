## Goal

Surface the signup CTA above the fold by overlaying it on the Weak Spots module, starting at the second row — keeping all weak-spot rows blurred underneath so the user still senses "there's more hiding here."

## Visual behavior

```text
POTENTIAL SCORE IMPROVEMENT
+92 points  (fully visible callout — unchanged)

WEAK SPOTS
┌──────────────────────────────────┐
│ ••••••••••••           +52 pts  │  ← row 1: blurred, fully visible
└──────────────────────────────────┘
╔══════════════════════════════════╗
║  ░░ blurred row 2 (+40 pts) ░░  ║
║ ┌──────────────────────────────┐ ║
║ │  🔒 +92 pts waiting          │ ║   ← semi-translucent CTA overlay
║ │  Sign up free to unlock      │ ║      starts at row 2, extends down
║ │  your weak spots + colleges  │ ║      over remaining rows + Developing
║ │  [ Sign up free → ]          │ ║      header (or stops at end of Weak
║ │  Free forever · no card      │ ║      Spots — see Q below)
║ └──────────────────────────────┘ ║
║  ░░ blurred row 3 (faintly) ░░  ║
╚══════════════════════════════════╝

DEVELOPING        (still rendered below, blurred rows as today)
STRONG            (visible header, blurred items)

At {target}, you're on target for these schools
(blurred college cards — unchanged)
```

The point badges on row 1 stay fully visible (they already sit above the blur via z-index). Row 2+ rows render normally (still blurred) so they're partially visible behind the translucent CTA, creating the "peek through" effect.

## Implementation notes

### `src/routes/diagnostic.results.tsx` and `src/routes/diagnostic.results-preview.tsx` (mirror)

1. **Group component**: when `label === "Weak Spots"` and there are 2+ rows, wrap the rows list in a `relative` container and absolutely-position a CTA card over it starting at `top: ~64px` (height of one row + small gap). The CTA card uses:
   - `background: rgba(29,11,46,0.78)` (deep violet) with `backdrop-filter: blur(2px)` for the frosted layered look
   - `border: 1px solid rgba(184,255,0,0.35)`, Volt left border 4px to match the Potential Score callout
   - Inner content: lock icon, headline `"+{totalUpside} points waiting to be unlocked"`, subcopy, primary `Sign up free to unlock →` button (volt), microcopy `Free forever · No credit card needed`
   - Rounded-2xl, padding ~`p-5 sm:p-6`
2. The CTA must extend tall enough to cover all remaining weak-spot rows but not bleed into Developing. Use `bottom: 0` on the absolute overlay so it auto-stretches with row count.
3. **Remove the standalone bottom CTA block** (the centered lock + headline + button at the very end of the page) — it becomes redundant. Keep the page ending at the college list.
4. The Group needs `totalUpside` so the overlay can show the full point count — pass it as a prop only when rendering Weak Spots (cleanest), or lift the overlay rendering out of `Group` and place it in the parent next to the Weak Spots `Group` for clearer ownership.
5. Pointer events: overlay is fully interactive (button works); blurred rows underneath stay `pointer-events: none` as today.
6. Mobile (390px): overlay sits inside the existing 2xl breakdown card, so it inherits proper padding. Button is full-width on mobile.

### Edge case
If a user happens to have ≤1 Weak Spot, fall back to overlaying starting at row 1 (still want the CTA visible). In the preview mock there are always 2 weak spots so this is mainly a production concern.

## Files

- edit `src/routes/diagnostic.results.tsx`
- edit `src/routes/diagnostic.results-preview.tsx`

## One question before I build

Should the CTA overlay extend **only over the remaining Weak Spots rows**, or extend further down to also cover the **Developing** section (so Developing peeks through behind the CTA too)? I'd recommend the former — keeps Developing/Strong as a clear "and there's more below" signal — but happy to do either.