import { describe, expect, it } from 'vitest'
import { formatClockMss } from '../../frontend/utils/formatDuration'
import { formatZarInteger } from '../../frontend/utils/formatZar'
import { formatFacingLabel, formatFloorLabel } from '../../frontend/utils/unitLabels'

describe('formatZarInteger', () => {
  it('uses space thousands and rounds', () => {
    expect(formatZarInteger(1_500_000)).toBe('1 500 000')
    expect(formatZarInteger(1_500_000.6)).toBe('1 500 001')
  })
})

describe('formatClockMss', () => {
  it('pads seconds', () => {
    expect(formatClockMss(65)).toBe('1:05')
    expect(formatClockMss(0)).toBe('0:00')
  })
})

describe('unitLabels', () => {
  it('formatFloorLabel adds Floor and title-cases', () => {
    expect(formatFloorLabel('3')).toBe('3 Floor')
    expect(formatFloorLabel('ground floor')).toBe('Ground Floor')
  })

  it('formatFacingLabel adds Facing', () => {
    expect(formatFacingLabel('north')).toBe('North Facing')
  })
})
