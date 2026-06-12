"use client"

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useLocation } from '@/components/location-context'

export function WhatsAppButton() {
  const { currentLocation } = useLocation()
  
  const whatsappNumber = currentLocation?.phone?.replace(/[^0-9]/g, '') || '919876543210'
  const message = encodeURIComponent(
    `Hi 154 Breakfast Club! I'm reaching out from your website — ${currentLocation?.shortName ?? 'Bengaluru'} outlet.`
  )
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-current" />
      <span className="text-sm font-medium hidden sm:inline group-hover:inline transition-all">
        Chat with us
      </span>
    </motion.a>
  )
}
