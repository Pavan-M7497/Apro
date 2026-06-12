'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { listPublishedEvents, listPublishedOffers, rsvpEvent } from '@/lib/cms-service'
import type { CafeEventDoc, OfferDoc } from '@/lib/cms-types'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-context'
import { Calendar, Music, Mic2, Sparkles, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

export function EventsOffers() {
  const { user, openSignIn } = useAuth()
  const [events, setEvents] = useState<CafeEventDoc[]>([])
  const [offers, setOffers] = useState<OfferDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ev, of] = await Promise.all([listPublishedEvents(), listPublishedOffers()])
        if (cancelled) return
        setEvents(ev)
        setOffers(of)
      } catch {
        if (!cancelled) {
          setEvents([])
          setOffers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || (events.length === 0 && offers.length === 0)) {
    return null
  }

  const iconFor = (t: CafeEventDoc['type']) => {
    if (t === 'live-music') return Music
    if (t === 'comedy') return Mic2
    if (t === 'brunch') return Calendar
    return Sparkles
  }

  return (
    <section className="py-24 md:py-32 bg-oat-milk">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal className="text-center mb-14">
          <span className="text-caramel text-sm font-medium tracking-[0.2em] uppercase">What&apos;s On</span>
          <h2 className="font-serif text-4xl md:text-5xl text-coffee mt-4 mb-4">Events & Offers</h2>
          <p className="text-mocha text-lg max-w-2xl mx-auto leading-relaxed">
            Live music in Indiranagar, stand-up nights in Koramangala, weekend brunch across Bengaluru — curated for
            the 154 community.
          </p>
        </ScrollReveal>

        {offers.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {offers.map((offer, i) => (
              <ScrollReveal key={offer.id ?? offer.title} delay={i * 0.05}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-foam flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E23744]/10 flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-[#E23744]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-coffee">{offer.title}</h3>
                    <p className="text-mocha text-sm mt-2 leading-relaxed">{offer.description}</p>
                    {offer.validUntil && (
                      <p className="text-xs text-mocha mt-3">Valid till {offer.validUntil}</p>
                    )}
                    {offer.code && (
                      <p className="text-sm font-mono text-coffee mt-2 bg-oat-milk inline-block px-2 py-1 rounded">
                        Code: {offer.code}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const Icon = iconFor(event.type)
            const dateLabel = (() => {
              try {
                return format(parseISO(event.startsAt), 'EEE, d MMM · h:mm a')
              } catch {
                return event.startsAt
              }
            })()

            return (
              <ScrollReveal key={event.id ?? event.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-cream rounded-2xl border border-foam p-6 h-full flex flex-col shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-coffee/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-coffee" />
                    </div>
                    <span className="text-xs uppercase tracking-wider text-mocha">{event.type.replace('-', ' ')}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-coffee mb-2">{event.title}</h3>
                  <p className="text-mocha text-sm leading-relaxed flex-1">{event.description}</p>
                  <p className="text-coffee text-sm font-medium mt-4">{dateLabel}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 border-coffee text-coffee hover:bg-coffee hover:text-cream"
                    onClick={async () => {
                      if (!user) {
                        openSignIn()
                        return
                      }
                      if (!event.id) return
                      try {
                        await rsvpEvent(user.uid, event.id, 2)
                        toast.success("You're on the guest list!")
                      } catch {
                        toast.error('Could not RSVP. Please try again.')
                      }
                    }}
                  >
                    RSVP
                  </Button>
                  <p className="text-[11px] text-mocha mt-2">
                    Signed-in guests get calendar reminders & birthday perks.
                  </p>
                </motion.div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
