"use client"

import { useEffect, useState } from 'react'
import { deleteTestimonial, listTestimonials, upsertTestimonial } from '@/lib/cms-service'
import type { TestimonialDoc } from '@/lib/cms-types'
import { reviews as seedReviews } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<TestimonialDoc[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    try {
      let data = await listTestimonials()
      if (data.length === 0) {
        for (const r of seedReviews.slice(0, 4)) {
          await upsertTestimonial(r.id, {
            id: r.id,
            author: r.author,
            rating: r.rating,
            text: r.text,
            date: r.date,
            locationId: r.locationId,
            source: r.source,
            published: true,
          })
        }
        data = await listTestimonials()
      }
      setRows(data)
    } catch {
      toast.error('Could not load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const add = async () => {
    const id = `t-${Date.now()}`
    await upsertTestimonial(id, {
      id,
      author: 'Guest',
      rating: 5,
      text: 'Amazing experience at 154!',
      date: 'Just now',
      published: true,
    })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-coffee">Testimonials</h1>
          <p className="text-mocha mt-1">Curate reviews shown on the homepage carousel.</p>
        </div>
        <Button className="bg-coffee text-cream" onClick={add}>
          Add testimonial
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <Input value={t.author} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, author: e.target.value } : x)))} />
            <Input
              type="number"
              value={t.rating}
              onChange={(e) => setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, rating: Number(e.target.value) } : x)))}
            />
            <Textarea
              value={t.text}
              onChange={(e) => setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => t.id && upsertTestimonial(t.id, t).then(() => toast.success('Saved'))}>
                Save
              </Button>
              <Button variant="outline" className="text-red-600" onClick={() => t.id && deleteTestimonial(t.id).then(reload)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
