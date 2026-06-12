"use client"

import Link from 'next/link'
import { DEFAULT_SWIGGY_URL, DEFAULT_ZOMATO_URL } from '@/lib/data'

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-coffee">Orders</h1>
        <p className="text-mocha mt-1 max-w-2xl">
          Delivery and takeaway orders are fulfilled through Swiggy and Zomato. Connect your live restaurant URLs in
          Firebase <code className="text-xs bg-oat-milk px-1 rounded">settings/site</code> or update location records in{' '}
          <code className="text-xs bg-oat-milk px-1 rounded">lib/data.ts</code> when you are ready.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3 max-w-xl">
        <p className="text-sm text-coffee font-medium">Placeholder storefront links</p>
        <p className="text-sm text-mocha break-all">{DEFAULT_SWIGGY_URL}</p>
        <p className="text-sm text-mocha break-all">{DEFAULT_ZOMATO_URL}</p>
        <div className="flex gap-3 pt-2">
          <Link href={DEFAULT_SWIGGY_URL} target="_blank" className="text-coffee text-sm underline">
            Open Swiggy
          </Link>
          <Link href={DEFAULT_ZOMATO_URL} target="_blank" className="text-coffee text-sm underline">
            Open Zomato
          </Link>
        </div>
      </div>
    </div>
  )
}
