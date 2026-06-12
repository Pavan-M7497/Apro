import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { QRMenuClient } from './qr-menu-client'

export const metadata: Metadata = {
  title: 'QR Menu',
  description: 'Scan-friendly menu for 154 Breakfast Club locations in Bengaluru.',
}

export default function QRMenuPage() {
  return (
    <section className="min-h-screen bg-cream pt-28 pb-16 px-6">
      <div className="max-w-lg mx-auto text-center">
        <p className="text-caramel text-xs font-semibold tracking-[0.2em] uppercase mb-3">154 Breakfast Club</p>
        <h1 className="font-serif text-3xl text-coffee mb-2">Digital QR Menu</h1>
        <p className="text-mocha text-sm mb-8">
          Open this page at your table for the latest menu, prices in ₹, and allergen notes. GST as applicable at bill.
        </p>
        <Suspense fallback={<div className="h-[320px] bg-oat-milk rounded-2xl animate-pulse" />}>
          <QRMenuClient />
        </Suspense>
        <Link href="/menu" className="inline-block mt-10 text-coffee text-sm font-medium underline-offset-4 hover:underline">
          View full interactive menu
        </Link>
      </div>
    </section>
  )
}
