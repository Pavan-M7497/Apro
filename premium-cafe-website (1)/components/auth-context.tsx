"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import type { UserRole } from '@/lib/cms-types'
import toast from 'react-hot-toast'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phone?: string
  role: UserRole
  loyaltyPoints: number
  favoriteLocation?: string
  /** Menu item ids */
  favoriteItemIds?: string[]
  savedAddresses: Address[]
  birthday?: string
  notificationsEnabled?: boolean
  createdAt: Date
}

export interface Address {
  id: string
  label: string
  address: string
  isDefault: boolean
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  authModalOpen: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
  openSignIn: () => void
  closeSignIn: () => void
  isAdmin: boolean
  isManager: boolean
  isStaff: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    if (!auth) {
      setUser(null)
      setUserProfile(null)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser && db) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const createUserProfile = async (firebaseUser: User, additionalData?: Partial<UserProfile>) => {
    if (!db) {
      toast.error('Firebase is not configured on this deployment.')
      throw new Error('Missing Firestore')
    }
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || additionalData?.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'customer',
        loyaltyPoints: 0,
        favoriteItemIds: [],
        savedAddresses: [],
        createdAt: new Date(),
        ...additionalData,
      }

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
      })

      setUserProfile(newProfile)
      return newProfile
    }

    return userSnap.data() as UserProfile
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      toast.error('Authentication is not available. Check Firebase configuration.')
      return
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const profile = await createUserProfile(result.user)
      setUserProfile(profile)
      toast.success('Welcome back!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) {
      toast.error('Authentication is not available. Check Firebase configuration.')
      return
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      const profile = await createUserProfile(result.user, { displayName: name })
      setUserProfile(profile)
      toast.success('Account created successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    if (!auth) {
      toast.error('Authentication is not available. Check Firebase configuration.')
      return
    }
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const profile = await createUserProfile(result.user)
      setUserProfile(profile)
      toast.success('Welcome!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google'
      toast.error(message)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!auth) {
      toast.error('Authentication is not available. Check Firebase configuration.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent. Check your inbox.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email'
      toast.error(message)
      throw error
    }
  }

  const signOut = async () => {
    if (!auth) return
    try {
      await firebaseSignOut(auth)
      setUserProfile(null)
      toast.success('Signed out successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    }
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !db) return

    try {
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, data, { merge: true })
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null))
      toast.success('Profile updated')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
      throw error
    }
  }

  const openSignIn = useCallback(() => setAuthModalOpen(true), [])
  const closeSignIn = useCallback(() => setAuthModalOpen(false), [])

  const role = userProfile?.role ?? 'customer'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isStaff = isAdmin || isManager

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authModalOpen,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateUserProfile,
        openSignIn,
        closeSignIn,
        isAdmin,
        isManager,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
