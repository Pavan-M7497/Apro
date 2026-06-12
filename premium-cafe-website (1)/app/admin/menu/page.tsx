"use client"

import { useEffect, useMemo, useState } from 'react'
import { menuItems as defaults, formatPrice, type MenuItem } from '@/lib/data'
import { mergeMenuCatalog, subscribeMenuOverrides, upsertMenuItem, uploadMenuImage } from '@/lib/cms-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'

export default function AdminMenuPage() {
  const [overrides, setOverrides] = useState<Record<string, Partial<MenuItem> & { id: string }>>({})
  const [drafts, setDrafts] = useState<Record<string, MenuItem>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeMenuOverrides(setOverrides)
    return () => unsub()
  }, [])

  const rows = useMemo(() => mergeMenuCatalog(defaults, overrides, { includeUnavailable: true }), [overrides])

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev }
      for (const item of rows) {
        if (!next[item.id]) next[item.id] = { ...item }
      }
      return next
    })
  }, [rows])

  const updateDraft = (id: string, patch: Partial<MenuItem>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? rows.find((r) => r.id === id)!), ...patch },
    }))
  }

  const save = async (id: string) => {
    const data = drafts[id]
    if (!data) return
    setSavingId(id)
    try {
      await upsertMenuItem(id, data)
      toast.success('Menu item saved')
    } catch {
      toast.error('Could not save item')
    } finally {
      setSavingId(null)
    }
  }

  const onUpload = async (id: string, file: File | null) => {
    if (!file) return
    try {
      const url = await uploadMenuImage(file, id)
      updateDraft(id, { image: url })
      await upsertMenuItem(id, { image: url })
      toast.success('Image updated')
    } catch {
      toast.error('Upload failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-coffee">Menu management</h1>
        <p className="text-mocha mt-1">
          Edit dishes, prices in ₹, availability, and photos. Changes sync to the live menu instantly.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-oat-milk text-left text-mocha">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price (₹)</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-foam">
            {rows.map((item) => {
              const d = drafts[item.id] ?? item
              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3 space-y-2 min-w-[220px]">
                    <Input value={d.name} onChange={(e) => updateDraft(item.id, { name: e.target.value })} />
                    <Input
                      value={d.description}
                      onChange={(e) => updateDraft(item.id, { description: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input value={d.category} onChange={(e) => updateDraft(item.id, { category: e.target.value })} />
                  </td>
                  <td className="px-4 py-3 w-28">
                    <Input
                      type="number"
                      value={d.price}
                      onChange={(e) => updateDraft(item.id, { price: Number(e.target.value) })}
                    />
                    <p className="text-xs text-mocha mt-1">{formatPrice(d.price)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={!!d.featured} onCheckedChange={(v) => updateDraft(item.id, { featured: v })} />
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={d.available !== false}
                      onCheckedChange={(v) => updateDraft(item.id, { available: v })}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <Input
                      value={d.image}
                      onChange={(e) => updateDraft(item.id, { image: e.target.value })}
                      placeholder="Image URL"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-xs"
                      onChange={(e) => onUpload(item.id, e.target.files?.[0] ?? null)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      className="bg-coffee text-cream"
                      disabled={savingId === item.id}
                      onClick={() => save(item.id)}
                    >
                      {savingId === item.id ? 'Saving…' : 'Save'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
