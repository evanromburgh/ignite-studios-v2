# Dead code & cleanup report

Generated from a full codebase scan. This report was updated after the latest cleanup.

---

## Summary of removals (latest cleanup)

- **Dead composables:** `useViewersPoll.ts`, `useWishlistCount.ts`, `useReservationsCount.ts` (never imported; layout uses `useGlobalPresence()` only).
- **Dead plugin:** `gsap.client.ts` and `gsap` dependency (no component used `$gsap` / `$ScrollTrigger`).
- **Dead API routes (frontend):** `server/api/units/viewers.post.ts`, `viewer-heartbeat.post.ts`, `remove-viewer.post.ts`, `prune-viewers.post.ts` (replaced by Supabase Realtime + cron GET `/api/cron/prune-viewers`).
- **Dead config/types:** `ViewMode.ELEVATION`, `ViewMode.FLOOR`; `CONFIG.HEARTBEAT_INTERVAL_MS`, `PRESENCE_TICK_MS`, `VIEWERS_POLL_MS`; `runtimeConfig.public.viewersPollMs`.
- **Unnecessary assets:** `frontend/assets/eye.json`, `frontend/public/animations/eye.json` (only `dark_eye.json` is used by IconEyeLottie).
- **Unnecessary public docs:** `public/documents/*.pdf` and `.gitkeep` (documents page uses Supabase Storage URLs only).
- **Unnecessary content:** `category: 'Development'` in `documents.ts` (not on `DocumentEntry` type).

---

## Previously removed (no longer in repo)

- `frontend/reusable-kits/` (entire folder)
- `useViewersPoll.legacy.ts`, `useColorMode.ts`, `useFormatFloor.ts`
- `public/test.txt`, `public/animations/eye.json` (root public; also had duplicate under frontend)

---

## Still in use (verified)

- **frontend/config.ts** – used by `useUnits`, `AuthPortal`, reserve + unit pages.
- **frontend/pages/reserve.vue** – parent route for `/reserve`, renders `NuxtPage` for `/reserve/[unitNumber]`.
- **nuxt-app-manifest-stub.mjs**, **nuxt-internal-paths-stub.mjs** – referenced in `package.json`; keep.
- **frontend/server/api/cron/prune-viewers.get.ts** – used by cron; keep.
