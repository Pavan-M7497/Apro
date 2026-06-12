'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { useMergedMenu } from '@/hooks/use-merged-menu'
import { formatPrice } from '@/lib/data'
import { useSiteSettings } from '@/hooks/use-site-settings'

export function TrendingDishes() {
  const { items } = useMergedMenu()
  const { settings } = useSiteSettings()

  const trending = useMemo(() => {
    const ids = settings?.trendingMenuIds?.length ? settings.trendingMenuIds : items.filter((i) => i.featured).map((i) => i.id)
    const set = new Set(ids)
    return items.filter((i) => set.has(i.id)).slice(0, 4)
  }, [items, settings?.trendingMenuIds])

  if (trending.length === 0) return null

  return (
    <section className="py-20 bg-white border-y border-foam">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal className="text-center mb-12">
          <span className="text-caramel text-sm font-medium tracking-[0.2em] uppercase">Trending in Bengaluru</span>
          <h2 className="font-serif text-3xl md:text-4xl text-coffee mt-3">What everyone&apos;s ordering</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 0.06}>
              <motion.div whileHover={{ y: -3 }} className="rounded-xl overflow-hidden bg-cream border border-foam">
                <div className="relative h-40">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
                </div>
                <div className="p-4">
                  <p className="font-serif text-lg text-coffee">{item.name}</p>
                  <p className="text-caramel font-medium mt-1">{formatPrice(item.price)}</p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/menu" className="text-coffee text-sm font-medium underline-offset-4 hover:underline">
            View full menu
          </Link>
        </div>
      </div>
    </section>
  )
}
