## Problem

`/home` and `/skill-map` render blank (only the footer is visible). Both new route components do:

```tsx
const [state, setState] = useState<FreeState | null>(null);
useEffect(() => { setState(loadFree()); }, []);
if (!state) return null;
```

During SSR `state` is `null`, so the component renders nothing. On the client the existing TanStack Start hydration issue on this project (visible in the console as "Invariant failed: Expected to find a match below the root match in SPA mode") prevents the client effect from completing the second render — so the page stays at the SSR'd empty state forever. Only the root layout's Footer remains visible.

## Fix

Don't gate rendering on `state`. Render the full UI with sensible defaults on the first pass, then swap in real values once `loadFree()` has run on the client. This makes the routes hydrate to identical markup as SSR and removes the dependency on the client effect to make the screen non-empty.

### `src/routes/home.tsx`
- Initialize `state` lazily so that on the client we get real data on the first render: `useState<FreeState | null>(() => (typeof window === "undefined" ? null : loadFree()))`.
- Remove the `if (!state) return null` early return. Compute fallback values inline:
  - `overall = state?.overall ?? 800`
  - `streak = state?.streak ?? 0`
  - `done = state ? hasCompletedToday(state) : false`
  - `lastSession = state?.lastSession ?? null`
- Keep the count-up animation effect but seed `animatedScore` to `overall` so SSR and first client paint match.

### `src/routes/skill-map.tsx`
- Same lazy `useState` initializer.
- Remove the `if (!state) return null` early return.
- When `state` is null (SSR only), render the 8 domains with the default mastery of 40 (matches `defaultScores()` in `freeUser.ts`) so the SSR and client markup match.

### `src/routes/daily.complete.tsx`
- Apply the same lazy-init + no-null-return pattern so this route doesn't hit the same blank-screen failure mode.

## Out of scope

- The pre-existing `/diagnostic` hydration mismatch (the `DiagAvatar` SSR/client `id` mismatch) is a separate issue and not touched here.
- No business-logic changes to `freeUser.ts`, no design changes.

## Verification

- Reload `/home`: predicted score, Daily 5 card, and bottom nav are visible immediately.
- Reload `/skill-map`: all 8 domain cards visible immediately, sorted by mastery once client state loads.
- No new console errors introduced.
