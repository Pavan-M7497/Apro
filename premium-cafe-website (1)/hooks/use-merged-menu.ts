"use client"

import { useEffect, useMemo, useState } from 'react'
import { menuItems as defaultMenuItems, type MenuItem } from '@/lib/data'
import { mergeMenuCatalog, subscribeMenuOverrides } from '@/lib/cms-service'

export function useMergedMenu(): { items: MenuItem[]; loading: boolean; error: Error | null } {
  const [overrides, setOverrides] = useState<Record<string, Partial<MenuItem> & { id: string }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsub = subscribeMenuOverrides(
      (map) => {
        setOverrides(map)
        setLoading(false)
        setError(null)
      }
    )
    return () => unsub()
  }, [])

  const items = useMemo(
    () => mergeMenuCatalog(defaultMenuItems, overrides),
    [overrides]
  )

  return { items, loading, error }
}
