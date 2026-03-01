/**
 * Viewer counts: matches ignite-studios (ignite-studios-portals.vercel.app).
 * - Single poll: .from('units').select('id, viewers') every 1.5s when user is logged in.
 * - Dispatches 'viewers-updated' so components re-render.
 * - No TTL pruning in fetch (same as old app).
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { CONFIG } from '~/config'

const VIEWERS_UPDATED_EVENT = 'viewers-updated'

const viewersMap = ref<Record<string, Record<string, number>>>({})
let pollIntervalId: ReturnType<typeof setInterval> | null = null
let visibilityHandler: (() => void) | null = null

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
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  const config = useRuntimeConfig()
  const pollIntervalMs = (config.public.viewersPollMs as number) ?? CONFIG.VIEWERS_POLL_MS ?? 1_500

  function sync() {
    $supabase
      .from('units')
      .select('id, viewers')
      .then(({ data, error }) => {
        if (error || !data) return
        const next: Record<string, Record<string, number>> = {}
        for (const row of data as { id: string; viewers?: Record<string, number> }[]) {
          const v = row.viewers
          next[row.id] = v && typeof v === 'object' ? v : {}
        }
        viewersMap.value = next
        emitViewersUpdated()
      })
      .catch((err) => console.error('[useViewersPoll]', err))
  }

  function startPolling() {
    if (pollIntervalId) return
    if (!user.value) return
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
    if (user.value) startPolling()
  })

  watch(user, (u) => {
    if (u) startPolling()
    else stopPolling()
  })

  onBeforeUnmount(() => {})

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
