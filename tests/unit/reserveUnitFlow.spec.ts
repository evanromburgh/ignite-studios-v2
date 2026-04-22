import { describe, expect, it, vi } from 'vitest'
import {
  persistReserveSession,
  resolveReserveAccessToken,
  shouldWarmAcquireLock,
} from '../../frontend/composables/useReserveUnitFlow'

describe('resolveReserveAccessToken', () => {
  it('prefers session cache token first', () => {
    expect(resolveReserveAccessToken('cache', 'session', 'hydrated')).toBe('cache')
  })

  it('falls back to sessionRef token', () => {
    expect(resolveReserveAccessToken(null, 'session', 'hydrated')).toBe('session')
  })

  it('falls back to hydrated token last', () => {
    expect(resolveReserveAccessToken(null, null, 'hydrated')).toBe('hydrated')
  })

  it('returns null when no token source is available', () => {
    expect(resolveReserveAccessToken(undefined, null, undefined)).toBeNull()
  })
})

describe('shouldWarmAcquireLock', () => {
  it('returns true only when warm mode is on, token exists, and not warmed yet', () => {
    expect(shouldWarmAcquireLock(true, false, 'tok')).toBe(true)
  })

  it('returns false when already warmed, warm disabled, or token missing', () => {
    expect(shouldWarmAcquireLock(true, true, 'tok')).toBe(false)
    expect(shouldWarmAcquireLock(false, false, 'tok')).toBe(false)
    expect(shouldWarmAcquireLock(true, false, null)).toBe(false)
  })
})

describe('persistReserveSession', () => {
  it('writes unit, token, and optional lock expiry', () => {
    const setItem = vi.fn()
    persistReserveSession({ setItem }, {
      unitId: 'unit-1',
      token: 'abc',
      lockExpiresAt: '2026-01-01T00:00:00.000Z',
    })

    expect(setItem).toHaveBeenCalledWith('ignite_reserve_unitId', 'unit-1')
    expect(setItem).toHaveBeenCalledWith('ignite_reserve_lockExpiresAt', '2026-01-01T00:00:00.000Z')
    expect(setItem).toHaveBeenCalledWith('ignite_reserve_token', 'abc')
  })

  it('skips lock expiry when absent and no-ops without storage', () => {
    const setItem = vi.fn()
    persistReserveSession({ setItem }, { unitId: 'unit-2', token: 'xyz' })
    expect(setItem).toHaveBeenCalledTimes(2)
    expect(setItem).toHaveBeenCalledWith('ignite_reserve_unitId', 'unit-2')
    expect(setItem).toHaveBeenCalledWith('ignite_reserve_token', 'xyz')

    expect(() =>
      persistReserveSession(undefined, { unitId: 'unit-2', token: 'xyz' }),
    ).not.toThrow()
  })
})
