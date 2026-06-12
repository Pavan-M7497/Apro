'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useLocation } from '@/components/location-context'
import { useReservation } from '@/components/reservation-context'
import { isOpenNow, BANGALORE_TAGLINE } from '@/lib/data'
import { OrderButtons } from '@/components/order-buttons'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { ChevronDown, MapPin, CalendarCheck } from 'lucide-react'

export function Hero() {
  const { selectedLocation, openLocationModal } = useLocation()
  const { openReservation } = useReservation()
  const { settings } = useSiteSettings()
  const isOpen = selectedLocation ? isOpenNow(selectedLocation) : false

  const heroSrc =
    settings?.heroImageUrl ||
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80'

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={heroSrc}
          alt="154 Breakfast Club — Bengaluru"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-coffee/40 via-coffee/20 to-coffee/60" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-cream/10 backdrop-blur-sm border border-cream/20 rounded-full px-4 py-2 mb-8"
        >
          <span className="text-cream/90 text-sm tracking-wide">Est. 2019 · Bengaluru</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-caramel" />
          <span className="text-cream/90 text-sm tracking-wide">{BANGALORE_TAGLINE}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-cream mb-6 leading-[0.95] tracking-tight"
        >
          {settings?.heroTitle ?? (
            <>
              The Art of
              <br />
              <span className="text-caramel">Slow Coffee</span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-cream/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {settings?.heroSubtitle ??
            'Where every cup is crafted with intention, every plate tells a story, and every moment becomes a memory worth savouring — from Indiranagar to Whitefield.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {selectedLocation && <OrderButtons variant="compact" />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href="/menu"
            className="group bg-cream text-coffee px-8 py-4 rounded-lg font-medium hover:bg-caramel hover:text-cream transition-all duration-300 flex items-center gap-2"
          >
            Explore Menu
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={openReservation}
            className="inline-flex items-center gap-2 bg-caramel text-coffee px-8 py-4 rounded-lg font-medium hover:bg-cream transition-colors"
          >
            <CalendarCheck className="w-5 h-5" />
            Reserve Table
          </button>
          <Link
            href="/contact"
            className="bg-cream/10 backdrop-blur-sm border border-cream/30 text-cream px-8 py-4 rounded-lg font-medium hover:bg-cream/20 transition-colors"
          >
            Find Us
          </Link>
        </motion.div>

        {selectedLocation && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            type="button"
            onClick={openLocationModal}
            className="inline-flex items-center gap-3 text-cream/70 hover:text-cream transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{selectedLocation.name}</span>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-cream/40'}`} />
            <span className="text-sm text-cream/50">{isOpen ? 'Open Now' : 'Closed'}</span>
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-cream/50"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  )
}
