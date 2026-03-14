# Supabase Edge Functions

This directory contains Edge Functions for handling reservation submissions and payment webhooks.

## Functions

### 1. `submit-reservation`
Handles the "Proceed to Payment" flow:
- Receives form data from frontend
- Creates/updates contact in Zoho CRM with buyer info and reserved unit
- Returns a payment reference, email, and amount so the frontend can open the **Paystack inline popup** (no redirect)

### 2. `cancel-reservation`
Called when the user closes the Paystack popup without paying (or clicks a cancel control). Updates Zoho `Unit_Reservations.Payment_Status` to **Cancelled**, releases the unit lock in Supabase, and removes the row from `pending_reservations`. Requires `Authorization: Bearer <user JWT>` and body `{ "paymentReference": "unitId.zohoContactId.timestamp" }`.

### 3. `payment-webhook`
Handles payment confirmation from Paystack (and optionally legacy PayFast):
- Receives webhook from Paystack when payment succeeds or fails
- Verifies Paystack signature (`x-paystack-signature`)
- Updates Zoho CRM Unit_Reservations: sets `Payment_Status` to Paid or Cancelled
- Updates unit status in Supabase and user profile (`reserved_unit_ids`)

## Setup Instructions

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in the sidebar
4. Click "Create a new function"
5. Name it `submit-reservation`
6. Copy/paste the code from `submit-reservation/index.ts`
7. Click "Deploy"
8. Repeat for `cancel-reservation` and `payment-webhook`

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
   ```powershell
   npm install -g supabase
   ```

2. Login to Supabase:
   ```powershell
   supabase login
   ```

3. Link your project:
   ```powershell
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Find your Project Ref in Supabase Dashboard → Settings → General

4. Deploy functions:
   ```powershell
   supabase functions deploy submit-reservation
   supabase functions deploy payment-webhook
   ```

## Setting Secrets (API Credentials)

### In Supabase Dashboard:
1. Go to Settings → Edge Functions → Secrets
2. Add each secret:

**Zoho CRM:**
- `ZOHO_CLIENT_ID` - Your Zoho API Client ID
- `ZOHO_CLIENT_SECRET` - Your Zoho API Client Secret
- `ZOHO_REFRESH_TOKEN` - Your Zoho Refresh Token
- `ZOHO_API_DOMAIN` - Your Zoho domain (com, eu, in, etc.) - defaults to "com"

**Paystack (webhook verification only; inline checkout uses the public key on the frontend):**
- `PAYSTACK_SECRET_KEY` - Your Paystack secret key (test or live), used to verify webhook signatures

### Using CLI:
```powershell
supabase secrets set ZOHO_CLIENT_ID=your_client_id
supabase secrets set ZOHO_CLIENT_SECRET=your_client_secret
supabase secrets set ZOHO_REFRESH_TOKEN=your_refresh_token
supabase secrets set ZOHO_API_DOMAIN=com
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxx
```

**App (Nuxt) env** – for the inline Paystack popup on the reserve page, set in your `.env` (see repo root):
- `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Your Paystack **public** key (e.g. `pk_test_...` or `pk_live_...`)

## Zoho CRM Field Mapping

The Edge Function maps form fields to these Zoho CRM Contact fields:
- `First_Name` - Name
- `Last_Name` - Surname
- `Email` - Email
- `Phone` - Phone (with +27 prefix)
- `ID_Passport_Number` - ID/Passport Number (custom field)
- `Reason_for_Buying` - Reason for Buying (custom field)
- `Reserved_Unit` - Unit Number (custom field)
- `Deposit_Paid` - Boolean (updated after payment)

**Important:** Make sure these custom fields exist in your Zoho CRM Contacts module:
1. Go to Setup → Customization → Modules → Contacts → Fields
2. Create fields if they don't exist:
   - ID_Passport_Number (Text)
   - Reason_for_Buying (Pick List or Text)
   - Reserved_Unit (Text)
   - Deposit_Paid (Checkbox or Pick List)

## Paystack Setup

1. Sign up at [Paystack](https://paystack.com/) and complete verification for your business.
2. Get your **Secret Key** from the dashboard (Settings → API Keys & Webhooks). Use the **test** key for development.
3. Configure the webhook in Paystack:
   - Go to Settings → API Keys & Webhooks → Webhooks
   - Add URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook`
   - Ensure events such as **charge.success** and **charge.failed** are selected (or use “All events” for simplicity).
4. Set the secrets in Supabase (see above). For testing use a key that starts with `sk_test_`.

## Testing

1. Fill out the reservation form on the reserve page.
2. Click "Proceed to Payment".
3. You should be redirected to the Paystack checkout page.
4. Complete a test payment (use Paystack test cards in test mode).
5. Check Zoho CRM: the relevant Unit_Reservations record should have `Payment_Status` = Paid.
6. Check Supabase: the unit’s `status` should be "Reserved" and the unit should appear in the user’s `reserved_unit_ids`.
