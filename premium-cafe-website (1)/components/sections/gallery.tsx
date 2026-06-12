'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Instagram } from 'lucide-react'

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    alt: 'Latte art',
    span: 'col-span-1 row-span-1'
  },
  {
    src: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80',
    alt: 'Café interior',
    span: 'col-span-1 row-span-2'
  },
  {
    src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    alt: 'Pancakes',
    span: 'col-span-1 row-span-1'
  },
  {
    src: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=600&q=80',
    alt: 'Coffee preparation',
    span: 'col-span-1 row-span-1'
  },
  {
    src: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80',
    alt: 'Brunch table',
    span: 'col-span-2 row-span-1'
  },
  {
    src: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80',
    alt: 'Morning atmosphere',
    span: 'col-span-1 row-span-1'
  }
]

export function Gallery() {
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <span className="text-caramel text-sm font-medium tracking-[0.2em] uppercase">
            @154breakfastclub
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-coffee mt-4 mb-6">
            Moments Worth Sharing
          </h2>
          <p className="text-mocha text-lg max-w-2xl mx-auto leading-relaxed">
            Follow our journey and share yours. Tag us for a chance to be featured.
          </p>
        </ScrollReveal>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          {galleryImages.map((image, index) => (
            <ScrollReveal
              key={index}
              delay={index * 0.05}
              className={`${image.span} min-h-[180px] md:min-h-[220px]`}
            >
              <motion.div
                whileHover={{ scale: 0.98 }}
                className="group relative w-full h-full rounded-xl overflow-hidden cursor-pointer"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-coffee/0 group-hover:bg-coffee/30 transition-colors duration-300 flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Instagram CTA */}
        <ScrollReveal className="text-center">
          <a
            href="https://instagram.com/154breakfastclub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-coffee text-cream px-8 py-4 rounded-lg font-medium hover:bg-espresso transition-colors"
          >
            <Instagram className="w-5 h-5" />
            Follow on Instagram
          </a>
        </ScrollReveal>
      </div>
    </section>
  )
}
