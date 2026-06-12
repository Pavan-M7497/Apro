import type { MenuItem } from '@/lib/data'

export type UserRole = 'customer' | 'manager' | 'admin'

export interface SiteSettingsDoc {
  heroImageUrl?: string
  heroTitle?: string
  heroSubtitle?: string
  brandStoryLead?: string
  instagramUrl?: string
  /** Shown in header toast / dashboard banner */
  announcement?: string
  trendingMenuIds?: string[]
  updatedAt?: unknown
}

/** Firestore `menuItems/{id}` — partial overrides or full custom rows */
export type MenuItemFirestore = Partial<MenuItem> & {
  id: string
  updatedAt?: unknown
  createdAt?: unknown
}

export interface GalleryItemDoc {
  id?: string
  src: string
  alt: string
  locationId?: string
  order?: number
  createdAt?: unknown
}

export interface TestimonialDoc {
  id?: string
  author: string
  rating: number
  text: string
  date: string
  locationId?: string
  source?: 'Google' | 'Zomato'
  published?: boolean
}

export type CafeEventType = 'live-music' | 'comedy' | 'brunch' | 'seasonal' | 'other'

export interface CafeEventDoc {
  id?: string
  title: string
  description: string
  type: CafeEventType
  /** ISO date string for display / sorting */
  startsAt: string
  endsAt?: string
  locationId?: string
  imageUrl?: string
  published?: boolean
  createdAt?: unknown
}

export interface OfferDoc {
  id?: string
  title: string
  description: string
  validUntil?: string
  code?: string
  published?: boolean
  createdAt?: unknown
}
