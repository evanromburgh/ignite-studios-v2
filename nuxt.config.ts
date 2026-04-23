import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve as resolvePath } from 'node:path'

const configDir = fileURLToPath(new URL('.', import.meta.url))

/**
 * Nuxt’s default `#internal/nuxt/paths` alias is an absolute Windows path (`C:\...`).
 * Vite 7 / vite-node can pass that to Node’s `import()`, which only accepts `file://` URLs → "Received protocol 'c:'".
 */
function winFsPathToFileUrlIfNeeded(target: string): string {
  if (!target || target.startsWith('file:') || target.startsWith('\0') || target.startsWith('/@fs/')) {
    return target
  }
  if (/^[a-zA-Z]:[\\/]/.test(target) || target.startsWith('\\\\')) {
    return pathToFileURL(target).href
  }
  return target
}

function normalizeViteAlias(alias: unknown): void {
  if (!alias) return
  if (Array.isArray(alias)) {
    for (const entry of alias) {
      if (entry && typeof entry === 'object' && typeof (entry as { replacement?: unknown }).replacement === 'string') {
        (entry as { replacement: string }).replacement = winFsPathToFileUrlIfNeeded(
          (entry as { replacement: string }).replacement,
        )
      }
    }
    return
  }
  if (typeof alias === 'object' && alias !== null) {
    for (const key of Object.keys(alias)) {
      const val = (alias as Record<string, unknown>)[key]
      if (typeof val === 'string') {
        (alias as Record<string, string>)[key] = winFsPathToFileUrlIfNeeded(val)
      }
    }
  }
}

function normalizeViteConfigAliases(config: Record<string, unknown>): void {
  const resolve = config.resolve as Record<string, unknown> | undefined
  if (resolve && 'alias' in resolve) normalizeViteAlias(resolve.alias)
  const envs = config.environments as Record<string, unknown> | undefined
  if (!envs) return
  for (const env of Object.values(envs)) {
    if (env && typeof env === 'object') {
      const r = (env as Record<string, unknown>).resolve as Record<string, unknown> | undefined
      if (r && 'alias' in r) normalizeViteAlias(r.alias)
    }
  }
}

/** Stub only for `#app-manifest` (dead path); `#internal/nuxt/paths` must stay Nuxt’s `.nuxt/paths.mjs` + hook below. */
const STUB_APP_MANIFEST_FS = resolvePath(configDir, 'nuxt-app-manifest-stub.mjs')
const stubAppManifestAlias = {
  '#app-manifest': pathToFileURL(STUB_APP_MANIFEST_FS).href,
} as const

const envSupabaseUrl = (process.env.NUXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
const defaultAssetsPublicBase = envSupabaseUrl
  ? `${envSupabaseUrl}/storage/v1/object/public/assets`
  : ''

/** Default branding URLs (Supabase Storage, `assets` bucket / `branding/`). Override via NUXT_PUBLIC_BRANDING_* at deploy time. */
const defaultPublicBranding = {
  faviconUrl: defaultAssetsPublicBase ? `${defaultAssetsPublicBase}/branding/favicon.png` : '',
  logoLightUrl: defaultAssetsPublicBase ? `${defaultAssetsPublicBase}/branding/logo_light.svg` : '',
  logoDarkUrl: defaultAssetsPublicBase ? `${defaultAssetsPublicBase}/branding/logo_dark.svg` : '',
  seoImageUrl: defaultAssetsPublicBase ? `${defaultAssetsPublicBase}/images/seo_image.webp` : '',
} as const

const defaultSeoTitle = 'Streamline Your Unit Reservation Process'
const defaultSeoDescription = 'Ignite Studios gives your team one portal to view available units, reserve them, and keep required reservation documents organized.'

export default defineNuxtConfig({
 compatibilityDate: '2025-02-25',
 devtools: { enabled: true },
 srcDir: 'frontend/',

 // Allow isolated build artifacts (e.g. E2E) so cleanup/build commands
 // don't invalidate a concurrently running local dev server.
 buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',

 hooks: {
   'vite:extendConfig'(config) {
     normalizeViteConfigAliases(config as Record<string, unknown>)
   },
   // Second pass: Nuxt may register aliases after early `extendConfig` (e.g. per-environment).
   'vite:configResolved'(config) {
     normalizeViteConfigAliases(config as Record<string, unknown>)
   },
 },

 modules: [
   '@nuxtjs/tailwindcss',
   '@sentry/nuxt/module',
 ],

 app: {
   head: {
     title: process.env.NUXT_PUBLIC_SEO_TITLE || defaultSeoTitle,
     meta: [
       { charset: 'utf-8' },
       { name: 'viewport', content: 'width=device-width, initial-scale=1' },
       {
         name: 'description',
         content: process.env.NUXT_PUBLIC_SEO_DESCRIPTION || defaultSeoDescription,
       },
       { property: 'og:type', content: 'website' },
       {
         property: 'og:title',
         content: process.env.NUXT_PUBLIC_SEO_TITLE || defaultSeoTitle,
       },
       {
         property: 'og:description',
         content: process.env.NUXT_PUBLIC_SEO_DESCRIPTION || defaultSeoDescription,
       },
       {
         property: 'og:image',
         content: process.env.NUXT_PUBLIC_SEO_IMAGE_URL || defaultPublicBranding.seoImageUrl,
       },
       { name: 'twitter:card', content: 'summary_large_image' },
       {
         name: 'twitter:title',
         content: process.env.NUXT_PUBLIC_SEO_TITLE || defaultSeoTitle,
       },
       {
         name: 'twitter:description',
         content: process.env.NUXT_PUBLIC_SEO_DESCRIPTION || defaultSeoDescription,
       },
       {
         name: 'twitter:image',
         content: process.env.NUXT_PUBLIC_SEO_IMAGE_URL || defaultPublicBranding.seoImageUrl,
       },
       // Prevent iOS WebKit (Safari/Chrome) from auto-linking numbers/dates/addresses.
       { name: 'format-detection', content: 'telephone=no, date=no, address=no, email=no' },
       { name: 'x-apple-disable-message-reformatting', content: 'yes' },
     ],
     link: [
       { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
       { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
       { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap' },
     ],
     bodyAttrs: {
       class: 'antialiased',
       style: 'background:#18181B;',
     },
   },
 },

 css: ['~/assets/css/main.css'],

 runtimeConfig: {
   public: {
     supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
     supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
     sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
     /** Append ?v=this to unit image URLs to bust caches after updating images (e.g. NUXT_PUBLIC_IMAGE_CACHE_BUST=2). */
     imageCacheBust: process.env.NUXT_PUBLIC_IMAGE_CACHE_BUST || '',
     /** Per-client theme: object of CSS variable names to values, e.g. { '--theme-bg': '#0f0f0f' }. Set via NUXT_PUBLIC_THEME_* or in nuxt.config. */
     theme: {},
     /** Paystack public key for inline checkout popup (pk_test_... or pk_live_...). */
     paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
     branding: { ...defaultPublicBranding },
   },
   supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
   cronSecret: process.env.CRON_SECRET || '',
 },

 routeRules: {
   '/': { isr: 60 },
   '/documents': { isr: 3600 },
 },

 nitro: {
   // On Vercel, `preset: 'vercel'` and default `output` (no NITRO_OUTPUT_DIR) so Build Output API matches the platform.
   // Local builds keep `.output/` for `nuxt preview`; E2E can set NITRO_OUTPUT_DIR.
   minify: false,
   ...(process.env.VERCEL ? { preset: 'vercel' as const } : {}),
   ...(process.env.NITRO_OUTPUT_DIR
     ? { output: { dir: process.env.NITRO_OUTPUT_DIR } }
     : !process.env.VERCEL
       ? { output: { dir: '.output' } }
       : {}),
 },

 typescript: {
   strict: true,
 },

 vite: {
   server: {
     // listen on 0.0.0.0 so phone/other devices can reach dev server
     // (configure via env/CLI; Nuxt's config typing doesn't allow `vite.server.host` here)
     // Use explicit HMR WebSocket to reduce Windows named-pipe disconnects (ENOENT on //./pipe/nuxt-vite-node-*)
     hmr: {
       protocol: 'ws',
       host: 'localhost',
       port: 24678,
     },
   },
   resolve: {
     alias: { ...stubAppManifestAlias },
   },
 },

 sentry: {
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
  org: 'ignite-studios',
  project: 'javascript-nuxt',
  autoInjectServerSentry: 'top-level-import'
 },

 sourcemap: {
  client: 'hidden'
 }
})