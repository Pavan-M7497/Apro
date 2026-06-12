"use client"

import { motion } from 'framer-motion'
import { useLocation } from '@/components/location-context'
import { ExternalLink } from 'lucide-react'

interface OrderButtonsProps {
  variant?: 'default' | 'compact' | 'large'
  className?: string
}

export function OrderButtons({ variant = 'default', className = '' }: OrderButtonsProps) {
  const { selectedLocation } = useLocation()

  if (!selectedLocation) return null

  const swiggyUrl = selectedLocation.swiggyUrl
  const zomatoUrl = selectedLocation.zomatoUrl

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a
          href={swiggyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FC8019] text-white text-xs font-medium hover:bg-[#e57316] transition-colors"
        >
          <SwiggyIcon className="w-4 h-4" />
          Swiggy
        </a>
        <a
          href={zomatoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E23744] text-white text-xs font-medium hover:bg-[#cb313d] transition-colors"
        >
          <ZomatoIcon className="w-4 h-4" />
          Zomato
        </a>
      </div>
    )
  }

  if (variant === 'large') {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <motion.a
          href={swiggyUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#FC8019] text-white font-medium hover:bg-[#e57316] transition-colors shadow-lg"
        >
          <SwiggyIcon className="w-6 h-6" />
          <span>Order on Swiggy</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>
        <motion.a
          href={zomatoUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#E23744] text-white font-medium hover:bg-[#cb313d] transition-colors shadow-lg"
        >
          <ZomatoIcon className="w-6 h-6" />
          <span>Order on Zomato</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href={swiggyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FC8019] text-white text-sm font-medium hover:bg-[#e57316] transition-colors"
      >
        <SwiggyIcon className="w-5 h-5" />
        Order on Swiggy
      </a>
      <a
        href={zomatoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E23744] text-white text-sm font-medium hover:bg-[#cb313d] transition-colors"
      >
        <ZomatoIcon className="w-5 h-5" />
        Order on Zomato
      </a>
    </div>
  )
}

function SwiggyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function ZomatoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5l-2-2 2-2-2-2 2-2 4 4-4 4zm7 0l-4-4 4-4 2 2-2 2 2 2-2 2z" />
    </svg>
  )
}
