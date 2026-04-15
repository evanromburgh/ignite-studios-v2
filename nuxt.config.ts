import { fileURLToPath } from 'node:url'
import { resolve as resolvePath } from 'node:path'

const configDir = fileURLToPath(new URL('.', import.meta.url))

/** Default branding URLs (Supabase Storage, `assets` bucket / `branding/`). Override via NUXT_PUBLIC_BRANDING_* at deploy time. */
const defaultPublicBranding = {
  faviconUrl:
    'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/assets/branding/favicon.png',
  logoLightUrl:
    'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/assets/branding/logo_light.svg',
  logoDarkUrl:
    'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/assets/branding/logo_dark.svg',
  seoImageUrl:
    'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/assets/images/seo_image.webp',
} as const

const defaultSeoTitle = 'Streamline Your Unit Reservation Process'
const defaultSeoDescription = 'Ignite Studios gives your team one portal to view available units, reserve them, and keep required reservation documents organized.'

export default defineNuxtConfig({
  compatibilityDate: '2025-02-25',
  devtools: { enabled: true },
  srcDir: 'frontend/',
  modules: [
    '@nuxtjs/tailwindcss',
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
    minify: false,
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
      alias: {
        // These aliases are needed because Nuxt internal virtual modules
        // can be unresolved during Vite pre-transform in this setup.
        '#app-manifest': resolvePath(configDir, 'nuxt-app-manifest-stub.mjs'),
        '#internal/nuxt/paths': resolvePath(configDir, 'nuxt-internal-paths-stub.mjs'),
      },
    },
  },
})
