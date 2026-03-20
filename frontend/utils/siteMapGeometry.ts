/** Bounding-box center for SVG path `d` strings made of M/L/H/V/Z segments with decimal coords (e.g. floor-plan hotspots). */
export function approximatePathAnchor(pathD: string): { x: number; y: number } {
  const re = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi
  const raw = pathD.match(re)?.map(Number).filter((n) => !Number.isNaN(n)) ?? []
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i + 1 < raw.length; i += 2) {
    xs.push(raw[i]!)
    ys.push(raw[i + 1]!)
  }
  if (xs.length === 0) return { x: 0.5, y: 0.5 }
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/** Horizontal center of path bbox, y just above the top edge — for map pins / labels above a polygon. */
export function approximatePathPinAbove(pathD: string, offsetNorm = 0.028): { x: number; y: number } {
  const re = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi
  const raw = pathD.match(re)?.map(Number).filter((n) => !Number.isNaN(n)) ?? []
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i + 1 < raw.length; i += 2) {
    xs.push(raw[i]!)
    ys.push(raw[i + 1]!)
  }
  if (xs.length === 0) return { x: 0.5, y: 0.38 }
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const x = (minX + maxX) / 2
  const y = Math.max(0, minY - offsetNorm)
  return { x, y }
}
