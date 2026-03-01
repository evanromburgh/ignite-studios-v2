# Supabase – Ignite Portal

Use the **Legacy** anon key for `NUXT_PUBLIC_SUPABASE_ANON_KEY` when calling Edge Functions.

- **Dashboard:** Project → **Settings** → **API**
- Under **Legacy API Keys** (or **Project API keys**), copy the **anon** / **public** key (long JWT starting with `eyJ...`).
- Put that in `.env` as `NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`
- Do **not** use the new **Publishable key** (`sb_publishable_...`) for Edge Function calls; the gateway may return 401.

Same project: ensure `NUXT_PUBLIC_SUPABASE_URL` matches the project where you deploy Edge Functions (e.g. `https://bhmgvodqmdwnwntffvsd.supabase.co`).
