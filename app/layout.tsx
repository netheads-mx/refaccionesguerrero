import type { Metadata } from 'next'
import { Bebas_Neue, Outfit } from 'next/font/google'
import './globals.css'

// Mapped to --font-syne so all existing pages inherit Bebas Neue for headings
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-syne',
  display: 'swap',
})

// Mapped to --font-figtree so all existing pages inherit Outfit for body
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Autopartes Guerrero — Sistema de Gestión',
  description: 'Sistema de gestión de inventario y punto de venta',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  )
}
