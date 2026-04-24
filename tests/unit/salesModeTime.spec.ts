import { describe, expect, it } from 'vitest'
import { remainingCountdownParts, sastLocalToUtcIso, utcIsoToSastDateTimeParts } from '~/utils/sastTime'

describe('remainingCountdownParts', () => {
  it('splits a future target into d/h/m/s', () => {
    const t0 = Date.parse('2026-04-20T12:00:00.000Z')
    const target = '2026-04-22T12:00:00.000Z'
    const p = remainingCountdownParts(target, t0)
    expect(p).toEqual({ days: 2, hours: 0, minutes: 0, seconds: 0 })
  })

  it('clamps to zeros at or after T0', () => {
    const t0 = Date.parse('2026-04-20T12:00:00.000Z')
    expect(remainingCountdownParts('2026-04-20T11:59:59.000Z', t0)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
    expect(remainingCountdownParts('2026-04-20T12:00:00.000Z', t0)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })

  it('returns zeros when target is null or invalid', () => {
    const t0 = Date.now()
    expect(remainingCountdownParts(null, t0).seconds).toBe(0)
    expect(remainingCountdownParts('', t0).days).toBe(0)
  })
})

describe('SAST local ↔ UTC (fixed +2, no DST)', () => {
  it('converts a SAST wall time to timestamptz and back', () => {
    const iso = sastLocalToUtcIso('2026-06-01', '09:30')
    const parts = utcIsoToSastDateTimeParts(iso)
    expect(parts.date).toBe('2026-06-01')
    expect(parts.time).toBe('09:30')
  })
})
