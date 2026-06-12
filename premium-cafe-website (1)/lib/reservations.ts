"use client"

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

function requireDb() {
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

export interface Reservation {
  id?: string
  /** Authenticated user id, or null for walk-in web guests */
  userId: string | null
  userEmail: string
  userName: string
  userPhone: string
  locationId: string
  locationName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  guests: number
  occasion?: string
  specialRequests?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  isGuest?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type CreateReservationInput = Omit<
  Reservation,
  'id' | 'createdAt' | 'updatedAt' | 'status'
>

export async function createReservation(reservation: CreateReservationInput): Promise<string> {
  try {
    const fs = requireDb()
    const docRef = await addDoc(collection(fs, 'reservations'), {
      ...reservation,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating reservation:', error)
    throw error
  }
}

export async function updateReservationStatus(
  reservationId: string,
  status: Reservation['status']
): Promise<void> {
  try {
    const fs = requireDb()
    const reservationRef = doc(fs, 'reservations', reservationId)
    await updateDoc(reservationRef, {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
    throw error
  }
}

export async function getUserReservations(userId: string): Promise<Reservation[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : doc.data().createdAt,
      updatedAt: doc.data().updatedAt instanceof Timestamp 
        ? doc.data().updatedAt.toDate() 
        : doc.data().updatedAt,
    })) as Reservation[]
  } catch (error) {
    console.error('Error fetching user reservations:', error)
    throw error
  }
}

export async function getAllReservations(): Promise<Reservation[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'reservations'),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : doc.data().createdAt,
      updatedAt: doc.data().updatedAt instanceof Timestamp 
        ? doc.data().updatedAt.toDate() 
        : doc.data().updatedAt,
    })) as Reservation[]
  } catch (error) {
    console.error('Error fetching all reservations:', error)
    throw error
  }
}

export async function getReservationsByLocation(locationId: string): Promise<Reservation[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'reservations'),
      where('locationId', '==', locationId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : doc.data().createdAt,
      updatedAt: doc.data().updatedAt instanceof Timestamp 
        ? doc.data().updatedAt.toDate() 
        : doc.data().updatedAt,
    })) as Reservation[]
  } catch (error) {
    console.error('Error fetching location reservations:', error)
    throw error
  }
}

export function getAvailableTimeSlots(date: string): string[] {
  // Generate time slots from 8 AM to 9 PM in 30-minute intervals
  const slots: string[] = []
  for (let hour = 8; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 21) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
}

export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}
