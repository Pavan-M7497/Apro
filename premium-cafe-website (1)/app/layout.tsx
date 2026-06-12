import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-context'
import { AuthModalHost } from '@/components/auth-modal-host'
import { ReservationProvider } from '@/components/reservation-context'
import { LocationProvider } from '@/components/location-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { MobileStickyCta } from '@/components/mobile-sticky-cta'
import { BANGALORE_TAGLINE } from '@/lib/data'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://154breakfastclub.in'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '154 Breakfast Club | Premium Breakfast & Brunch Cafe in Bengaluru',
    template: '%s | 154 Breakfast Club',
  },
  description: `${BANGALORE_TAGLINE} Premium all-day breakfast, specialty coffee & weekend brunch across Indiranagar, Koramangala, HSR Layout, Whitefield & JP Nagar.`,
  keywords: [
    'Bangalore cafe',
    'Bengaluru brunch',
    'breakfast Indiranagar',
    'Koramangala coffee',
    'HSR layout cafe',
    'Whitefield brunch',
    'JP Nagar breakfast',
    'premium cafe Bangalore',
    'GST restaurant Bangalore',
  ],
  openGraph: {
    title: '154 Breakfast Club | Bengaluru',
    description: BANGALORE_TAGLINE,
    type: 'website',
    locale: 'en_IN',
    siteName: '154 Breakfast Club',
  },
  twitter: {
    card: 'summary_large_image',
    title: '154 Breakfast Club | Bengaluru',
    description: BANGALORE_TAGLINE,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#1a120d' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthModalHost />
            <LocationProvider>
              <ReservationProvider>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: '#2C1810',
                      color: '#FAF7F2',
                      borderRadius: '12px',
                    },
                  }}
                />
                <Header />
                <main className="pb-24 md:pb-0">{children}</main>
                <Footer />
                <WhatsAppButton />
                <MobileStickyCta />
              </ReservationProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
