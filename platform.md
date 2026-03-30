# Platform Overview

This document defines the Ignite Portal platform, what it includes today, and how to deploy it for new clients quickly with minimal code changes.

## 1) Core Stack

- **Frontend:** Nuxt 3 + Vue 3 (`frontend/`)
- **Styling:** Tailwind CSS
- **Backend APIs:** Nuxt/Nitro server routes (`backend/server/api/*`)
- **Database/Auth/Storage/Functions:** Supabase (`backend/supabase/`)
- **CRM:** Zoho (lead/contact + reservation sync via Edge Functions)
- **Payments:** Paystack (inline checkout + webhook confirmation)
- **Hosting:** Vercel (or any Nuxt-compatible host)

## 2) Platform Architecture

- **UI layer:** Public/authenticated pages, reservation flow, wishlist, reservations, documents.
- **Application layer:** Composables and APIs for units, locks, timers, viewer heartbeat, and user state.
- **Data layer:** Supabase tables and realtime updates for units/reservations/user profile fields.
- **Integrations layer:** Supabase Edge Functions for Zoho + payment events.

## 3) Auth and Access

- **Auth provider:** Supabase Auth.
- **Auth UX:** Login/signup via `AuthPortal` and route-level gated experiences.
- **User navigation:** Profile, wishlist, reservations, sign out.
- **Role support:** Foundation exists; admin parity items still in backlog.

## 4) Pages and Routes

Current production routes:

- `/` - Home, filters, unit grid/list, and interactive site map plans view (auth-gated content)
- `/unit/[unitNumber]` - Unit details, gallery, reserve CTA, wishlist
- `/reserve` - Reserve landing/redirect
- `/reserve/[unitNumber]` - Reservation form + lock + timer + payment trigger
- `/wishlist` - Saved units
- `/reservations` - User reservations
- `/profile` - User profile
- `/documents` - Downloadable docs
- `/payment-success` - Post-payment success
- `/payment-cancel` - Post-payment cancel

## 5) Platform Features

### Inventory and Browsing

- Unit list from Supabase with realtime updates.
- Filters: price, type, floor, direction, and view mode.
- Unit cards with key specs and actions.
- Detailed unit pages with gallery/specs/description.

### Interactive Site Map

- Master map hotspot navigation (building -> floor plan section).
- Floor plan unit hotspots that link directly to unit details/reservation flow.
- Status-aware overlays/badges (available, locked, held, reserved/sold).
- Mobile-aware plan handling (mobile images and hotspot rotation support).
- Config/data source lives in `frontend/data/siteMap.ts`, rendered via `frontend/components/SiteMapPlansView.vue`.
- Because client floor plans differ, each new client requires new hotspot polygons (`pathD`) for master map buildings and floor-unit regions.

### Reservation and Locking

- Unit locking to prevent concurrent reservations.
- 10-minute lock timer with server-time synchronization.
- Lock conflict handling ("locked by another user").
- Pending reservation management and lock release workflows.

### Payments and Post-Payment State

- Inline Paystack checkout.
- Success/cancel return pages.
- Webhook-based payment status handling.
- Status synchronization to Supabase + Zoho reservation records.

### CRM Integration (Zoho)

- Lead creation on signup.
- Contact create/update on reservation submit.
- Unit reservation mapping to Zoho records.
- Payment status updates (Paid/Cancelled) from webhook events.

### User Experience

- Wishlist toggle/count and saved units page.
- Reservation count and reservation history page.
- Documents page with static metadata and downloadable assets.

## 6) Dynamic Multi-Client Model

The platform should be run as a **configuration-driven template** where each client has:

1. Its own environment variables and secrets
2. Its own Supabase project (recommended)
3. Its own Zoho CRM credentials and field mapping
4. Its own Paystack account keys and webhook URL
5. Its own branding assets and optional theme values
6. Its own content and unit dataset

### What is already dynamic

- Public app runtime config is env-driven (`NUXT_PUBLIC_*`).
- Branding URLs can be overridden per deploy.
- Supabase URL and keys are environment specific.
- Paystack public key is environment specific.
- Edge Function secrets are project specific.

### What to keep client-specific (do not hardcode)

- Keys, tokens, URLs, webhook secrets
- Brand logos/favicon/theme values
- Unit data, pricing, reservation metadata, documents
- Interactive map assets and hotspot geometry (master map + floor plans)
- CRM module/field IDs where clients differ

## 7) New Client Deployment Runbook

Use this exact process when onboarding a new client.

### Step 1: Create client infrastructure

- Create a new Supabase project for the client.
- Apply database schema/migrations from `backend/supabase`.
- Deploy required Edge Functions:
  - `submit-reservation`
  - `cancel-reservation`
  - `payment-webhook`
  - `create-lead` (if used in your current flow)

### Step 2: Configure Edge Function secrets (Supabase)

Set client-specific secrets:

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_API_DOMAIN`
- `PAYSTACK_SECRET_KEY`

If you use scheduled cleanup, also set:

- `CRON_SECRET`

### Step 3: Configure app environment variables (host + local)

At minimum:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`
- `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

Recommended per client:

- `NUXT_PUBLIC_BRANDING_FAVICON_URL`
- `NUXT_PUBLIC_BRANDING_LOGO_LIGHT_URL`
- `NUXT_PUBLIC_BRANDING_LOGO_DARK_URL`
- `NUXT_PUBLIC_IMAGE_CACHE_BUST` (when replacing images)

### Step 4: Configure payment provider

- Create/verify the client's Paystack account.
- Add webhook URL:
  - `https://<CLIENT_SUPABASE_REF>.supabase.co/functions/v1/payment-webhook`
- Ensure success/failure events are enabled.
- Verify test mode and live mode keys are correctly separated.

### Step 5: Configure CRM (Zoho)

- Connect client Zoho tenant credentials.
- Confirm Contacts and reservation-related fields exist.
- Validate field mapping used by Edge Functions.
- Run a test signup -> test reservation -> test payment flow and confirm Zoho updates.

### Step 6: Seed client data

- Import/create client units in Supabase.
- Upload client documents to `public/documents/` (or storage strategy used).
- Update document metadata list if needed (`frontend/data/documents.ts`).
- Add branding assets (logo/favicon) in client storage path.

### Step 7: Deploy application

- Deploy Nuxt app to hosting provider with client env vars.
- Set production domain and SSL.
- Validate callback/redirect URLs for payment and auth.

### Step 8: Post-deploy validation checklist

- Auth signup/login/logout works.
- Unit list/filter/detail works.
- Reservation lock and timer work across two browsers.
- Payment success/cancel flows work.
- Webhook updates reservation status correctly.
- Zoho lead/contact/reservation records are correct.
- Wishlist and reservation pages load expected user data.

## 8) Recommended Client Onboarding Template

Create one deployment record per client with:

- Client name and environment (dev/stage/prod)
- Supabase project ref and region
- Frontend host URL
- Env var matrix (`NUXT_PUBLIC_*`)
- Edge Function secrets checklist
- Zoho module/field mapping confirmation
- Paystack webhook status
- Data import completed (units/docs/branding)
- UAT sign-off and go-live date

## 9) Guidance to Keep It Fully Dynamic Going Forward

To scale to many clients without branch-per-client maintenance:

- Keep all client differences in configuration and data.
- Avoid client-specific conditional code paths where possible.
- Use env vars + database-stored settings for branding/content toggles.
- Add a single "client config" source (table or JSON) for optional feature flags.
- Maintain one release branch and deploy per-client via env and data only.

## 10) Current Backlog (Platform Parity / Enhancements)

- Header hard-refresh behavior polish.
- Admin parity (toggle, edit form, card actions, bulk sync).
- Reservation cards with richer status/actions.
- Unified error/toast consistency across flows.
- Optional image optimization and additional UX polish.

