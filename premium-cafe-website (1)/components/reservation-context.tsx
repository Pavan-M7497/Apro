"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useAuth } from '@/components/auth-context'
import { ReservationModal } from '@/components/reservation-modal'

interface ReservationContextValue {
  openReservation: () => void
  closeReservation: () => void
}

const ReservationContext = createContext<ReservationContextValue | undefined>(undefined)

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { openSignIn } = useAuth()

  const openReservation = useCallback(() => setOpen(true), [])
  const closeReservation = useCallback(() => setOpen(false), [])

  return (
    <ReservationContext.Provider value={{ openReservation, closeReservation }}>
      {children}
      <ReservationModal
        isOpen={open}
        onClose={closeReservation}
        onAuthRequired={() => {
          closeReservation()
          openSignIn()
        }}
      />
    </ReservationContext.Provider>
  )
}

export function useReservation() {
  const ctx = useContext(ReservationContext)
  if (!ctx) throw new Error('useReservation must be used within ReservationProvider')
  return ctx
}
