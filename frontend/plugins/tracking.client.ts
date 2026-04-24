import { useSalesMode } from '~/composables/useSalesMode'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: (...args: unknown[]) => void }
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

function sanitizeCode(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim()
  return value ? value : null
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const { googleAnalyticsId, googleTagManagerId, metaPixelId } = useSalesMode()

  const initializedGa = new Set<string>()
  const initializedGtm = new Set<string>()
  const initializedMeta = new Set<string>()
  let lastTrackedPath = ''

  function trackPageView(path: string) {
    const gaId = sanitizeCode(googleAnalyticsId.value)
    if (gaId && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        send_to: gaId,
      })
    }

    if (sanitizeCode(metaPixelId.value) && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }

  function ensureTrackingLoaded() {
    const gaId = sanitizeCode(googleAnalyticsId.value)
    if (gaId && !initializedGa.has(gaId)) {
      appendScriptOnce('ignite-ga-lib', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`)
      appendInlineScriptOnce(
        `ignite-ga-init-${gaId}`,
        `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${gaId}', { send_page_view: false });`,
      )
      initializedGa.add(gaId)
    }

    const gtmId = sanitizeCode(googleTagManagerId.value)
    if (gtmId && !initializedGtm.has(gtmId)) {
      window.dataLayer = window.dataLayer || []
      appendScriptOnce('ignite-gtm-lib', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`)
      initializedGtm.add(gtmId)
    }

    const metaId = sanitizeCode(metaPixelId.value)
    if (metaId && !initializedMeta.has(metaId)) {
      appendInlineScriptOnce(
        'ignite-meta-init',
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`,
      )
      if (typeof window.fbq === 'function') {
        window.fbq('init', metaId)
      } else {
        appendInlineScriptOnce(`ignite-meta-config-${metaId}`, `fbq('init', '${metaId}');`)
      }
      initializedMeta.add(metaId)
    }

    const path = route.fullPath || '/'
    if (path !== lastTrackedPath) {
      trackPageView(path)
      lastTrackedPath = path
    }
  }

  watch(
    () => [googleAnalyticsId.value, googleTagManagerId.value, metaPixelId.value],
    () => ensureTrackingLoaded(),
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
