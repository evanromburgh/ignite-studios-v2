import { defineConfig, devices } from '@playwright/test'

/** Lets the app boot in CI/local E2E without real Supabase credentials (client plugin requires both). */
const e2eSupabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const e2eSupabaseAnonKey =
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build/preview in isolated dirs so E2E cleanup can't break a running `nuxt dev`.
    command: 'npm run build:clean && npm run preview:e2e',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NUXT_BUILD_DIR: '.nuxt-e2e',
      NITRO_OUTPUT_DIR: '.output-e2e',
      NUXT_PUBLIC_SUPABASE_URL: e2eSupabaseUrl,
      NUXT_PUBLIC_SUPABASE_ANON_KEY: e2eSupabaseAnonKey,
    },
  },
})
