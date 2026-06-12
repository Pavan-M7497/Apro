"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-context'
import {
  LayoutDashboard,
  CalendarCheck,
  UtensilsCrossed,
  Users,
  ImageIcon,
  Settings,
  ArrowLeft,
  Tag,
  ShoppingBag,
  MessageSquareQuote,
} from 'lucide-react'

const baseNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/reservations', label: 'Reservations', icon: CalendarCheck },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/admin/offers-events', label: 'Offers & Events', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isStaff, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !isStaff)) {
      router.push('/')
    }
  }, [user, loading, isStaff, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isStaff) {
    return null
  }

  const adminNav = isAdmin ? [...baseNav, { href: '/admin/settings', label: 'Settings', icon: Settings }] : baseNav

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              <div className="mb-4 pb-4 border-b border-foam">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-mocha hover:text-coffee transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to site
                </Link>
              </div>

              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? 'bg-coffee text-cream' : 'text-espresso hover:bg-oat-milk'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
