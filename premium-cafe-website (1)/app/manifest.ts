import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '154 Breakfast Club — Bengaluru',
    short_name: '154',
    description: "Serving Bangalore's best breakfast & brunch experience.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#2C1810',
    lang: 'en-IN',
    orientation: 'portrait-primary',
    icons: [{ src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' }],
  }
}
