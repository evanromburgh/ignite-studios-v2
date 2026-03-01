/**
 * Returns current server time in milliseconds (for client clock sync so reservation timer shows 10:00 on all devices).
 * Client computes offset = serverTimeMs - Date.now() and uses effectiveNow = () => Date.now() + offset for the countdown.
 */
export default defineEventHandler(() => {
  return { serverTimeMs: Date.now() }
})
