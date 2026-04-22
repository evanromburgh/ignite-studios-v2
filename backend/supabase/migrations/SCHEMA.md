# Supabase schema

Migrations live in `backend/supabase/migrations/`. Apply in timestamp order on a **new** project (or use `supabase db push` with workdir `backend`).

## Migration files

| File | Purpose |
|------|---------|
| `20260225120000_schema_from_scratch.sql` | Base tables: `profiles`, `units`, `wishlists`, `pending_reservations`; RLS; realtime on `units`; signup trigger. |
| `20260227130000_add_floor_and_direction_to_units.sql` | Adds `units.floor`, `units.direction`. |
| `20260301120000_units_viewer_lock_update_policy.sql` | Allows **authenticated** users to `UPDATE` `units` (viewers + lock fields for presence and reservation flow). |
| `20260319120000_units_status_held_by_developer.sql` | Extends `units.status` check to include `'Held by Developer'`. |
| `20260421120000_units_storage_image_keys.sql` | Adds nullable `image_key_1` … `floorplan_key` for Supabase Storage paths. |
| `20260421133000_agents_table.sql` | Adds `agents` table (chat contacts), RLS read policy, and starter seed rows. |
| `20260421140000_profiles_first_last_name.sql` | Adds `profiles.first_name`, `profiles.last_name`. |
| `20260421140500_profiles_column_order_names_before_phone.sql` | Rebuilds `profiles` so physical column order is `first_name` / `last_name` before `phone` (Postgres has no `ALTER COLUMN … POSITION`). |
| `20260422110000_reservations_v2_source_of_truth.sql` | Adds canonical `reservations` + `zoho_sync_jobs`, plus transactional RPCs for payment finalize/cancel. |

Optional seed: `seed-units.sql` (demo data; uses legacy `image_url` column).

## Tables (creation order)

| Table | Purpose |
|-------|--------|
| `profiles` | 1:1 with `auth.users`; role, phone, reserved_unit_ids. Auto-created on signup. |
| `units` | Property units (listing, locks, status). Realtime enabled. |
| `agents` | Public contact agents for the floating chat widget. |
| `wishlists` | User ↔ unit favorites. RLS: user sees only own rows. |
| `pending_reservations` | Links unit + Zoho contact + user until payment completes. Used by submit-reservation and payment-webhook. |
| `reservations` | Canonical reservation lifecycle (pending/paid/cancelled/expired), with paystack + buyer + Zoho sync metadata. |
| `zoho_sync_jobs` | Retry queue for asynchronous Zoho projection of paid reservations. |

## Column reference

### profiles

- `id` (uuid, PK, FK → auth.users) — same as auth user id
- `role` (text) — `'user'` \| `'admin'`
- `first_name`, `last_name` (text, nullable) — added in `20260421140000_*`; written on signup and shown on profile
- `phone` (text, nullable)
- `id_passport_number`, `reason_for_buying` (text, nullable) — KYC-style fields used by signup/reservation flows
- `reserved_unit_ids` (uuid[], default `'{}'`) — unit ids for “My Units”; updated by payment-webhook
- `created_at`, `updated_at` (timestamptz)

### units

- `id` (uuid, PK)
- `unit_number`, `bedrooms`, `bathrooms`, `parking`, `size_sqm`, `price`, `unit_type`
- `status` (text) — `'Available'` \| `'Reserved'` \| `'Sold'` \| `'Held by Developer'`
- `floor`, `direction` (text, nullable) — added in follow-up migration
- **Images:** `image_url` (text, nullable) from the base migration — single absolute URL (e.g. seed data). Migration `20260421120000_*` adds `image_key_1` … `floorplan_key` for Supabase Storage object keys. The client uses `image_key_*` when set and **falls back** to `image_url` for the primary image when `image_key_1` is null (`frontend/utils/mapUnitRow.ts`).
- `viewers` (jsonb) — e.g. `{ "sessionId": 1700000000000 }` for presence TTL
- `lock_expires_at` (timestamptz), `locked_by` (uuid → auth.users) — reservation lock
- `created_at`, `updated_at` (timestamptz)

### wishlists

- `id` (uuid, PK), `user_id` (→ auth.users), `unit_id` (→ units), `created_at`
- Unique on `(user_id, unit_id)`

### agents

- `id` (uuid, PK)
- `name` (text), `title` (text, default `Sales Specialist`)
- `phone` (text), `email` (text), `image_url` (text, nullable)
- `sort_order` (int, default `0`), `is_active` (bool, default `true`)
- `created_at`, `updated_at` (timestamptz)

### pending_reservations

- `unit_id` (→ units), `zoho_contact_id` (text), `user_id` (→ auth.users)
- `zoho_reservation_id` (text, nullable) — set by submit-reservation for payment-webhook
- PK `(unit_id, zoho_contact_id)` for upsert

### reservations

- `id` (uuid, PK), `paystack_reference` (text, unique)
- `unit_id` (→ units), `user_id` (→ auth.users)
- `status` — `'payment_pending' | 'paid' | 'cancelled' | 'expired'`
- buyer snapshot fields (`buyer_first_name`, `buyer_last_name`, `buyer_email`, `buyer_phone`, `buyer_id_passport`, `buyer_reason_for_buying`, `unit_number_snapshot`)
- payment fields (`amount_cents`, `currency`, `paystack_status`, `paystack_paid_at`, `paystack_payload`)
- Zoho projection fields (`zoho_sync_status`, `zoho_last_error`, `zoho_lead_id`, `zoho_contact_id`, `zoho_reservation_id`)
- timestamps (`created_at`, `updated_at`, `paid_at`, `cancelled_at`, `expired_at`)

### zoho_sync_jobs

- `reservation_id` unique (→ reservations)
- `status` — `'pending' | 'processing' | 'retry' | 'succeeded' | 'failed' | 'cancelled'`
- retry fields (`attempt_count`, `max_attempts`, `run_after`, `locked_at`, `last_error`)
- `payload`, `created_at`, `updated_at`

## Auth

- Supabase Auth only. No custom claims.
- Display name and phone: also in `user_metadata` at signup; `profiles.phone`, `profiles.first_name`, and `profiles.last_name` are updated by the app where applicable.

## RLS (summary)

- **profiles**: users can read/update own row (`id = auth.uid()`).
- **units**: anyone can SELECT; authenticated can UPDATE (viewer + lock policy); INSERT/DELETE remain service role–only unless you add policies.
- **wishlists**: users can SELECT/INSERT/DELETE only their own rows.
- **agents**: anon/authenticated can SELECT active rows (`is_active = true`).
- **pending_reservations**: no client policies; edge functions (service role) read/write.
- **reservations**: users can read own rows; writes are service-role only.
- **zoho_sync_jobs**: no client policies; worker/webhook only.

## Realtime

- Enabled on `units` for the portal listing.

## Edge functions

See `backend/supabase/functions/README.md` for deploy and secrets. Functions used by this app include:

- **submit-reservation** — auth required; Zoho + Paystack reference; `pending_reservations` upsert.
- **cancel-reservation** — cancel flow; Zoho + lock release.
- **payment-webhook** — Paystack signature verify; Zoho + `units` + `profiles`.
- **create-lead** — Zoho Lead create/update (authenticated).
- **release-reservation-lock** — clears unit lock by payment ref.
- **submit-reservation** — fast Supabase-first staging; returns `resv_<reservation_id>` reference.
- **payment-webhook** — transactional DB finalize + async Zoho projection.
- **cancel-reservation** / **release-reservation-lock** — authenticated cancellation/abandon flows on canonical reservations.
- **zoho-sync-worker** — retry worker for failed Zoho sync jobs.

## Env (app + Supabase)

- **Nuxt:** `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, optional `SUPABASE_SERVICE_ROLE_KEY` for server routes (`check-email`, lock endpoints, cron). See repo root `.env.example` and `ENV-SUPABASE-KEYS.md`.
- **Edge function secrets:** Zoho + `PAYSTACK_SECRET_KEY` in Supabase Dashboard → Edge Functions → Secrets.
