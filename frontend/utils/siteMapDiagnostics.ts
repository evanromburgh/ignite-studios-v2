export type SiteMapDiagnosticFloor = {
  id: string
  units: Array<{ unitNumber: string }>
}

export type MissingHotspotSummary = {
  totalMissing: number
  byFloor: Record<string, number>
  signature: string
}

export function summarizeMissingHotspots(
  floors: SiteMapDiagnosticFloor[],
  loadedUnitNumbers: Set<string>,
): MissingHotspotSummary {
  const byFloor: Record<string, number> = {}
  const missingPairs: string[] = []

  for (const floor of floors) {
    for (const unit of floor.units) {
      if (!loadedUnitNumbers.has(unit.unitNumber)) {
        byFloor[floor.id] = (byFloor[floor.id] ?? 0) + 1
        missingPairs.push(`${unit.unitNumber} (${floor.id})`)
      }
    }
  }

  return {
    totalMissing: missingPairs.length,
    byFloor,
    signature: missingPairs.join('|'),
  }
}

export function formatMissingHotspotsByFloor(
  floors: SiteMapDiagnosticFloor[],
  byFloor: Record<string, number>,
): string {
  return floors
    .map((floor) => ({ id: floor.id, count: byFloor[floor.id] ?? 0 }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.id}:${entry.count}`)
    .join(', ')
}
