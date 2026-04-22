import { describe, expect, it } from 'vitest'
import {
  formatMissingHotspotsByFloor,
  summarizeMissingHotspots,
  type SiteMapDiagnosticFloor,
} from '../../frontend/utils/siteMapDiagnostics'

const floors: SiteMapDiagnosticFloor[] = [
  {
    id: 'ground',
    units: [{ unitNumber: '801' }, { unitNumber: '802' }, { unitNumber: '803' }],
  },
  {
    id: 'first',
    units: [{ unitNumber: '811' }, { unitNumber: '812' }],
  },
]

describe('summarizeMissingHotspots', () => {
  it('returns totals, floor counts, and stable signature', () => {
    const loaded = new Set(['801', '812'])
    const summary = summarizeMissingHotspots(floors, loaded)

    expect(summary.totalMissing).toBe(3)
    expect(summary.byFloor).toEqual({ ground: 2, first: 1 })
    expect(summary.signature).toBe('802 (ground)|803 (ground)|811 (first)')
  })

  it('returns empty summary when all hotspots are present', () => {
    const loaded = new Set(['801', '802', '803', '811', '812'])
    const summary = summarizeMissingHotspots(floors, loaded)

    expect(summary.totalMissing).toBe(0)
    expect(summary.byFloor).toEqual({})
    expect(summary.signature).toBe('')
  })
})

describe('formatMissingHotspotsByFloor', () => {
  it('formats only floors with missing counts in floor order', () => {
    const label = formatMissingHotspotsByFloor(floors, { ground: 2, first: 1, third: 9 })
    expect(label).toBe('ground:2, first:1')
  })
})
