/**
 * Viewer counts: optional poll + Realtime.
 * Matches old app (ignite-studios): after each poll we dispatch 'viewers-updated' so
 * components can force re-render and show latest count on all devices (Desktop).
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { CONFIG } from '~/config'

const VIEWERS_UPDATED_EVENT = 'viewers-updated'

const viewersMap = ref<Record<string, Record<string, number>>>({})
let pollIntervalId: ReturnType<typeof setInterval> | null = null
let visibilityHandler: (() => void) | null = null

function pruneViewers(raw: Record<string, number | string> | null | undefined): Record<string, number> {
  const now = Date.now()
  const ttl = CONFIG.PRESENCE_TTL_MS
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    const t = typeof value === 'number' ? value : Number(value)
    if (!Number.isNaN(t) && now - t <= ttl) out[key] = t
  }
  return out
}

function emitViewersUpdated(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(VIEWERS_UPDATED_EVENT))
  } catch {
    // ignore
  }
}

export function subscribeToViewersUpdates(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onUpdate()
  window.addEventListener(VIEWERS_UPDATED_EVENT, handler)
  return () => window.removeEventListener(VIEWERS_UPDATED_EVENT, handler)
}

export function useViewersPoll() {
  const { user } = useAuth()
  const config = useRuntimeConfig()
  const pollIntervalMs = (config.public.viewersPollMs as number) ?? CONFIG.VIEWERS_POLL_MS ?? 0

  function sync() {
    $fetch<{ data: { id: string; viewers?: Record<string, number> }[] }>('/api/units/viewers', {
      method: 'POST',
      cache: 'no-store',
    })
      .then(({ data }) => {
        if (!data?.length) return
        const next: Record<string, Record<string, number>> = {}
        for (const row of data) {
          next[row.id] = pruneViewers(row.viewers)
        }
        viewersMap.value = next
        emitViewersUpdated()
      })
      .catch((err) => {
        console.error('[useViewersPoll]', err)
      })
  }

  function startPolling() {
    if (pollIntervalId) return
    if (pollIntervalMs <= 0) return
    sync()
    pollIntervalId = setInterval(sync, pollIntervalMs)
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  function stopPolling() {
    if (pollIntervalId) {
      clearInterval(pollIntervalId)
      pollIntervalId = null
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  onMounted(() => {
    startPolling()
  })

  watch(user, () => {
    // Keep polling regardless of auth so "Currently Viewing" updates for all visitors
  })

  onBeforeUnmount(() => {
    // Keep poll running for app lifetime so other pages still get updates
  })

  return {
    viewersMap,
    getViewersForUnit(unitId: string): Record<string, number> | null {
      if (pollIntervalMs <= 0) return null
      const map = viewersMap.value[unitId]
      return map ?? null
    },
    subscribeToViewersUpdates,
  }
}
