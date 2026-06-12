'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarCheck, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { useReservation } from '@/components/reservation-context'
import { useLocation } from '@/components/location-context'

export function MobileStickyCta() {
  const pathname = usePathname()
  const { openReservation } = useReservation()
  const { selectedLocation } = useLocation()

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 md:hidden pointer-events-none">
      <div className="pointer-events-auto border-t border-foam/80 bg-cream/95 backdrop-blur-md px-4 py-3 flex gap-3 safe-area-pb">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={openReservation}
          className="flex-1 flex items-center justify-center gap-2 bg-coffee text-cream py-3 rounded-xl text-sm font-semibold shadow-lg"
        >
          <CalendarCheck className="w-4 h-4" />
          Reserve
        </motion.button>
        <Link
          href="/menu"
          className="flex-1 flex items-center justify-center gap-2 bg-oat-milk text-coffee py-3 rounded-xl text-sm font-semibold border border-foam"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menu
        </Link>
        {selectedLocation && (
          <a
            href={selectedLocation.swiggyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center justify-center px-3 rounded-xl bg-[#FC8019] text-white text-xs font-bold"
            title="Order on Swiggy"
          >
            S
          </a>
        )}
      </div>
    </div>
  )
}
