export default defineNuxtConfig({
  compatibilityDate: '2025-02-25',
  devtools: { enabled: true },
  srcDir: 'frontend/',
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  app: {
    head: {
      title: 'Ignite Studios | Property Reservation Portal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Ignite Studios property reservation portal' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
      ],
      bodyAttrs: {
        class: 'bg-black text-zinc-100 antialiased',
      },
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      /** Viewer count poll interval (ms). 1500 = same as /portal. 0 = Realtime only. */
      viewersPollMs: process.env.NUXT_PUBLIC_VIEWERS_POLL_MS != null ? Number(process.env.NUXT_PUBLIC_VIEWERS_POLL_MS) : 1_500,
    },
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  routeRules: {
    '/': { isr: 60 },
    '/documents': { isr: 3600 },
    '/contact': { static: true },
  },
  nitro: {
    minify: false,
  },
  typescript: {
    strict: true,
  },
  vite: {
    server: {
      host: true, // listen on 0.0.0.0 so phone/other devices can reach dev server
      // Use explicit HMR WebSocket to reduce Windows named-pipe disconnects (ENOENT on //./pipe/nuxt-vite-node-*)
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 24678,
      },
    },
  },
})
