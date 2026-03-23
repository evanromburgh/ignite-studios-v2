# Ignite Portal — App Checklist

> Purpose: living checklist of app features and implementation status.
>
> Rule: only update this file when explicitly requested.

## How to Use This File

- Mark completed items with `[x]`.
- Add new items under the relevant section as `[ ]`.
- Keep notes short and practical (what it is + where it lives).

## 1) Stack Checklist

- [x] `Nuxt 3` app (`srcDir: frontend/`)
- [x] `Tailwind CSS` via `@nuxtjs/tailwindcss`
- [x] `Supabase` for auth, data, realtime, storage URLs
- [x] Supabase DB tables integrated:
  - [x] `units`
  - [x] `profiles`
- [x] Supabase Edge Functions integrated for reservation/payment flow
- [x] `Paystack` inline popup checkout integrated
- [x] UI libs in use:
  - [x] `Swiper` (hero carousel)
  - [x] `lottie-web` (online badge icon)

## 2) Fonts / Colors / Style Checklist

### Fonts

- [x] Body font set to `Montserrat`
- [x] Form controls set to `Inter`

### Theme Variables (`frontend/assets/css/main.css`)

- [x] Core theme vars defined (`--theme-bg`, `--theme-surface`, `--theme-border`, `--theme-text-primary`, etc.)
- [x] Overlay vars defined (`--theme-overlay`, `--theme-overlay-nav`, `--theme-overlay-dropdown`)
- [x] Accent vars defined (`--theme-accent-green`)

### Visual System

- [x] Rounded panel/card style language
- [x] Light-theme surfaces with dark-text baseline
- [x] Dark initial paint background to avoid flashes during app/loader boot
- [x] Shared urgency color treatment (`#922724`) for lock/reservation warnings

## 3) Core Product Features Checklist

### Browse + Discover

- [x] Hero carousel on home page
- [x] View switcher: Grid / List / Plans
- [x] Filter bar for units (desktop sticky + mobile drawer)
- [x] Grid cards (`UnitCard`)
- [x] List rows (`UnitListRow`)
- [x] Wishlist toggle from browse cards/rows

### Interactive Sales Map

- [x] Master map hotspot navigation (building -> floor plan section)
- [x] Unit hotspots on floor plans
- [x] Status-aware map badges:
  - [x] available
  - [x] locked
  - [x] held by developer
  - [x] sold/reserved
- [x] Mobile-friendly plan rendering with rotated plan canvas

### Unit / Reservation Lifecycle

- [x] Acquire lock before reserve flow
- [x] Server-synced countdown timing (`useServerClock`)
- [x] Lock-aware UI state (disabled reserve, locked overlays)
- [x] Reserve page lock bootstrap from session storage
- [x] Expiry handling modal + cleanup
- [x] Cancel reservation path with unlock cleanup
- [x] Route leave / unload unlock best-effort logic

### Payment

- [x] Submit reservation request to Edge Function
- [x] Launch Paystack inline checkout popup
- [x] Payment success page with reserved unit summary
- [x] Payment cancel page with lock release + webhook notify
- [x] One-time “payment cancelled” toast back on home page

### Presence / Engagement

- [x] “Users online” live badge in layout
- [x] Supabase Presence channel tracking
- [x] Chat/contact agent floating widget

### Auth + User Session

- [x] Single bootstrap auth/session initialization
- [x] Profile role/details enrichment after auth
- [x] Logout flow releases active reserve lock + clears storage keys
- [x] My Units page wired to `reserved_unit_ids`

### Global UX Components

- [x] Shared bottom urgency strip component
- [x] Global loading splash during route/auth transitions
- [x] Runtime branding composable for favicon/logo values

## 4) Feature Backlog (Add New Items Here)

Use this section for upcoming work. Keep each item actionable.

- [ ] Example: Add admin dashboard for lock audit
- [ ] Example: Add analytics events for reserve conversion funnel
- [ ] Example: Add automated e2e tests for payment cancel/success flow

## 5) Quick File Index

- Main browse page: `frontend/pages/index.vue`
- Reserve flow: `frontend/pages/reserve/[unitNumber].vue`
- Success/cancel pages:
  - `frontend/pages/payment-success.vue`
  - `frontend/pages/payment-cancel.vue`
- Unit UI:
  - `frontend/components/UnitCard.vue`
  - `frontend/components/UnitListRow.vue`
- Interactive map:
  - `frontend/components/SiteMapPlansView.vue`
  - `frontend/components/ZoomablePlan.client.vue`
- Shared UX:
  - `frontend/components/BottomUrgencyStrip.vue`
  - `frontend/components/ChatWidget.vue`
- Composables:
  - `frontend/composables/useAuth.ts`
  - `frontend/composables/useUnits.ts`
  - `frontend/composables/useServerClock.ts`
  - `frontend/composables/useBottomUrgencyStrip.ts`
  - `frontend/composables/useGlobalPresence.ts`

