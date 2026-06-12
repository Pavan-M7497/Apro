'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { locations, type Location } from '@/lib/data'

interface LocationContextType {
  selectedLocation: Location | null
  currentLocation: Location | null // Alias for selectedLocation
  setSelectedLocation: (location: Location) => void
  isLocationModalOpen: boolean
  openLocationModal: () => void
  closeLocationModal: () => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  useEffect(() => {
    // Check localStorage for previously selected location
    const savedLocationId = localStorage.getItem('154-selected-location')
    if (savedLocationId) {
      const location = locations.find(l => l.id === savedLocationId)
      if (location) {
        setSelectedLocationState(location)
        return
      }
    }
    // Show modal if no location is selected
    setIsLocationModalOpen(true)
  }, [])

  const setSelectedLocation = (location: Location) => {
    setSelectedLocationState(location)
    localStorage.setItem('154-selected-location', location.id)
    setIsLocationModalOpen(false)
  }

  const openLocationModal = () => setIsLocationModalOpen(true)
  const closeLocationModal = () => setIsLocationModalOpen(false)

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        currentLocation: selectedLocation,
        setSelectedLocation,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
