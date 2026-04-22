import type { Unit } from '~/types'
import { errorMessageFromUnknown } from '~/utils/errorFromUnknown'

type ReserveUnitFlowOptions = {
  fallbackErrorMessage: string
  warmAcquireLock?: boolean
}

export function resolveReserveAccessToken(
  sessionCacheToken: string | null | undefined,
  sessionRefToken: string | null | undefined,
  hydratedToken: string | null | undefined,
): string | null {
  return sessionCacheToken ?? sessionRefToken ?? hydratedToken ?? null
}

export function shouldWarmAcquireLock(
  warmAcquireLock: boolean | undefined,
  hasWarmedAcquireLock: boolean,
  token: string | null,
): boolean {
  return Boolean(warmAcquireLock && !hasWarmedAcquireLock && token)
}

export function persistReserveSession(
  storage: Pick<Storage, 'setItem'> | undefined,
  payload: { unitId: string; token: string; lockExpiresAt?: string },
) {
  if (!storage) return
  storage.setItem('ignite_reserve_unitId', payload.unitId)
  if (payload.lockExpiresAt) storage.setItem('ignite_reserve_lockExpiresAt', payload.lockExpiresAt)
  storage.setItem('ignite_reserve_token', payload.token)
}

export function useReserveUnitFlow(options: ReserveUnitFlowOptions) {
  const { sessionRef } = useAuth()
  const { $supabase } = useNuxtApp()
  const { show: showBottomUrgencyStrip } = useBottomUrgencyStrip()
  const reservingUnitId = ref<string | null>(null)
  const sessionCache = ref<{ access_token: string } | null>(null)
  let hasWarmedAcquireLock = false

  watch(
    sessionRef,
    (session) => {
      if (session?.access_token) {
        sessionCache.value = { access_token: session.access_token }
      }
    },
    { immediate: true },
  )

  async function hydrateSessionToken() {
    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.access_token) {
      sessionCache.value = { access_token: session.access_token }
    }
    return session?.access_token ?? null
  }

  async function maybeWarmAcquireLock(token: string | null) {
    if (!shouldWarmAcquireLock(options.warmAcquireLock, hasWarmedAcquireLock, token)) return
    hasWarmedAcquireLock = true
    await $fetch('/api/units/acquire-lock', {
      method: 'POST',
      body: { unitId: '00000000-0000-0000-0000-000000000000' },
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  async function reserveUnit(unit: Unit) {
    reservingUnitId.value = unit.id
    try {
      const hydrated = await (sessionCache.value?.access_token || sessionRef.value?.access_token
        ? Promise.resolve(null)
        : hydrateSessionToken())
      const token = resolveReserveAccessToken(
        sessionCache.value?.access_token,
        sessionRef.value?.access_token,
        hydrated,
      )
      if (!token) return

      await maybeWarmAcquireLock(token)

      const res = await $fetch<{ lockExpiresAt?: string }>('/api/units/acquire-lock', {
        method: 'POST',
        body: { unitId: unit.id },
        headers: { Authorization: `Bearer ${token}` },
      })
      persistReserveSession(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined, {
        unitId: unit.id,
        token,
        lockExpiresAt: res?.lockExpiresAt,
      })
      await navigateTo(`/reserve/${unit.unitNumber}`)
    } catch (e: unknown) {
      const msg = errorMessageFromUnknown(e, options.fallbackErrorMessage)
      console.error(msg)
      showBottomUrgencyStrip(msg)
    } finally {
      reservingUnitId.value = null
    }
  }

  return {
    reservingUnitId,
    reserveUnit,
  }
}
