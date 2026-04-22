import { describe, expect, it } from 'vitest'
import { approximatePathAnchor, approximatePathPinAbove } from '../../frontend/utils/siteMapGeometry'

describe('siteMapGeometry', () => {
  it('approximatePathAnchor returns bbox center for M/L path', () => {
    expect(approximatePathAnchor('M 0 0 L 2 4 Z')).toEqual({ x: 1, y: 2 })
  })

  it('approximatePathAnchor falls back when path has no coords', () => {
    expect(approximatePathAnchor('')).toEqual({ x: 0.5, y: 0.5 })
  })

  it('approximatePathPinAbove places pin above bbox', () => {
    expect(approximatePathPinAbove('M 0 0 L 4 4 Z', 0)).toEqual({ x: 2, y: 0 })
  })
})
