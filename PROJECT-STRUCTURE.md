# Project structure

Quick reference for **Frontend** vs **Backend** in this repo.

## Frontend (`frontend/`)

- **`app.vue`** – Root Vue app
- **`assets/`** – CSS, images, fonts
- **`components/`** – Vue components
- **`composables/`** – Vue composables (client logic)
- **`data/`** – Static/shared data (e.g. phone countries)
- **`layouts/`** – Nuxt layouts
- **`pages/`** – Routes/views
- **`plugins/`** – Vue/Nuxt client plugins
- **`config.ts`**, **`types.ts`** – App config and shared types

Config at repo root: **`nuxt.config.ts`**, **`tailwind.config.js`**.

## Backend (`backend/`)

- **`backend/server/`** – Nuxt/Nitro API routes (`/api/*`), server logic
- **`backend/supabase/`** – Migrations, Edge Functions, schema, seeds

When using the Supabase CLI (e.g. `supabase db push`, `supabase functions deploy`), run from the repo root with workdir set:

```bash
supabase --workdir backend <command>
```

Or set `SUPABASE_WORKDIR=backend` in your environment.

## Shared / config (repo root)

- **`.env`**, **`.env.example`** – Environment and keys
- **`package.json`**, **`tsconfig.json`** – Dependencies and TypeScript

---

**Tip:** Open `ignite-portal.code-workspace` in Cursor/VS Code (**File → Open Workspace from File**) to see **Frontend** and **Backend** as separate roots in the sidebar.
