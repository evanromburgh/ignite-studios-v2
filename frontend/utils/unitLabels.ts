/** e.g. `3` -> `3 Floor`; keeps existing "floor" wording, title-cases words. */
export function formatFloorLabel(floor: string | null | undefined): string {
  const raw = (floor ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const withFloor = lower.includes('floor') ? lower : `${lower} floor`
  return withFloor.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** e.g. `north` -> `North Facing`. */
export function formatFacingLabel(direction: string | null | undefined): string {
  const raw = (direction ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const withFacing = lower.includes('facing') ? lower : `${lower} facing`
  return withFacing.replace(/\b\w/g, (c) => c.toUpperCase())
}
