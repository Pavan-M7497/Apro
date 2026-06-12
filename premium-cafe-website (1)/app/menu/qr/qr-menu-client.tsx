'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function QRMenuClient() {
  const searchParams = useSearchParams()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const menuUrl = useMemo(() => {
    if (!origin) return ''
    const base = `${origin}/menu`
    const loc = searchParams.get('location')
    return loc ? `${base}?location=${encodeURIComponent(loc)}` : base
  }, [origin, searchParams])

  const qrSrc = menuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(menuUrl)}`
    : ''

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-foam p-8 flex flex-col items-center">
      {qrSrc ? (
        <Image src={qrSrc} alt="Menu QR code" width={280} height={280} className="rounded-xl" unoptimized />
      ) : (
        <div className="w-[280px] h-[280px] bg-oat-milk rounded-xl animate-pulse" />
      )}
      <p className="text-xs text-mocha mt-4 break-all max-w-[280px]">{menuUrl || 'Preparing link…'}</p>
    </div>
  )
}
