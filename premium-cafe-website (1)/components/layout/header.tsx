'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from '@/components/location-context'
import { useAuth } from '@/components/auth-context'
import { useReservation } from '@/components/reservation-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { isOpenNow } from '@/lib/data'
import { Menu, X, MapPin, ChevronDown, User, CalendarCheck } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { selectedLocation, openLocationModal } = useLocation()
  const { user, userProfile, signOut, isStaff, openSignIn } = useAuth()
  const { openReservation } = useReservation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isOpen = selectedLocation ? isOpenNow(selectedLocation) : false

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-cream/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-2xl text-coffee">154</span>
          <span className="hidden sm:inline text-mocha text-sm tracking-wide">Breakfast Club</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-espresso hover:text-caramel transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {selectedLocation && (
            <button
              type="button"
              onClick={openLocationModal}
              className="flex items-center gap-2 text-sm text-mocha hover:text-coffee transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{selectedLocation.shortName}</span>
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-foam'}`} />
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {user ? (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-mocha hover:text-coffee transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="max-w-24 truncate">{userProfile?.displayName || 'Profile'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-cream rounded-lg shadow-xl border border-foam py-2 min-w-[180px]">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-coffee hover:bg-oat-milk"
                  >
                    My Dashboard
                  </Link>
                  {isStaff && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-coffee hover:bg-oat-milk"
                    >
                      Manager Console
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-coffee hover:bg-oat-milk"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn()}
              className="flex items-center gap-2 text-sm text-mocha hover:text-coffee transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={openReservation}
            className="flex items-center gap-2 bg-coffee text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-espresso transition-colors"
          >
            <CalendarCheck className="w-4 h-4" />
            Reserve Table
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-coffee"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-30 bg-cream/98 backdrop-blur-lg shadow-lg md:hidden"
          >
            <nav className="flex flex-col p-6 gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-foam">
                <span className="text-sm text-mocha">Appearance</span>
                <ThemeToggle />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-coffee text-lg font-medium py-2 border-b border-foam"
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-coffee text-lg font-medium py-2 border-b border-foam"
                  >
                    My Dashboard
                  </Link>
                  {isStaff && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-coffee text-lg font-medium py-2 border-b border-foam"
                    >
                      Manager Console
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-left text-mocha text-lg font-medium py-2 border-b border-foam"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    openSignIn()
                  }}
                  className="text-left text-coffee text-lg font-medium py-2 border-b border-foam"
                >
                  Sign In
                </button>
              )}

              {selectedLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    openLocationModal()
                  }}
                  className="flex items-center gap-2 text-mocha py-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Change Location: {selectedLocation.shortName}</span>
                  <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-foam'}`} />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  openReservation()
                }}
                className="flex items-center justify-center gap-2 bg-coffee text-cream text-center py-3 rounded-lg font-medium mt-2"
              >
                <CalendarCheck className="w-5 h-5" />
                Reserve a Table
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
