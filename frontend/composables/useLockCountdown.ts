import type { MaybeRefOrGetter } from 'vue'

/**
 * Tracks remaining lock time in seconds using server-adjusted time.
 */
export function useLockCountdown(
  lockExpiresAt: MaybeRefOrGetter<number | undefined>,
  serverClockOffsetMs: MaybeRefOrGetter<number>,
) {
  const timeLeft = ref(0)
  let timerId: ReturnType<typeof setInterval> | null = null

  const stop = () => {
    if (timerId) clearInterval(timerId)
    timerId = null
  }

  const restart = () => {
    stop()
    const expiresAt = toValue(lockExpiresAt)
    if (!expiresAt) {
      timeLeft.value = 0
      return
    }
    const update = () => {
      const effectiveNow = Date.now() + toValue(serverClockOffsetMs)
      timeLeft.value = Math.max(0, Math.floor((expiresAt - effectiveNow) / 1000))
    }
    update()
    timerId = setInterval(update, 1000)
  }

  watch([() => toValue(lockExpiresAt), () => toValue(serverClockOffsetMs)], restart, { immediate: true })
  onBeforeUnmount(stop)

  return { timeLeft }
}
