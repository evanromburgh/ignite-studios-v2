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
  mobileImageSrc?: string
  rotateHotspotsClockwiseOnMobile?: boolean
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

/** Supabase public URLs for the interactive site map raster plans. */
const SUPABASE_ASSETS_SITEMAP_BASE_URL =
  'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/units/sitemap'

export const SITE_MAP_MASTER = {
  imageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/location-background.webp`,
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
    imageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/ground-floor-plan.webp`,
    mobileImageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/ground-floor-plan-mobile.webp`,
    rotateHotspotsClockwiseOnMobile: true,
    viewBox: '0 0 1 1',
    units: [
      {
        unitNumber: '812',
        pathD: 'M 0.0007 0.078 L 0.0933 0.078 L 0.0933 0.0719 L 0.168 0.0719 L 0.168 0.078 L 0.1852 0.078 L 0.1852 0.4205 L 0.0007 0.4205 Z',
      },
      {
        unitNumber: '811',
        pathD: 'M 0.1852 0.078 L 0.2016 0.078 L 0.2016 0.0719 L 0.2689 0.0719 L 0.2689 0.078 L 0.3422 0.078 L 0.3422 0.4205 L 0.1852 0.4205 Z',
      },
      {
        unitNumber: '810',
        pathD: 'M 0.3422 0.078 L 0.4163 0.078 L 0.4163 0.0719 L 0.4835 0.0719 L 0.4835 0.078 L 0.5007 0.078 L 0.5007 0.4205 L 0.3422 0.4205 Z',
      },
      {
        unitNumber: '809',
        pathD: 'M 0.5007 0.078 L 0.5171 0.078 L 0.5171 0.0719 L 0.585 0.0719 L 0.585 0.078 L 0.6584 0.078 L 0.6584 0.4205 L 0.5007 0.4205 Z',
      },
      {
        unitNumber: '808',
        pathD: 'M 0.6584 0.078 L 0.7325 0.078 L 0.7325 0.0719 L 0.7997 0.0719 L 0.7997 0.078 L 0.8162 0.078 L 0.8162 0.4205 L 0.6584 0.4205 Z',
      },
      {
        unitNumber: '807',
        pathD: 'M 0.8162 0.078 L 0.8333 0.078 L 0.8333 0.0719 L 0.9081 0.0719 L 0.9081 0.078 L 0.9993 0.078 L 0.9993 0.4205 L 0.8162 0.4205 Z',
      },
      {
        unitNumber: '801',
        pathD: 'M 0.0007 0.922 L 0.0933 0.922 L 0.0933 0.9281 L 0.168 0.9281 L 0.168 0.922 L 0.1852 0.922 L 0.1852 0.5795 L 0.0007 0.5795 Z',
      },
      {
        unitNumber: '802',
        pathD: 'M 0.1852 0.922 L 0.2016 0.922 L 0.2016 0.9281 L 0.2689 0.9281 L 0.2689 0.922 L 0.3422 0.922 L 0.3422 0.5795 L 0.1852 0.5795 Z',
      },
      {
        unitNumber: '803',
        pathD: 'M 0.3422 0.922 L 0.4163 0.922 L 0.4163 0.9281 L 0.4835 0.9281 L 0.4835 0.922 L 0.5007 0.922 L 0.5007 0.5795 L 0.3422 0.5795 Z',
      },
      {
        unitNumber: '804',
        pathD: 'M 0.5007 0.922 L 0.5171 0.922 L 0.5171 0.9281 L 0.585 0.9281 L 0.585 0.922 L 0.6584 0.922 L 0.6584 0.5795 L 0.5007 0.5795 Z',
      },
      {
        unitNumber: '805',
        pathD: 'M 0.6584 0.922 L 0.7325 0.922 L 0.7325 0.9281 L 0.7997 0.9281 L 0.7997 0.922 L 0.8162 0.922 L 0.8162 0.5795 L 0.6584 0.5795 Z',
      },
      {
        unitNumber: '806',
        pathD: 'M 0.8162 0.922 L 0.8333 0.922 L 0.8333 0.9281 L 0.9081 0.9281 L 0.9081 0.922 L 0.9993 0.922 L 0.9993 0.5795 L 0.8162 0.5795 Z',
      },
    ],
  },
  {
    id: 'first',
    label: 'First floor',
    imageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/first-floor-plan.webp`,
    mobileImageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/first-floor-plan-mobile.webp`,
    rotateHotspotsClockwiseOnMobile: true,
    viewBox: '0 0 1 1',
    units: [
      {
        unitNumber: '824',
        pathD: 'M 0.0007 0.078 L 0.0933 0.078 L 0.0933 0.0719 L 0.168 0.0719 L 0.168 0.078 L 0.1852 0.078 L 0.1852 0.4205 L 0.0007 0.4205 Z',
      },
      {
        unitNumber: '823',
        pathD: 'M 0.1852 0.078 L 0.2016 0.078 L 0.2016 0.0719 L 0.2689 0.0719 L 0.2689 0.078 L 0.3422 0.078 L 0.3422 0.4205 L 0.1852 0.4205 Z',
      },
      {
        unitNumber: '822',
        pathD: 'M 0.3422 0.078 L 0.4163 0.078 L 0.4163 0.0719 L 0.4835 0.0719 L 0.4835 0.078 L 0.5007 0.078 L 0.5007 0.4205 L 0.3422 0.4205 Z',
      },
      {
        unitNumber: '821',
        pathD: 'M 0.5007 0.078 L 0.5171 0.078 L 0.5171 0.0719 L 0.585 0.0719 L 0.585 0.078 L 0.6584 0.078 L 0.6584 0.4205 L 0.5007 0.4205 Z',
      },
      {
        unitNumber: '820',
        pathD: 'M 0.6584 0.078 L 0.7325 0.078 L 0.7325 0.0719 L 0.7997 0.0719 L 0.7997 0.078 L 0.8162 0.078 L 0.8162 0.4205 L 0.6584 0.4205 Z',
      },
      {
        unitNumber: '819',
        pathD: 'M 0.8162 0.078 L 0.8333 0.078 L 0.8333 0.0719 L 0.9081 0.0719 L 0.9081 0.078 L 0.9993 0.078 L 0.9993 0.4205 L 0.8162 0.4205 Z',
      },
      {
        unitNumber: '818',
        pathD: 'M 0.8162 0.922 L 0.8333 0.922 L 0.8333 0.9281 L 0.9081 0.9281 L 0.9081 0.922 L 0.9993 0.922 L 0.9993 0.5795 L 0.8162 0.5795 Z',
      },
      {
        unitNumber: '817',
        pathD: 'M 0.6584 0.922 L 0.7325 0.922 L 0.7325 0.9281 L 0.7997 0.9281 L 0.7997 0.922 L 0.8162 0.922 L 0.8162 0.5795 L 0.6584 0.5795 Z',
      },
      {
        unitNumber: '816',
        pathD: 'M 0.5007 0.922 L 0.5171 0.922 L 0.5171 0.9281 L 0.585 0.9281 L 0.585 0.922 L 0.6584 0.922 L 0.6584 0.5795 L 0.5007 0.5795 Z',
      },
      {
        unitNumber: '815',
        pathD: 'M 0.3422 0.922 L 0.4163 0.922 L 0.4163 0.9281 L 0.4835 0.9281 L 0.4835 0.922 L 0.5007 0.922 L 0.5007 0.5795 L 0.3422 0.5795 Z',
      },
      {
        unitNumber: '814',
        pathD: 'M 0.1852 0.922 L 0.2016 0.922 L 0.2016 0.9281 L 0.2689 0.9281 L 0.2689 0.922 L 0.3422 0.922 L 0.3422 0.5795 L 0.1852 0.5795 Z',
      },
      {
        unitNumber: '813',
        pathD: 'M 0.0007 0.922 L 0.0933 0.922 L 0.0933 0.9281 L 0.168 0.9281 L 0.168 0.922 L 0.1852 0.922 L 0.1852 0.5795 L 0.0007 0.5795 Z',
      },
    ],
  },
  {
    id: 'second',
    label: 'Second floor',
    imageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/second-floor-plan.webp`,
    mobileImageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/second-floor-plan-mobile.webp`,
    rotateHotspotsClockwiseOnMobile: true,
    viewBox: '0 0 1 1',
    units: [
      {
        unitNumber: '836',
        pathD: 'M 0.0007 0.078 L 0.0933 0.078 L 0.0933 0.0719 L 0.168 0.0719 L 0.168 0.078 L 0.1852 0.078 L 0.1852 0.4205 L 0.0007 0.4205 Z',
      },
      {
        unitNumber: '835',
        pathD: 'M 0.1852 0.078 L 0.2016 0.078 L 0.2016 0.0719 L 0.2689 0.0719 L 0.2689 0.078 L 0.3422 0.078 L 0.3422 0.4205 L 0.1852 0.4205 Z',
      },
      {
        unitNumber: '834',
        pathD: 'M 0.3422 0.078 L 0.4163 0.078 L 0.4163 0.0719 L 0.4835 0.0719 L 0.4835 0.078 L 0.5007 0.078 L 0.5007 0.4205 L 0.3422 0.4205 Z',
      },
      {
        unitNumber: '833',
        pathD: 'M 0.5007 0.078 L 0.5171 0.078 L 0.5171 0.0719 L 0.585 0.0719 L 0.585 0.078 L 0.6584 0.078 L 0.6584 0.4205 L 0.5007 0.4205 Z',
      },
      {
        unitNumber: '832',
        pathD: 'M 0.6584 0.078 L 0.7325 0.078 L 0.7325 0.0719 L 0.7997 0.0719 L 0.7997 0.078 L 0.8162 0.078 L 0.8162 0.4205 L 0.6584 0.4205 Z',
      },
      {
        unitNumber: '831',
        pathD: 'M 0.8162 0.078 L 0.8333 0.078 L 0.8333 0.0719 L 0.9081 0.0719 L 0.9081 0.078 L 0.9993 0.078 L 0.9993 0.4205 L 0.8162 0.4205 Z',
      },
      {
        unitNumber: '830',
        pathD: 'M 0.8162 0.922 L 0.8333 0.922 L 0.8333 0.9281 L 0.9081 0.9281 L 0.9081 0.922 L 0.9993 0.922 L 0.9993 0.5795 L 0.8162 0.5795 Z',
      },
      {
        unitNumber: '829',
        pathD: 'M 0.6584 0.922 L 0.7325 0.922 L 0.7325 0.9281 L 0.7997 0.9281 L 0.7997 0.922 L 0.8162 0.922 L 0.8162 0.5795 L 0.6584 0.5795 Z',
      },
      {
        unitNumber: '828',
        pathD: 'M 0.5007 0.922 L 0.5171 0.922 L 0.5171 0.9281 L 0.585 0.9281 L 0.585 0.922 L 0.6584 0.922 L 0.6584 0.5795 L 0.5007 0.5795 Z',
      },
      {
        unitNumber: '827',
        pathD: 'M 0.3422 0.922 L 0.4163 0.922 L 0.4163 0.9281 L 0.4835 0.9281 L 0.4835 0.922 L 0.5007 0.922 L 0.5007 0.5795 L 0.3422 0.5795 Z',
      },
      {
        unitNumber: '826',
        pathD: 'M 0.1852 0.922 L 0.2016 0.922 L 0.2016 0.9281 L 0.2689 0.9281 L 0.2689 0.922 L 0.3422 0.922 L 0.3422 0.5795 L 0.1852 0.5795 Z',
      },
      {
        unitNumber: '825',
        pathD: 'M 0.0007 0.922 L 0.0933 0.922 L 0.0933 0.9281 L 0.168 0.9281 L 0.168 0.922 L 0.1852 0.922 L 0.1852 0.5795 L 0.0007 0.5795 Z',
      },
    ],
  },
  {
    id: 'third',
    label: 'Third floor',
    imageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/third-floor-plan.webp`,
    mobileImageSrc: `${SUPABASE_ASSETS_SITEMAP_BASE_URL}/third-floor-plan-mobile.webp`,
    rotateHotspotsClockwiseOnMobile: true,
    viewBox: '0 0 1 1',
    units: [
      {
        unitNumber: '848',
        pathD: 'M 0.0007 0.078 L 0.0933 0.078 L 0.0933 0.0719 L 0.168 0.0719 L 0.168 0.078 L 0.1852 0.078 L 0.1852 0.4205 L 0.0007 0.4205 Z',
      },
      {
        unitNumber: '847',
        pathD: 'M 0.1852 0.078 L 0.2016 0.078 L 0.2016 0.0719 L 0.2689 0.0719 L 0.2689 0.078 L 0.3422 0.078 L 0.3422 0.4205 L 0.1852 0.4205 Z',
      },
      {
        unitNumber: '846',
        pathD: 'M 0.3422 0.078 L 0.4163 0.078 L 0.4163 0.0719 L 0.4835 0.0719 L 0.4835 0.078 L 0.5007 0.078 L 0.5007 0.4205 L 0.3422 0.4205 Z',
      },
      {
        unitNumber: '845',
        pathD: 'M 0.5007 0.078 L 0.5171 0.078 L 0.5171 0.0719 L 0.585 0.0719 L 0.585 0.078 L 0.6584 0.078 L 0.6584 0.4205 L 0.5007 0.4205 Z',
      },
      {
        unitNumber: '844',
        pathD: 'M 0.6584 0.078 L 0.7325 0.078 L 0.7325 0.0719 L 0.7997 0.0719 L 0.7997 0.078 L 0.8162 0.078 L 0.8162 0.4205 L 0.6584 0.4205 Z',
      },
      {
        unitNumber: '843',
        pathD: 'M 0.8162 0.078 L 0.8333 0.078 L 0.8333 0.0719 L 0.9081 0.0719 L 0.9081 0.078 L 0.9993 0.078 L 0.9993 0.4205 L 0.8162 0.4205 Z',
      },
      {
        unitNumber: '842',
        pathD: 'M 0.8162 0.922 L 0.8333 0.922 L 0.8333 0.9281 L 0.9081 0.9281 L 0.9081 0.922 L 0.9993 0.922 L 0.9993 0.5795 L 0.8162 0.5795 Z',
      },
      {
        unitNumber: '841',
        pathD: 'M 0.6584 0.922 L 0.7325 0.922 L 0.7325 0.9281 L 0.7997 0.9281 L 0.7997 0.922 L 0.8162 0.922 L 0.8162 0.5795 L 0.6584 0.5795 Z',
      },
      {
        unitNumber: '840',
        pathD: 'M 0.5007 0.922 L 0.5171 0.922 L 0.5171 0.9281 L 0.585 0.9281 L 0.585 0.922 L 0.6584 0.922 L 0.6584 0.5795 L 0.5007 0.5795 Z',
      },
      {
        unitNumber: '839',
        pathD: 'M 0.3422 0.922 L 0.4163 0.922 L 0.4163 0.9281 L 0.4835 0.9281 L 0.4835 0.922 L 0.5007 0.922 L 0.5007 0.5795 L 0.3422 0.5795 Z',
      },
      {
        unitNumber: '838',
        pathD: 'M 0.1852 0.922 L 0.2016 0.922 L 0.2016 0.9281 L 0.2689 0.9281 L 0.2689 0.922 L 0.3422 0.922 L 0.3422 0.5795 L 0.1852 0.5795 Z',
      },
      {
        unitNumber: '837',
        pathD: 'M 0.0007 0.922 L 0.0933 0.922 L 0.0933 0.9281 L 0.168 0.9281 L 0.168 0.922 L 0.1852 0.922 L 0.1852 0.5795 L 0.0007 0.5795 Z',
      },
    ],
  },
]
