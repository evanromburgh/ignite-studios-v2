# Supabase schema (from scratch)

Single migration sets up the portal + edge functions. Run on a **new** Supabase project (no existing tables).

## Tables (creation order)

| Table | Purpose |
|-------|--------|
| `profiles` | 1:1 with `auth.users`; role, phone, reserved_unit_ids. Auto-created on signup. |
| `units` | Property units (listing, locks, status). Realtime enabled. |
| `wishlists` | User ↔ unit favorites. RLS: user sees only own rows. |
| `pending_reservations` | Links unit + Zoho contact + user until payment completes. Used by submit-reservation and payment-webhook. |

## Column reference

### profiles
- `id` (uuid, PK, FK → auth.users) — same as auth user id
- `role` (text) — `'user'` \| `'admin'`
- `phone` (text, nullable)
- `reserved_unit_ids` (uuid[], default `'{}'`) — unit ids for “My Reservations”; updated by payment-webhook
- `created_at`, `updated_at` (timestamptz)

### units
- `id` (uuid, PK)
- `unit_number`, `bedrooms`, `bathrooms`, `parking`, `size_sqm`, `price`, `status`, `unit_type`, `image_url`
- `viewers` (jsonb) — e.g. `{ "grid": 2 }`
- `lock_expires_at` (timestamptz), `locked_by` (uuid → auth.users) — reservation lock
- `created_at`, `updated_at` (timestamptz)

### wishlists
- `id` (uuid, PK), `user_id` (→ auth.users), `unit_id` (→ units), `created_at`
- Unique on `(user_id, unit_id)`

### pending_reservations
- `unit_id` (→ units), `zoho_contact_id` (text), `user_id` (→ auth.users)
- `zoho_reservation_id` (text, nullable) — set by submit-reservation for payment-webhook
- Unique on `(unit_id, zoho_contact_id)` for upsert

## Auth

- Supabase Auth only. No custom claims.
- Display name, first/last name, phone: stored in `user_metadata` at signup; `profiles.phone` is updated by the app and can be kept in sync.

## RLS

- **profiles**: users can read/update own row (by `id = auth.uid()`).
- **units**: anyone can SELECT; only service role (and backend) can INSERT/UPDATE/DELETE.
- **wishlists**: users can SELECT/INSERT/DELETE only their own rows.
- **pending_reservations**: no client policies; only edge functions (service role) read/write.

## Realtime

- Enabled on `units` for the portal listing.

## Edge functions

- **submit-reservation**: auth required; inserts/updates `pending_reservations`, updates `units` (lock); uses Zoho + Paystack.
- **payment-webhook**: reads/updates `pending_reservations`, `units` (status), `profiles` (reserved_unit_ids); uses service role.
- **release-reservation-lock**: clears `units.lock_expires_at` and `units.locked_by`; uses service role.

## Env (new project)

- `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set for the new project.
- Run the single migration in the Supabase SQL Editor or via `supabase db push` (only the one migration in `supabase/migrations`).
