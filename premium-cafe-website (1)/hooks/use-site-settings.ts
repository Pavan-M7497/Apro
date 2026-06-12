"use client"

import { useEffect, useState } from 'react'
import type { SiteSettingsDoc } from '@/lib/cms-types'
import { subscribeSiteSettings } from '@/lib/cms-service'

export function useSiteSettings(): {
  settings: SiteSettingsDoc | null
  loading: boolean
} {
  const [settings, setSettings] = useState<SiteSettingsDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeSiteSettings((data) => {
      setSettings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { settings, loading }
}
