/**
 * Interactive site map: normalized SVG coordinates (viewBox 0 0 1 1).
 * Paths use 0–1 fractions of image width/height; tweak in Inkscape/Figma and paste `d` values.
 * Use WebP (or PNG) paths in `imageSrc` — same overlay approach for any raster format.
 */
export interface SiteMapBuilding {
  id: string
  label: string
  pathD: string
}

export interface SiteMapUnitHotspot {
  unitNumber: string
  pathD: string
}

export interface SiteMapFloor {
  id: string
  label: string
  imageSrc: string
  viewBox: string
  units: SiteMapUnitHotspot[]
}

/** Framed plan chrome: titles + cardinal-facing labels (shown around each floor raster). */
export const SITE_MAP_PLAN_FRAME = {
  buildingTitle: 'BLOCK G',
  facing: {
    top: 'Stellenbosch Mountain Skyline',
    bottom: 'Tygerberg Hills outlook',
    left: 'Durbanville Hills outlook',
    right: 'Table Mountain views',
  },
} as const

export const SITE_MAP_MASTER = {
  imageSrc: '/images/location-background.webp',
  viewBox: '0 0 1 1',
  buildings: [
    {
      id: 'block-g',
      label: 'BLOCK G',
      /** Polygon (% of W/H ÷100); main building — user coords 37.66,47.87 … 37.86,55.09 */
      pathD:
        'M 0.3766 0.4787 L 0.3906 0.4620 L 0.4099 0.4667 L 0.4307 0.4417 L 0.5724 0.4852 L 0.5714 0.5676 L 0.5193 0.6148 L 0.5057 0.6157 L 0.5057 0.6102 L 0.3786 0.5509 Z',
    },
  ] satisfies SiteMapBuilding[],
} as const

/** Floors: add `units` entries with `pathD` per apartment to enable clicks. */
export const SITE_MAP_FLOORS: SiteMapFloor[] = [
  {
    id: 'ground',
    label: 'Ground floor',
    imageSrc: '/images/ground-floor.webp',
    viewBox: '0 0 1 1',
    units: [
      {
        unitNumber: '812',
        /** Rectangle from authoring coords (% of W/H → 0–1) */
        pathD: 'M 0.0031 0.075 L 0.1845 0.075 L 0.1845 0.415 L 0.0031 0.415 Z',
      },
      {
        unitNumber: '811',
        /** Polygon 18.45,7.50 → 34.22,7.50 → 34.22,41.50 → 18.45,41.50 (% of W/H → 0–1) */
        pathD: 'M 0.1845 0.075 L 0.3422 0.075 L 0.3422 0.415 L 0.1845 0.415 Z',
      },
      {
        unitNumber: '810',
        /** Polygon 34.22,7.50 → 50.00,7.50 → 50.00,41.50 → 34.22,41.50 (% of W/H → 0–1) */
        pathD: 'M 0.3422 0.075 L 0.5 0.075 L 0.5 0.415 L 0.3422 0.415 Z',
      },
      {
        unitNumber: '809',
        /** Polygon 50.00,7.50 → 65.78,7.50 → 65.78,41.50 → 50.00,41.50 (% of W/H → 0–1) */
        pathD: 'M 0.5 0.075 L 0.6578 0.075 L 0.6578 0.415 L 0.5 0.415 Z',
      },
      {
        unitNumber: '808',
        /** Polygon 65.78,7.50 → 81.55,7.50 → 81.55,41.50 → 65.78,41.50 (% of W/H → 0–1) */
        pathD: 'M 0.6578 0.075 L 0.8155 0.075 L 0.8155 0.415 L 0.6578 0.415 Z',
      },
      {
        unitNumber: '807',
        /** Polygon 81.55,7.50 → 99.73,7.50 → 99.73,41.50 → 81.55,41.50 (% of W/H → 0–1) */
        pathD: 'M 0.8155 0.075 L 0.9973 0.075 L 0.9973 0.415 L 0.8155 0.415 Z',
      },
      {
        unitNumber: '801',
        /** Row 2: 0.31,57.00 → 18.45,57.00 → 18.45,91.00 → 0.31,91.00 (% of W/H → 0–1) */
        pathD: 'M 0.0031 0.57 L 0.1845 0.57 L 0.1845 0.91 L 0.0031 0.91 Z',
      },
      {
        unitNumber: '802',
        pathD: 'M 0.1845 0.57 L 0.3422 0.57 L 0.3422 0.91 L 0.1845 0.91 Z',
      },
      {
        unitNumber: '803',
        pathD: 'M 0.3422 0.57 L 0.5 0.57 L 0.5 0.91 L 0.3422 0.91 Z',
      },
      {
        unitNumber: '804',
        pathD: 'M 0.5 0.57 L 0.6578 0.57 L 0.6578 0.91 L 0.5 0.91 Z',
      },
      {
        unitNumber: '805',
        pathD: 'M 0.6578 0.57 L 0.8155 0.57 L 0.8155 0.91 L 0.6578 0.91 Z',
      },
      {
        unitNumber: '806',
        pathD: 'M 0.8155 0.57 L 0.9973 0.57 L 0.9973 0.91 L 0.8155 0.91 Z',
      },
    ],
  },
  { id: 'first', label: 'First floor', imageSrc: '/images/first-floor.webp', viewBox: '0 0 1 1', units: [] },
  { id: 'second', label: 'Second floor', imageSrc: '/images/second-floor.webp', viewBox: '0 0 1 1', units: [] },
  { id: 'third', label: 'Third floor', imageSrc: '/images/third-floor.webp', viewBox: '0 0 1 1', units: [] },
]
