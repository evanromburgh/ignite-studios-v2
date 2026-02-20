export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'user';
}

export interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  sizeSqm: number;
  price: number;
  status: 'Available' | 'Reserved' | 'Sold';
  unitType: string;
  imageUrl: string;
  viewers?: Record<string, number>;
  lockExpiresAt?: number;
  lockedBy?: string;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}

export type ViewContext = 'INVENTORY' | 'WISHLIST' | 'RESERVATIONS' | 'DOCUMENTS' | 'UNIT_DETAIL' | 'CONTACT' | 'RESERVE';

export interface SearchFilters {
  maxPrice: number | 'all';
  bedrooms: string;
  bathrooms: string;
  status: string;
}

export interface DocumentAsset {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  url: string;
}