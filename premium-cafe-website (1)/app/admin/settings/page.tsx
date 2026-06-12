"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-context'
import { fetchSiteSettings, saveSiteSettings } from '@/lib/cms-service'
import type { SiteSettingsDoc } from '@/lib/cms-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth()
  const [form, setForm] = useState<SiteSettingsDoc>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const data = await fetchSiteSettings()
      setForm(data ?? {})
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    try {
      await saveSiteSettings(form)
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <p className="text-coffee font-medium">Admin access required</p>
        <p className="text-mocha text-sm mt-2">Settings are restricted to full administrators.</p>
      </div>
    )
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
      <div>
        <h1 className="font-serif text-3xl text-coffee">Site settings</h1>
        <p className="text-mocha mt-1">Homepage hero, announcements, Instagram, and trending dish IDs.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 max-w-2xl">
        <label className="block text-sm font-medium text-coffee">Hero image URL</label>
        <Input value={form.heroImageUrl || ''} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })} />

        <label className="block text-sm font-medium text-coffee">Hero title (optional override)</label>
        <Input value={form.heroTitle || ''} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} />

        <label className="block text-sm font-medium text-coffee">Hero subtitle</label>
        <Textarea
          value={form.heroSubtitle || ''}
          onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          rows={3}
        />

        <label className="block text-sm font-medium text-coffee">Announcement banner</label>
        <Textarea
          value={form.announcement || ''}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          rows={2}
          placeholder="Shown to signed-in guests on their dashboard"
        />

        <label className="block text-sm font-medium text-coffee">Instagram profile URL</label>
        <Input value={form.instagramUrl || ''} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} />

        <label className="block text-sm font-medium text-coffee">Trending menu item IDs (comma separated)</label>
        <Input
          value={(form.trendingMenuIds || []).join(',')}
          onChange={(e) =>
            setForm({
              ...form,
              trendingMenuIds: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />

        <Button className="bg-coffee text-cream" onClick={save}>
          Save settings
        </Button>

        <p className="text-xs text-mocha">
          Push notifications: enable Firebase Cloud Messaging in your Firebase project and add the web SDK snippet —
          optional upgrade path for your team.
        </p>
      </div>
    </div>
  )
}
