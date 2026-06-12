"use client"

import { useEffect, useState } from 'react'
import { deleteEvent, deleteOffer, listEvents, listOffers, upsertEvent, upsertOffer } from '@/lib/cms-service'
import type { CafeEventDoc, OfferDoc } from '@/lib/cms-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

export default function AdminOffersEventsPage() {
  const [tab, setTab] = useState<'offers' | 'events'>('offers')
  const [offers, setOffers] = useState<OfferDoc[]>([])
  const [events, setEvents] = useState<CafeEventDoc[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    try {
      const [o, e] = await Promise.all([listOffers(), listEvents()])
      setOffers(o)
      setEvents(e)
    } catch {
      toast.error('Could not load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const addOffer = async () => {
    const id = `offer-${Date.now()}`
    const row: OfferDoc = {
      id,
      title: 'New offer',
      description: 'Describe your BOGO / seasonal special',
      published: true,
    }
    await upsertOffer(id, row)
    reload()
  }

  const addEvent = async () => {
    const id = `event-${Date.now()}`
    const row: CafeEventDoc = {
      id,
      title: 'New event',
      description: 'Live music, comedy, or brunch collab details',
      type: 'brunch',
      startsAt: new Date().toISOString(),
      published: true,
    }
    await upsertEvent(id, row)
    reload()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`px-4 py-2 rounded-full text-sm font-medium ${tab === 'offers' ? 'bg-coffee text-cream' : 'bg-oat-milk'}`}
          onClick={() => setTab('offers')}
        >
          Offers
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-full text-sm font-medium ${tab === 'events' ? 'bg-coffee text-cream' : 'bg-oat-milk'}`}
          onClick={() => setTab('events')}
        >
          Events
        </button>
      </div>

      {tab === 'offers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="font-serif text-3xl text-coffee">Offers</h1>
            <Button className="bg-coffee text-cream" onClick={addOffer}>
              Add offer
            </Button>
          </div>
          {offers.map((o) => (
            <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
              <Input value={o.title} onChange={(e) => setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, title: e.target.value } : x)))} />
              <Textarea
                value={o.description}
                onChange={(e) => setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, description: e.target.value } : x)))}
              />
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  placeholder="valid until"
                  value={o.validUntil || ''}
                  onChange={(e) => setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, validUntil: e.target.value } : x)))}
                />
                <Input
                  placeholder="code"
                  value={o.code || ''}
                  onChange={(e) => setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, code: e.target.value } : x)))}
                />
                <label className="flex items-center gap-2 text-sm text-mocha">
                  <input
                    type="checkbox"
                    checked={o.published !== false}
                    onChange={(e) => setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, published: e.target.checked } : x)))}
                  />
                  Published
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => o.id && upsertOffer(o.id, o).then(() => toast.success('Saved'))}>
                  Save
                </Button>
                <Button variant="outline" className="text-red-600" onClick={() => o.id && deleteOffer(o.id).then(reload)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="font-serif text-3xl text-coffee">Events</h1>
            <Button className="bg-coffee text-cream" onClick={addEvent}>
              Add event
            </Button>
          </div>
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
              <Input value={ev.title} onChange={(e) => setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, title: e.target.value } : x)))} />
              <Textarea
                value={ev.description}
                onChange={(e) => setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, description: e.target.value } : x)))}
              />
              <div className="grid sm:grid-cols-2 gap-2">
                <select
                  className="border border-foam rounded-lg px-2 py-2 bg-oat-milk text-sm"
                  value={ev.type}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((x) => (x.id === ev.id ? { ...x, type: e.target.value as CafeEventDoc['type'] } : x))
                    )
                  }
                >
                  <option value="live-music">live-music</option>
                  <option value="comedy">comedy</option>
                  <option value="brunch">brunch</option>
                  <option value="seasonal">seasonal</option>
                  <option value="other">other</option>
                </select>
                <Input
                  type="datetime-local"
                  value={ev.startsAt ? ev.startsAt.slice(0, 16) : ''}
                  onChange={(e) =>
                    setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, startsAt: new Date(e.target.value).toISOString() } : x)))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-mocha">
                <input
                  type="checkbox"
                  checked={ev.published !== false}
                  onChange={(e) => setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, published: e.target.checked } : x)))}
                />
                Published
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => ev.id && upsertEvent(ev.id, ev).then(() => toast.success('Saved'))}>
                  Save
                </Button>
                <Button variant="outline" className="text-red-600" onClick={() => ev.id && deleteEvent(ev.id).then(reload)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
