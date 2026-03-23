# Ignite Portal Implementation Reference

This file documents the current in-progress implementation in this repository so the team has one permanent place to review what was done, how it works, and where key logic lives.

## What This Work Introduced

- Added a safer **unit lock acquisition flow** to prevent two users reserving the same unit at once.
- Standardized a shared **bottom urgency strip** notification for lock/reserve errors.
- Added a **branding composable** so favicon/logo sources come from runtime config instead of hardcoded imports.
- Updated app shell (`app.vue` + `default.vue`) to centralize loading behavior, branding usage, and global UI overlays.
- Enhanced reservation and browsing pages to use server-synced time, lock state, and clearer blocked-state UX.
- Added environment/runtime config support for branding and paystack-related values.

---

## High-Level End-to-End Flow

### 1) Browse units and attempt reserve
1. User clicks **Reserve** from list/grid/unit pages.
2. Frontend calls `POST /api/units/acquire-lock` with `unitId` and bearer token.
3. On success:
   - `ignite_reserve_unitId`, `ignite_reserve_lockExpiresAt`, and `ignite_reserve_token` are saved in `sessionStorage`.
   - User is navigated to `/reserve/[unitNumber]`.
4. On failure:
   - error message is shown via shared `useBottomUrgencyStrip().show(...)`.

### 2) Reserve page lock/session bootstrap
1. Reserve page checks `sessionStorage` for existing lock context.
2. If lock exists, it restores timer immediately and syncs server clock in background.
3. If no lock context exists, it attempts to acquire a lock on mount.
4. If unit is unavailable/locked by someone else, page shows minimal blocked state with CTA back to browse.

### 3) While reserve page is open
- Countdown uses server-corrected time (`useServerClock`) for consistent timer values across devices.
- If lock expires, it:
  - releases lock best effort,
  - clears session lock data,
  - shows an expiry modal and routes back to browse.
- If user leaves page/cancels/signs out, lock release is attempted (`keepalive` where needed).

### 4) Payment flow
- Reserve submit calls Supabase Edge Function `submit-reservation`.
- If Paystack payload is returned, frontend opens Paystack inline popup.
- Success navigates to `/payment-success`.
- Cancel path performs best-effort cancel hook and navigates back to browse.

---

## Backend/API Locking Logic

### `backend/server/api/units/acquire-lock.post.ts`

Purpose: atomically acquire or refresh a 10-minute lock for a unit.

Key behavior:
- Validates method and bearer token.
- Requires `unitId` in body.
- Uses service-role Supabase client.
- Fetches current unit lock + status snapshot first.
- Rejects if unit status is not `Available`.
- Rejects with `409` if another active lock owner holds it.
- Performs **guarded update** that matches previous `locked_by` + `lock_expires_at` snapshot.
  - Prevents race conditions without brittle OR conditions.
- Returns `{ ok: true, lockExpiresAt }` on success.

Why this matters:
- If two clients try to reserve simultaneously, one update wins and the other gets conflict (`409`), preventing double-hold behavior.

### `frontend/server/api/units/acquire-lock.post.ts`

Same logic mirrored in frontend server API route layer (Nuxt server), preserving behavior consistency where this endpoint is served from frontend runtime.

---

## Frontend Shared Composables

### `frontend/composables/useBottomUrgencyStrip.ts`

Global UI state for short urgency messages:
- `visible` and `message` stored in `useState` so any page can trigger it.
- `show(text)`:
  - sets message and shows strip,
  - resets previous timer,
  - auto-hides after 5s (client only).
- `dismiss()`:
  - clears timer,
  - hides strip immediately.

Used by pages when lock acquisition fails or reservation action cannot proceed.

### `frontend/composables/useBranding.ts`

Runtime-config wrapper:
- Reads `public.branding` from Nuxt runtime config.
- Returns:
  - `faviconUrl`
  - `logoLightUrl`
  - `logoDarkUrl`

Used in app/layout/components so branding can be changed by env/config without code edits.

### `frontend/composables/useAuth.ts`

Notable behavior in current implementation:
- One-time initialization guard to avoid duplicate session/user fetches across multiple `useAuth()` callers.
- Session-first auth bootstrap (`getSession` -> `getUser`) with graceful fallback on lock/contention errors.
- Immediate user identity set, then async role/profile enrichment.
- Exposes `sessionRef` for faster reserve flow token access.
- `logout()` now performs lock cleanup:
  - reads `ignite_reserve_unitId`,
  - calls `/api/units/release-lock` best effort,
  - clears lock-related storage keys.

### `frontend/composables/useUnits.ts`

Important mapping changes:
- Parses and maps:
  - `lock_expires_at` -> `lockExpiresAt` (ms)
  - `locked_by` -> `lockedBy`
- Keeps realtime units subscription to update lock/status changes instantly.
- Provides normalized image key handling for Supabase storage URLs.

---

## App and Layout Integration

### `frontend/app.vue`

Main app shell responsibilities:
- Uses `useBranding()` for favicon and splash logo.
- Tracks:
  - auth loading
  - route loading
  - auth transition loading (sign in/out visual handoff)
- Shows full-screen splash loader while any loading state is active.
- Renders:
  - `AuthPortal` only when logged out and auth resolved,
  - otherwise the full Nuxt layout + pages.

### `frontend/layouts/default.vue`

Global layout updates:
- Uses `useBranding()` for nav/footer logos.
- Includes shared `<BottomUrgencyStrip />` once at layout level.
- Maintains dynamic nav theme behavior (dark/light) based on scroll/section overlap.
- Refined mobile menu open/close sequencing:
  - measure nav height first,
  - animate panel and dropdown consistently,
  - lock body scroll while open.

---

## Reserve Page Core Logic

### `frontend/pages/reserve/[unitNumber].vue`

This page now coordinates lock lifecycle, timer, availability messaging, and payment handoff.

Main state keys:
- `unitId`, `lockExpiresAtMs`, `acquiringLock`, `acquireError`, `reserveFlowReady`
- `accessTokenRef` for lock release and secure requests
- `timeLeft`, `showUrgencyBanner`, `showExpiryModal`

Important computed logic:
- `isLockedByOther`: blocks checkout if another user has active lock.
- `ownLockActive`: confirms this session still has valid lock.
- `showBlockedMinimal`, `blockedTitle`, `blockedDescription`: single blocked UX model for conflicts/unavailable states.

Key functions:
- `releaseLockAndClear()`:
  - clears local reserve storage,
  - keepalive unlock request for unload/background-safe cleanup.
- `releaseLockAndClearAsync()`:
  - awaitable version used during route leave.
- `onCancel()`:
  - explicit user cancel path,
  - retries with refreshed session if initial unlock fails.
- `onSubmit()`:
  - validates session/token robustly (`getSession`, `refreshSession`, localStorage fallback),
  - posts reservation to edge function,
  - opens Paystack popup when available,
  - handles success/cancel/error paths.

Lifecycle hooks:
- `onMounted`:
  - restore or acquire lock,
  - preload Paystack script,
  - pull profile data for ID/passport + reason.
- `onBeforeRouteLeave`:
  - waits for lock release unless already canceling.
- `onBeforeUnmount`:
  - final cleanup and unlock attempt.

---

## Browse/List/Unit Page Reserve Trigger Updates

Reserve entry points now consistently acquire lock before or during navigation and display urgency strip on failure.

Updated pages include:
- `frontend/pages/index.vue`
- `frontend/pages/wishlist.vue`
- `frontend/pages/reservations.vue`
- `frontend/pages/unit/[unitNumber].vue`

Pattern:
- attempt `/api/units/acquire-lock`
- store lock metadata in `sessionStorage` on success
- navigate to `/reserve/[unitNumber]`
- show shared bottom urgency strip on errors

Also passes server clock offset into unit cards/rows so lock timer display is consistent with server time.

---

## Branding and Config

### `nuxt.config.ts`

Added/centralized runtime config for:
- `public.branding` defaults (`faviconUrl`, `logoLightUrl`, `logoDarkUrl`)
- `public.paystackPublicKey`
- existing Supabase/public app settings

### `.env.example`

Added examples/comments for:
- optional branding URL overrides
- paystack public key
- existing Supabase and cron values

---

## Other Notable UI/UX Adjustments

- `frontend/components/BottomUrgencyStrip.vue` added as global teleported strip component.
- `frontend/components/SiteMapPlansView.vue` updated to use branding composable and lock-aware badge behavior for plans.
- Payment success/cancel/contact/documents/profile-related pages were adjusted to align with new shell/auth/brand behavior and reserve lock lifecycle.

---

## Session/Storage Keys (Current)

Used by reserve flow:
- `ignite_reserve_unitId`
- `ignite_reserve_lockExpiresAt`
- `ignite_reserve_token`
- `ignite_reservation_redirecting` (payment redirect guard)
- `show_payment_cancelled_toast` (browse toast trigger)

---

## Operational Notes

- Lock duration is currently `10 minutes` (`LOCK_DURATION_MS`).
- Lock conflict and unavailable scenarios intentionally use user-friendly 409 messages.
- Lock release is best-effort in several paths to maximize cleanup reliability (logout, cancel, route leave, unload).
- Frontend realtime unit updates ensure lock status propagates quickly across views.

---

## Suggested Maintenance Workflow

When updating reservation logic:
1. Update lock API behavior first (`acquire-lock` / `release-lock`).
2. Verify reserve-page lifecycle (restore lock, acquire fallback, cleanup on leave).
3. Verify reserve entry points (index/wishlist/reservations/unit page).
4. Verify shared UI feedback (`BottomUrgencyStrip`, blocked states, expiry modal).
5. Update this file with any new storage keys, endpoint contracts, or flow changes.

