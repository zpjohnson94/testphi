## Why avatars feel slow

The 12 avatars in `src/assets/avatars/` total **~12 MB** (each PNG is 0.8–1.7 MB). They're imported in `DiagAvatar.tsx` so Vite bundles them as hashed assets, but they aren't fetched until the `/diagnostic/avatar` route mounts — and then the browser has to download ~12 MB of PNGs before the grid fills in. Pure `<link rel="preload">` won't fix that; the files are simply too big.

So the fix is two-pronged: **shrink the files**, then **preload them** ahead of the route that needs them.

## Plan

### 1. Convert avatars to WebP (biggest win)

Re-encode each `src/assets/avatars/*.png` to `.webp` at ~512×512, quality ~85. Expected size: ~30–60 KB each, so ~0.5 MB total instead of 12 MB (>20× smaller). PNG transparency is preserved.

Update `src/components/DiagAvatar.tsx` to import the `.webp` files instead of `.png`. No API change — same `AvatarId` map, same component props.

Delete the old `.png` files after the swap.

### 2. Preload avatars before the picker route

Two complementary hooks:

- **Warm the cache from `/diagnostic`** (the screen right before the avatar picker): add a tiny `useEffect` that does `new Image().src = url` for all 12 webp URLs. By the time the user clicks "Start", the images are in the HTTP cache.
- **`<link rel="preload" as="image">` on the avatar route itself**: in `src/routes/diagnostic.avatar.tsx`, use TanStack's `head().links` to list the 12 avatar URLs so they fetch in parallel at the highest priority the moment the route is requested.

### 3. Verify

Check the Network tab on `/diagnostic/avatar`: avatar requests should be served from cache (from step 1) or finish in <100 ms each (from step 2), and total avatar payload should drop from ~12 MB to <1 MB.

## Files touched

- `src/assets/avatars/*.webp` — new (created via `cwebp`)
- `src/assets/avatars/*.png` — deleted
- `src/components/DiagAvatar.tsx` — swap `.png` imports → `.webp`
- `src/routes/diagnostic.avatar.tsx` — add `head().links` preload entries
- `src/routes/diagnostic.index.tsx` — add `useEffect` that warms the image cache

## Notes

- No change to `Avatar.tsx` / `avatar-bear.png` (separate asset used elsewhere).
- If you'd rather keep PNGs for any reason, say so and I'll skip step 1 — but preload alone won't make 12 MB feel fast on mobile.
