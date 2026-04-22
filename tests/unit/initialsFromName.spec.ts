import { describe, expect, it } from 'vitest'
import { initialsFromName } from '../../frontend/utils/initialsFromName'

describe('initialsFromName', () => {
  it('abbreviates multi-word names', () => {
    expect(initialsFromName('Evan van Romburgh')).toBe('EVR')
  })

  it('caps length when maxChars is set', () => {
    expect(initialsFromName('Evan van Romburgh', 3)).toBe('EVR')
  })

  it('ignores extra whitespace', () => {
    expect(initialsFromName('  A   B  ', 2)).toBe('AB')
  })
})
