"use client"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { MenuItem } from '@/lib/data'
import type {
  CafeEventDoc,
  GalleryItemDoc,
  OfferDoc,
  SiteSettingsDoc,
  TestimonialDoc,
} from '@/lib/cms-types'

function cx() {
  if (!db) {
    throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to your environment.')
  }
  return db
}

export function mergeMenuCatalog(
  defaults: MenuItem[],
  fromDb: Record<string, Partial<MenuItem> & { id: string }>,
  options?: { includeUnavailable?: boolean }
): MenuItem[] {
  const byId = new Map<string, MenuItem>()
  for (const d of defaults) {
    byId.set(d.id, { ...d, available: d.available !== false })
  }
  for (const raw of Object.values(fromDb)) {
    const id = raw.id
    const existing = byId.get(id)
    const merged: MenuItem = {
      ...(existing ?? {
        id,
        name: raw.name ?? 'New dish',
        description: raw.description ?? '',
        price: typeof raw.price === 'number' ? raw.price : 0,
        category: raw.category ?? 'breakfast',
        image: raw.image ?? '',
        featured: raw.featured,
        dietary: raw.dietary,
      }),
      ...raw,
      id,
    }
    byId.set(id, merged)
  }
  const list = [...byId.values()].filter((item) => item.name)
  if (options?.includeUnavailable) return list
  return list.filter((item) => item.available !== false)
}

export async function fetchSiteSettings(): Promise<SiteSettingsDoc | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'settings', 'site'))
  if (!snap.exists()) return null
  return snap.data() as SiteSettingsDoc
}

export function subscribeSiteSettings(
  callback: (data: SiteSettingsDoc | null) => void
): Unsubscribe {
  if (!db) {
    callback(null)
    return () => {}
  }
  return onSnapshot(doc(db, 'settings', 'site'), (snap) => {
    callback(snap.exists() ? (snap.data() as SiteSettingsDoc) : null)
  })
}

export async function saveSiteSettings(data: Partial<SiteSettingsDoc>): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  await setDoc(
    doc(db, 'settings', 'site'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export function subscribeMenuOverrides(
  callback: (map: Record<string, Partial<MenuItem> & { id: string }>) => void
): Unsubscribe {
  if (!db) {
    callback({})
    return () => {}
  }
  return onSnapshot(collection(db, 'menuItems'), (snap) => {
    const map: Record<string, Partial<MenuItem> & { id: string }> = {}
    snap.forEach((d) => {
      map[d.id] = { id: d.id, ...(d.data() as Partial<MenuItem>) }
    })
    callback(map)
  })
}

export async function upsertMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
  await setDoc(
    doc(cx(), 'menuItems', id),
    { ...data, id, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(cx(), 'menuItems', id))
}

export async function uploadMenuImage(file: File, itemId: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.')
  }
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const r = ref(storage, `menu/${itemId}/${Date.now()}_${safeName}`)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

export async function listGallery(): Promise<GalleryItemDoc[]> {
  let snap
  try {
    snap = await getDocs(query(collection(cx(), 'gallery'), orderBy('order', 'asc')))
  } catch {
    snap = await getDocs(collection(cx(), 'gallery'))
  }
  const items: GalleryItemDoc[] = []
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as GalleryItemDoc) }))
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function upsertGalleryItem(id: string, data: GalleryItemDoc): Promise<void> {
  await setDoc(doc(cx(), 'gallery', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await deleteDoc(doc(cx(), 'gallery', id))
}

export async function listTestimonials(): Promise<TestimonialDoc[]> {
  const snap = await getDocs(collection(cx(), 'testimonials'))
  const items: TestimonialDoc[] = []
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as TestimonialDoc) }))
  return items
}

export async function upsertTestimonial(id: string, data: TestimonialDoc): Promise<void> {
  await setDoc(doc(cx(), 'testimonials', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(cx(), 'testimonials', id))
}

export async function listEvents(): Promise<CafeEventDoc[]> {
  let snap
  try {
    snap = await getDocs(query(collection(cx(), 'events'), orderBy('startsAt', 'desc')))
  } catch {
    snap = await getDocs(collection(cx(), 'events'))
  }
  const items: CafeEventDoc[] = []
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as CafeEventDoc) }))
  return items.sort((a, b) => (b.startsAt ?? '').localeCompare(a.startsAt ?? ''))
}

export async function upsertEvent(id: string, data: CafeEventDoc): Promise<void> {
  await setDoc(doc(cx(), 'events', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(cx(), 'events', id))
}

export async function listPublishedEvents(): Promise<CafeEventDoc[]> {
  try {
    const snap = await getDocs(
      query(collection(cx(), 'events'), where('published', '==', true), orderBy('startsAt', 'desc'))
    )
    const items: CafeEventDoc[] = []
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as CafeEventDoc) }))
    return items
  } catch {
    const snap = await getDocs(query(collection(cx(), 'events'), where('published', '==', true)))
    const items: CafeEventDoc[] = []
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as CafeEventDoc) }))
    return items.sort((a, b) => (b.startsAt ?? '').localeCompare(a.startsAt ?? ''))
  }
}

export async function listPublishedOffers(): Promise<OfferDoc[]> {
  const snap = await getDocs(query(collection(cx(), 'offers'), where('published', '==', true)))
  const items: OfferDoc[] = []
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as OfferDoc) }))
  return items
}

export async function listOffers(): Promise<OfferDoc[]> {
  const snap = await getDocs(collection(cx(), 'offers'))
  const items: OfferDoc[] = []
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as OfferDoc) }))
  return items
}

export async function upsertOffer(id: string, data: OfferDoc): Promise<void> {
  await setDoc(doc(cx(), 'offers', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteOffer(id: string): Promise<void> {
  await deleteDoc(doc(cx(), 'offers', id))
}

export async function rsvpEvent(userId: string, eventId: string, guests: number): Promise<void> {
  await setDoc(
    doc(cx(), 'events', eventId, 'rsvps', userId),
    { userId, guests, createdAt: serverTimestamp() },
    { merge: true }
  )
}

export async function listUsersForAdmin(): Promise<
  { uid: string; email?: string; displayName?: string; role?: string; loyaltyPoints?: number }[]
> {
  const snap = await getDocs(collection(cx(), 'users'))
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      uid: d.id,
      email: data.email as string | undefined,
      displayName: data.displayName as string | undefined,
      role: data.role as string | undefined,
      loyaltyPoints: data.loyaltyPoints as number | undefined,
    }
  })
}

export async function setUserRole(uid: string, role: 'customer' | 'manager' | 'admin'): Promise<void> {
  await setDoc(doc(cx(), 'users', uid), { role, updatedAt: serverTimestamp() }, { merge: true })
}

/** Seed gallery from static defaults when collection empty */
export async function seedGalleryFromStatic(
  items: { id: string; src: string; alt: string; locationId?: string }[]
): Promise<void> {
  const existing = await getDocs(collection(cx(), 'gallery'))
  if (!existing.empty) return
  const batch = writeBatch(cx())
  items.forEach((item, index) => {
    const ref = doc(cx(), 'gallery', item.id)
    batch.set(ref, {
      ...item,
      order: index,
      createdAt: serverTimestamp(),
    })
  })
  await batch.commit()
}
