const BLOCKED_EXACT = ['/reservations', '/payment-success', '/payment-cancel'] as const

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  const isReserve =
    path === '/reserve' || path.startsWith('/reserve/')

  const isBlockedExact = (BLOCKED_EXACT as readonly string[]).includes(path)
  if (!isBlockedExact && !isReserve) return

  if (to.query.prelaunch) return

  const { salesMode } = await $fetch<{ salesMode: string }>('/api/app-settings').catch(() => ({
    salesMode: 'launched',
  }))

  if (salesMode !== 'prelaunch') return

  if (import.meta.client) {
    try {
      sessionStorage.setItem('ignite_prelaunch_reservation_block', '1')
    } catch {
      // ignore
    }
  }
  return navigateTo({ path: '/', query: { prelaunch: '1' } })
})
