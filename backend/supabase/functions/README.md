# Supabase Edge Functions

This directory contains Edge Functions for handling reservation submissions and payment webhooks.

## Functions

### 1. `submit-reservation`
Handles the "Proceed to Payment" flow:
- Receives form data from frontend
- Creates/updates contact in Zoho CRM with buyer info and reserved unit
- Generates PayFast payment URL
- Returns payment URL to frontend

### 2. `payment-webhook`
Handles PayFast payment confirmation:
- Receives webhook from PayFast when payment is completed
- Updates Zoho CRM contact: sets Deposit_Paid to true
- Updates unit status in Supabase to "Reserved"

## Setup Instructions

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in the sidebar
4. Click "Create a new function"
5. Name it `submit-reservation`
6. Copy/paste the code from `submit-reservation/index.ts`
7. Click "Deploy"
8. Repeat for `payment-webhook`

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

**PayFast:**
- `PAYFAST_MERCHANT_ID` - Your PayFast Merchant ID
- `PAYFAST_MERCHANT_KEY` - Your PayFast Merchant Key
- `PAYFAST_ENV` - "sandbox" or "production" (defaults to sandbox)
- `PAYFAST_RETURN_URL` - URL to redirect after successful payment (optional)
- `PAYFAST_CANCEL_URL` - URL to redirect if payment cancelled (optional)
- `PAYFAST_NOTIFY_URL` - Webhook URL (auto-set to your Edge Function URL)

### Using CLI:
```powershell
supabase secrets set ZOHO_CLIENT_ID=your_client_id
supabase secrets set ZOHO_CLIENT_SECRET=your_client_secret
supabase secrets set ZOHO_REFRESH_TOKEN=your_refresh_token
supabase secrets set ZOHO_API_DOMAIN=com
supabase secrets set PAYFAST_MERCHANT_ID=your_merchant_id
supabase secrets set PAYFAST_MERCHANT_KEY=your_merchant_key
supabase secrets set PAYFAST_ENV=sandbox
```

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

## PayFast Setup

1. Sign up at https://www.payfast.co.za/
2. Get your Merchant ID and Merchant Key from the dashboard
3. Set up your webhook URL in PayFast settings:
   - Go to Settings → Integration → Notify URL
   - Set to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook`
4. For testing, use sandbox credentials and set `PAYFAST_ENV=sandbox`

## Testing

1. Fill out the reservation form
2. Click "Proceed to Payment"
3. You should be redirected to PayFast
4. Complete a test payment
5. Check Zoho CRM - contact should show Deposit_Paid = true
6. Check Supabase - unit status should be "Reserved"
