/**
 * Global app loader (app.vue) waits on this until the reserve page flow is ready.
 * Default true so non-reserve routes never block.
 */
export function useReservePageShellReady() {
  const shellReady = useState('reservePage.shellReady', () => true)

  function markNotReady() {
    shellReady.value = false
  }

  function markReady() {
    shellReady.value = true
  }

  return { shellReady, markNotReady, markReady }
}
