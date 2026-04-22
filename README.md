# Ignite Portal (Nuxt)

The **main app** for Ignite Studios. The repo root is this app.

## Tech stack

- **Framework:** Nuxt 3 (Vue)
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Payments:** Paystack (via Supabase Edge Functions)

## Setup

1. **From the repo root:**

   ```bash
   npm install
   ```

2. **Environment:** Copy `.env.example` to `.env`. Set at least:

   - `NUXT_PUBLIC_SUPABASE_URL` – your Supabase project URL  
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon key (see `ENV-SUPABASE-KEYS.md` for legacy vs publishable keys)  
   - `SUPABASE_SERVICE_ROLE_KEY` – required for server APIs (unit lock, email check, cron prune)  
   - Agent contacts for the chat widget come from Supabase table `public.agents` (migration-managed), not `.env`.

   Database layout and migrations: `backend/supabase/SCHEMA.md`.

3. **Run:**

   ```bash
   npm run dev
   ```

   App runs at `http://localhost:3000` (or the port Nuxt prints).

   **Windows:** The dev overlay may show `Received protocol 'c:'` when Vite passes a bare `C:\...` path to Node’s `import()`. This project normalizes those aliases in `nuxt.config.ts` (`vite:extendConfig` hook). If it still appears, run `npx nuxi cleanup` and `npm run dev` again; for preview/E2E use `npm run build:clean` after switching from dev. If you see `#internal/nuxt/paths` is not defined in `package.json`, run `npm install` (runs `nuxi prepare`) so tooling stays in sync; the repo maps that specifier for Node in root `package.json` + `nuxt-internal-paths-node.mjs`.

## Env and secrets

- **App env:** Use `.env` in the repo root. Do not commit it.
- **Supabase CLI:** When running Supabase commands (migrations, functions), use the backend workdir:  
  `supabase --workdir backend <command>` or set `SUPABASE_WORKDIR=backend`.
- **Supabase Edge Function secrets** (Zoho, Paystack): set in **Supabase Dashboard** → Project Settings → Edge Functions → Secrets.  
  Set `PAYSTACK_SECRET_KEY` and optionally `PAYSTACK_CALLBACK_URL` (e.g. `https://your-domain.com/payment-success`). See `backend/supabase/functions/README.md` for full list.

## Deploy

Build and deploy from the repo root (e.g. Vercel). Configure the same env vars on the host.
