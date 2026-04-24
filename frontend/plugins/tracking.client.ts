import { APP_SETTINGS_DATA_KEY, type AppSettingsPublic } from '~/composables/useSalesMode'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    _fbq?: Window['fbq']
  }
}

function appendScriptOnce(id: string, src: string): void {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function appendInlineScriptOnce(id: string, code: string): void {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.text = code
  document.head.appendChild(script)
}

function clean(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim()
  return value || null
}

function validGaId(id: string): boolean {
  return /^G-[A-Z0-9]{4,}$/i.test(id)
}

function validGtmId(id: string): boolean {
  return /^GTM-[A-Z0-9]{4,}$/i.test(id)
}

function validMetaPixelId(id: string): boolean {
  return /^\d{8,20}$/.test(id)
}

export default defineNuxtPlugin(() => {
  if (import.meta.dev) return

  const config = useRuntimeConfig()
  // Emergency kill-switch: set NUXT_PUBLIC_ENABLE_TRACKING_RUNTIME=false to disable.
  const trackingEnabled = String(config.public.enableTrackingRuntime ?? 'true').toLowerCase() !== 'false'
  if (!trackingEnabled) return

  const route = useRoute()
  const appEntry = useNuxtData<AppSettingsPublic>(APP_SETTINGS_DATA_KEY)

  const initializedGa = new Set<string>()
  const initializedGtm = new Set<string>()
  const initializedMeta = new Set<string>()
  let lastTrackedPath = ''

  const gaId = computed(() => clean(appEntry.data.value?.googleAnalyticsId))
  const gtmId = computed(() => clean(appEntry.data.value?.googleTagManagerId))
  const metaId = computed(() => clean(appEntry.data.value?.metaPixelId))

  if (!appEntry.data.value) {
    void refreshNuxtData(APP_SETTINGS_DATA_KEY)
  }

  function trackPageView(path: string) {
    if (gaId.value && validGaId(gaId.value) && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        send_to: gaId.value,
      })
    }

    if (metaId.value && validMetaPixelId(metaId.value) && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }

  function ensureTrackingLoaded() {
    if (gaId.value && validGaId(gaId.value) && !initializedGa.has(gaId.value)) {
      appendScriptOnce('ignite-ga-lib', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId.value)}`)
      appendInlineScriptOnce(
        `ignite-ga-init-${gaId.value}`,
        `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${gaId.value}', { send_page_view: false });`,
      )
      initializedGa.add(gaId.value)
    }

    if (gtmId.value && validGtmId(gtmId.value) && !initializedGtm.has(gtmId.value)) {
      window.dataLayer = window.dataLayer || []
      appendScriptOnce('ignite-gtm-lib', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId.value)}`)
      initializedGtm.add(gtmId.value)
    }

    if (metaId.value && validMetaPixelId(metaId.value) && !initializedMeta.has(metaId.value)) {
      appendInlineScriptOnce(
        'ignite-meta-init',
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`,
      )
      if (typeof window.fbq === 'function') {
        window.fbq('init', metaId.value)
      } else {
        appendInlineScriptOnce(`ignite-meta-config-${metaId.value}`, `fbq('init', '${metaId.value}');`)
      }
      initializedMeta.add(metaId.value)
    }

    const path = route.fullPath || '/'
    if (path !== lastTrackedPath) {
      trackPageView(path)
      lastTrackedPath = path
    }
  }

  watch(
    () => [gaId.value, gtmId.value, metaId.value],
    ensureTrackingLoaded,
    { immediate: true },
  )

  watch(
    () => route.fullPath,
    (path) => {
      if (!path || path === lastTrackedPath) return
      trackPageView(path)
      lastTrackedPath = path
    },
  )
})
