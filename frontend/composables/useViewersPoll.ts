/**
 * Viewer counts: optional poll + Realtime.
 * - VIEWERS_POLL_MS > 0: poll units (id, viewers) at that interval so all clients see updates quickly (adds DB read load).
 * - VIEWERS_POLL_MS === 0: no polling; rely on Supabase Realtime only (scales to extreme traffic).
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { CONFIG } from '~/config'

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

export function useViewersPoll() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  const config = useRuntimeConfig()
  const pollIntervalMs = (config.public.viewersPollMs as number) ?? CONFIG.VIEWERS_POLL_MS ?? 0

  function sync() {
    $supabase
      .from('units')
      .select('id, viewers')
      .then(({ data, error }) => {
        if (error || !data) return
        const next: Record<string, Record<string, number>> = {}
        for (const row of data as { id: string; viewers?: Record<string, number> }[]) {
          next[row.id] = pruneViewers(row.viewers)
        }
        viewersMap.value = next
      })
      .catch((err) => console.error('[useViewersPoll]', err))
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
    if (user.value) startPolling()
  })

  watch(user, (u) => {
    if (u) startPolling()
    else stopPolling()
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
  }
}
