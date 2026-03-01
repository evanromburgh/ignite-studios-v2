/**
 * Syncs client clock with server so reservation timer shows correct countdown (e.g. 10:00) on all devices.
 * Without this, mobile devices with wrong system time show wrong remaining time (e.g. 13:28 instead of 10:00).
 * Uses a shared ref so the offset is reused across pages (e.g. list page sync is still valid on reserve page).
 */
const serverClockOffsetMs = ref(0)

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
    sync()
    const interval = setInterval(sync, 60_000)
    onBeforeUnmount(() => clearInterval(interval))
  })

  /** Current time in ms aligned to server (use for timer countdown). */
  function effectiveNow() {
    return Date.now() + serverClockOffsetMs.value
  }

  return { serverClockOffsetMs, effectiveNow, sync }
}
