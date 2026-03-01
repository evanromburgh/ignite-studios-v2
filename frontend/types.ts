export interface AppUser {
  id: string
  email: string | null
  displayName: string | null
  role: 'admin' | 'user'
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export interface Unit {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  parking: number
  sizeSqm: number
  price: number
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
