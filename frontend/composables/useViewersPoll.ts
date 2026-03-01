/**
 * Viewer counts for "currently viewing" – built for high traffic.
 * Uses Supabase Realtime (postgres_changes on units) instead of polling so we only
 * get updates when viewers actually change. One initial fetch + subscription when user is logged in.
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const VIEWERS_UPDATED_EVENT = 'viewers-updated'

const viewersMap = ref<Record<string, Record<string, number>>>({})
let channel: { unsubscribe: () => void } | null = null

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

function setViewersFromRow(row: { id: string; viewers?: Record<string, number> | null }): void {
  const v = row.viewers
  viewersMap.value = {
    ...viewersMap.value,
    [row.id]: v && typeof v === 'object' ? v : {},
  }
}

export function useViewersPoll() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  function stopRealtime() {
    if (channel) {
      channel.unsubscribe()
      channel = null
    }
    viewersMap.value = {}
  }

  function startRealtime() {
    if (channel) return
    if (!user.value) return

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
      .catch((err) => console.error('[useViewersPoll] initial fetch', err))

    channel = $supabase
      .channel('viewers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units' },
        (payload) => {
          const newRow = payload.new as { id: string; viewers?: Record<string, number> } | undefined
          const oldRow = payload.old as { id: string } | undefined
          if (payload.eventType === 'INSERT' && newRow) {
            setViewersFromRow(newRow)
          } else if (payload.eventType === 'UPDATE' && newRow) {
            setViewersFromRow(newRow)
          } else if (payload.eventType === 'DELETE' && oldRow) {
            const next = { ...viewersMap.value }
            delete next[oldRow.id]
            viewersMap.value = next
          }
          emitViewersUpdated()
        },
      )
      .subscribe()
  }

  onMounted(() => {
    if (user.value) startRealtime()
  })

  watch(user, (u) => {
    if (u) startRealtime()
    else stopRealtime()
  })

  onBeforeUnmount(() => {})

  return {
    viewersMap,
    getViewersForUnit(unitId: string): Record<string, number> | null {
      const map = viewersMap.value[unitId]
      return map ?? null
    },
    subscribeToViewersUpdates,
  }
}
