# Ignite Portal – Feature Checklist

**App is the repo root.** Setup, env, and deployment are from this directory.

Single reference for what's done, what's next, and ideas for new features, testing, and improvements.

---

## Done (high-level)

- **Unit cards** with property details (price, status, beds, baths, parking, type, size; Learn More / Reserve Now)
- **Unit pages** for more info (gallery, specs, description, wishlist, Reserve CTA)
- **Reservation pages** with lock and 10‑minute timer (acquire lock, form, countdown, lock expiry)
- **Payment gateway integration (PayFast)** – Proceed to payment from reserve form; success and cancel return pages
- **Zoho integration:** create lead on signup; convert to contact after completing reservation form (or create/update contact); assign correct unit with payment status to that contact (Unit_Reservations; webhook updates Paid/Cancelled and Supabase)
- **Documents page** – Development documentation available for download (document cards, list, download links; static list in `data/documents.ts`, files in `public/documents/`)

---

## To do (high-level)

- _(None at the moment.)_

---

## Suggested (backlog)

- **Header on refresh** – Logo and nav appear together on hard refresh (no logo-only then flash)
- **Admin parity** – Admin toggle (e.g. footer) for `user.role === 'admin'`; admin unit form (edit unit fields); unit card/row actions (status, edit, delete); bulk sync (Zoho/source)
- **Reservation cards** – On My Reservations, show status, countdown, or actions (e.g. pay balance) consistent with previous app
- **Error and toast consistency** – Centralised error states and toasts across auth, reserve, and payment return flows
- **Optional UX** – List view for units (in addition to grid); GSAP scroll reveals on key sections; `nuxt-img` + placeholders for images
- **Testing** – E2E (e.g. Playwright) for critical paths: login → browse → reserve (up to PayFast redirect), payment return pages
- **Documents page (later)** – Optional: document categories, or access control by role

---

## Reference

- **Project layout:** [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)

---

## Technical detail (implementation)

Track what's done and what's left for parity with the React portal and polish.

### Core stack & setup

- [x] Nuxt 3 app with Tailwind CSS
- [x] Supabase client plugin (same backend as React app)
- [x] GSAP client plugin (ScrollTrigger available)
- [x] Route rules: ISR for `/`, `/documents`; static `/contact`
- [x] Types and config (e.g. `types.ts`, `config.ts`)
- [ ] **Optional:** Nuxt Image (`nuxt-img`) for all images
- [ ] **Optional:** Global smooth scroll (e.g. Lenis or GSAP)
- [ ] **Optional:** Contentful (or other headless CMS) for marketing copy

### Auth & layout

- [x] Auth portal (login/signup) – `AuthPortal.vue`, `useAuth`
- [x] Create Zoho lead on signup (`create-lead` Edge Function, fire-and-forget after signup)
- [x] Auth gate on home: show AuthPortal when logged out, units when logged in
- [x] Default layout: header (logo + nav), desktop nav, mobile hamburger + slide-out menu
- [x] User menu when logged in (profile, Wishlist, My Reservations, Sign out)
- [x] Footer with copyright and (in React) admin toggle
- [ ] **Header on refresh:** Logo + nav appear together on hard refresh without "logo-only then flash"

### Pages & routing

- [x] `/` – Home / browse units (hero, filters, unit grid)
- [x] `/unit/[unitNumber]` – Unit detail (gallery, specs, Reserve Now, wishlist)
- [x] `/reserve` – Reserve redirect/landing
- [x] `/reserve/[unitNumber]` – Reservation form (lock, timer, PayFast redirect)
- [x] `/wishlist` – Wishlist page
- [x] `/reservations` – My Reservations
- [x] `/documents` – Documents page (cards + download from static list in `data/documents.ts`, files in `public/documents/`)
- [x] `/contact` – Contact placeholder
- [x] `/payment-success` – Post-PayFast success page
- [x] `/payment-cancel` – Post-PayFast cancel page (and one-time toast on return to home)

### Units & inventory

- [x] Units list from Supabase (`useUnits`, realtime)
- [x] Filter bar (price, type, floor, direction, view mode)
- [x] Unit cards (grid) with image, price, status, specs, Learn More / Reserve Now
- [x] Unit detail page: gallery (with transition), specs, description, wishlist, Reserve CTA
- [x] Server clock sync for lock timers (`useServerClock`, `/api/server-time`)
- [x] Viewer count / heartbeat API (acquire-lock, release-lock, viewer-heartbeat, remove-viewer, prune-viewers)
- [ ] **Optional:** List view (row layout) in addition to grid

### Reservation flow

- [x] Acquire lock on reserve (`/api/units/acquire-lock`)
- [x] Reserve form: contact details, terms, PayFast redirect
- [x] Lock timer display and expiry handling
- [x] "Locked by another user" state
- [x] Payment success: show success UI, update state, link to reservations
- [x] Payment cancel: show cancel UI, toast when back on properties

### Wishlist & reservations

- [x] Wishlist composable and count (`useWishlist`, `useWishlistCount`)
- [x] Toggle wishlist from unit card and unit detail
- [x] Wishlist page listing saved units
- [x] Reservations count in nav (`useReservationsCount`)
- [x] My Reservations page (list of reserved units)
- [ ] **Optional:** Reservation cards with status, countdown, or actions (e.g. pay balance) matching React

### Admin (parity with React)

- [ ] Admin mode toggle (footer or header) for `user.role === 'admin'`
- [ ] Admin unit form: edit unit fields, save (mirror `AdminUnitForm.tsx`)
- [ ] Unit card/row admin actions: status change, edit, delete
- [ ] Bulk sync modal (Zoho/source sync)
- [ ] "Reset" or equivalent admin action if present in React

### Polish & UX

- [ ] **Header on refresh:** No logo-only flash; header (logo + nav) appears together
- [x] Payment return flows and any toasts
- [ ] Error states and toasts consistent with React app
- [ ] **Optional:** GSAP scroll reveals on key sections
- [ ] **Optional:** nuxt-img + placeholders for all images

### Summary (technical)

- **Done:** Auth, layout, **create-lead on signup (Zoho)**, all main pages (including payment-success and payment-cancel), units list & detail, filters, reserve form, lock timer, wishlist, reservations list, documents page, server APIs for lock/viewers/time, **PayFast "Proceed to payment" flow and return pages.**
- **Next:** Header-on-refresh behavior, then admin (toggle, unit form, card actions, bulk sync).

Update this file as you complete items. Use "Optional" for nice-to-haves that aren't required for parity.
