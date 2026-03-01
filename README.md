# Ignite Portal (Nuxt)

The **main app** for Ignite Studios. The repo root is this app.

## Tech stack

- **Framework:** Nuxt 3 (Vue)
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Payments:** PayFast (via Supabase Edge Functions)

## Setup

1. **From the repo root:**

   ```bash
   npm install
   ```

2. **Environment:** Copy `.env.example` to `.env`. Set:

   - `NUXT_PUBLIC_SUPABASE_URL` – your Supabase project URL  
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon key  

3. **Run:**

   ```bash
   npm run dev
   ```

   App runs at `http://localhost:3000` (or the port Nuxt prints).

## Env and secrets

- **App env:** Use `.env` in the repo root. Do not commit it.
- **Supabase CLI:** When running Supabase commands (migrations, functions), use the backend workdir:  
  `supabase --workdir backend <command>` or set `SUPABASE_WORKDIR=backend`.
- **Supabase Edge Function secrets** (Zoho, PayFast, return/cancel URLs): set in **Supabase Dashboard** → Project Settings → Edge Functions → Secrets.  
  Set `PAYFAST_RETURN_URL` and `PAYFAST_CANCEL_URL` to your app URLs (e.g. `https://your-domain.com/payment-success` and `.../payment-cancel`).

## Deploy

Build and deploy from the repo root (e.g. Vercel). Configure the same env vars on the host.

## Feature status

See [FEATURE-CHECKLIST.md](./FEATURE-CHECKLIST.md) for what’s done and what’s next.
