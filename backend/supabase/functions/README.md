# Supabase Edge Functions

Current production functions for the Supabase-first reservation flow.

## Shared code

- `_shared/reservationReference.ts`
- `_shared/zohoReservationSync.ts`
- `_shared/zohoProfileSync.ts`

## Active functions

1. `submit-reservation`  
   Starts checkout quickly, creates a canonical `reservations` row, and returns `resv_<reservation_id>`.

2. `payment-webhook`  
   Verifies Paystack webhooks and finalizes DB state through `finalize_reservation_payment_v2`.

3. `confirm-payment`  
   Client-triggered fallback that verifies transaction with Paystack and finalizes payment if webhook is delayed.

4. `cancel-reservation`  
   Authenticated cancellation endpoint that marks pending reservation as cancelled.

5. `release-reservation-lock`  
   Authenticated checkout-abandon endpoint that releases reservation lock via cancellation RPC.

6. `zoho-sync-worker`  
   Worker for queued Zoho sync retries from both `zoho_sync_jobs` and `zoho_profile_sync_jobs` with isolated handlers.

7. `create-lead`  
   Creates/updates Zoho lead from signup flow.

## Deploy (CLI)

```powershell
supabase functions deploy create-lead --no-verify-jwt
supabase functions deploy submit-reservation --no-verify-jwt
supabase functions deploy payment-webhook --no-verify-jwt
supabase functions deploy confirm-payment --no-verify-jwt
supabase functions deploy cancel-reservation --no-verify-jwt
supabase functions deploy release-reservation-lock --no-verify-jwt
supabase functions deploy zoho-sync-worker --no-verify-jwt
```

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_API_DOMAIN`

Optional:

- `CRON_SECRET`
- `ZOHO_SYNC_BATCH_SIZE` (default `10`)
- `RESERVATION_DEPOSIT_ZAR` (default `10000`)

## Paystack webhook

- `https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook`
