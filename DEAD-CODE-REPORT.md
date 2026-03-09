# Dead code & cleanup report

Generated from a full codebase scan. Only items that are **not referenced anywhere** are listed.

---

## 1. Unused files & folders (safe to remove)

| Path | Reason |
|------|--------|
| **frontend/reusable-kits/** (entire folder) | Never imported. App uses `frontend/components/`, `frontend/composables/`, `frontend/data/`. No `~/reusable-kits/` imports anywhere. |
| **frontend/composables/useViewersPoll.legacy.ts** | Legacy stub; never imported. Comment says "Restore by renaming back to useViewersPoll.ts". |
| **frontend/composables/useColorMode.ts** | Never called. Theme is applied via `plugins/theme.client.ts` + `runtimeConfig.public.theme` only. |
| **frontend/composables/useFormatFloor.ts** | Never imported or called (no `useFormatFloor` or `formatFloorLabel` references). |
| **frontend/composables/useViewersPoll.ts** | No callers. Layout uses `useGlobalPresence()` for "browsing now". This file is a stub; can remove or keep as placeholder. |
| **public/test.txt** | Not referenced in codebase. |
| **public/animations/eye.json** | Not referenced. Lottie uses `~/assets/eye.json` only. |

---

## 2. Unused exports (in used files)

| File | Export | Action |
|------|--------|--------|
| **frontend/data/phoneCountries.ts** | `phoneCountriesSortedForDetect` | Remove export (or delete if no other code needs it). |

---

## 3. Config to update after removing reusable-kits

- **tailwind.config.js**  
  Remove `'./frontend/reusable-kits/**/*.vue'` from the `content` array so Tailwind doesn’t reference a deleted directory.

---

## 4. Not dead (verified in use)

- **frontend/config.ts** – used by `useUnits`, `AuthPortal`, reserve + unit pages.
- **frontend/pages/reserve.vue** – parent route for `/reserve`, redirects `/reserve` to home and renders `NuxtPage` for `/reserve/[unitNumber]`.
- **useReservationsCount**, **useWishlistCount** – used in `layouts/default.vue`.
- **nuxt-app-manifest-stub.mjs**, **nuxt-internal-paths-stub.mjs** – referenced in `package.json`; keep.

---

## 5. Path note (Windows)

`frontend\components\UnitCard.vue`, `frontend\layouts\default.vue`, `frontend\assets\css\main.css` (backslash) are the same files as the slash versions; no duplicate files to delete.

---

## Summary

- **Removed:** `frontend/reusable-kits/` (entire folder), `useViewersPoll.legacy.ts`, `useColorMode.ts`, `useFormatFloor.ts`, `public/test.txt`, `public/animations/eye.json`.
- **Updated:** `tailwind.config.js` (removed reusable-kits from content), `frontend/data/phoneCountries.ts` (removed unused `phoneCountriesSortedForDetect` export).
- **Left as placeholder:** `frontend/composables/useViewersPoll.ts` (no callers; safe to delete later if desired).
