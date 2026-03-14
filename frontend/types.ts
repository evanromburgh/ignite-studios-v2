export interface AppUser {
  id: string
  email: string | null
  displayName: string | null
  role: 'admin' | 'user'
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  idPassportNumber?: string | null
  reasonForBuying?: string | null
}

export interface Unit {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  parking: number
  sizeSqm: number
  price: number
  /** If set, shown as strikethrough "was" price above current price on cards */
  originalPrice?: number | null
  status: 'Available' | 'Reserved' | 'Sold'
  unitType: string
  floor?: string | null
  direction?: string | null
  imageUrl: string
  imageUrl2?: string | null
  imageUrl3?: string | null
  floorplanUrl?: string | null
  viewers?: Record<string, number>
  lockExpiresAt?: number
  lockedBy?: string
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  ELEVATION = 'ELEVATION',
  FLOOR = 'FLOOR',
}

export interface SearchFilters {
  maxPrice: number | 'all'
  minPrice: number | 'all'
  bedrooms: string
  bathrooms: string
  status: string
  searchQuery?: string
  orderBy?: 'unitNumber' | 'price' | 'bedrooms'
  orderDir?: 'asc' | 'desc'
  layout?: string
  floor?: string
  direction?: string
  parking?: string
  wishlistFilter?: 'all' | 'yes'
}
