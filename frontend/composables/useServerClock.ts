/**
 * Syncs client clock with server so reservation timer shows correct countdown (e.g. 10:00) on all devices.
 * Uses a shared ref and a single app-wide sync/interval so we don't fire N server-time requests per minute.
 */
const serverClockOffsetMs = ref(0)
let serverClockSyncStarted = false
let serverClockIntervalId: ReturnType<typeof setInterval> | null = null

export function useServerClock() {
  const sync = async () => {
    try {
      const data = await $fetch<{ serverTimeMs: number }>('/api/server-time')
      const serverMs = data?.serverTimeMs
      if (typeof serverMs === 'number' && !Number.isNaN(serverMs)) {
        serverClockOffsetMs.value = serverMs - Date.now()
      }
    } catch {
      // keep previous offset or 0
    }
  }

  onMounted(() => {
    if (serverClockSyncStarted) return
    serverClockSyncStarted = true
    sync()
    serverClockIntervalId = setInterval(sync, 60_000)
  })

  /** Current time in ms aligned to server (use for timer countdown). */
  function effectiveNow() {
    return Date.now() + serverClockOffsetMs.value
  }

  return { serverClockOffsetMs, effectiveNow, sync }
}
