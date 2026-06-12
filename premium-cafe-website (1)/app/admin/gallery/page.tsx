"use client"

import { useEffect, useState } from 'react'
import { galleryImages } from '@/lib/data'
import {
  deleteGalleryItem,
  listGallery,
  seedGalleryFromStatic,
  upsertGalleryItem,
} from '@/lib/cms-service'
import type { GalleryItemDoc } from '@/lib/cms-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItemDoc[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      let data = await listGallery()
      if (data.length === 0) {
        await seedGalleryFromStatic(galleryImages)
        data = await listGallery()
      }
      setItems(data)
    } catch {
      toast.error('Could not load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const save = async (item: GalleryItemDoc) => {
    if (!item.id) return
    try {
      await upsertGalleryItem(item.id, item)
      toast.success('Saved')
      refresh()
    } catch {
      toast.error('Save failed')
    }
  }

  const remove = async (id?: string) => {
    if (!id) return
    try {
      await deleteGalleryItem(id)
      toast.success('Removed')
      refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  const add = async () => {
    const id = `g-${Date.now()}`
    const row: GalleryItemDoc = {
      id,
      src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      alt: 'New image',
      order: items.length,
    }
    try {
      await upsertGalleryItem(id, row)
      toast.success('Row added')
      refresh()
    } catch {
      toast.error('Could not add')
    }
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-coffee">Gallery</h1>
          <p className="text-mocha mt-1">Manage imagery for the public gallery section.</p>
        </div>
        <Button className="bg-coffee text-cream" onClick={add}>
          Add image
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 grid md:grid-cols-4 gap-3">
            <Input value={item.src} onChange={(e) => setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, src: e.target.value } : p)))} />
            <Input value={item.alt} onChange={(e) => setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, alt: e.target.value } : p)))} />
            <Input
              value={item.locationId || ''}
              placeholder="location id (optional)"
              onChange={(e) =>
                setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, locationId: e.target.value } : p)))
              }
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save(item)}>
                Save
              </Button>
              <Button variant="outline" className="text-red-600" onClick={() => remove(item.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
