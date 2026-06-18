import type { Metadata, Viewport } from 'next'
import { Exo_2 } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LogCapture } from '@/components/layout/LogCapture'
import { CorePluginSettingsInit } from '@/components/settings/CorePluginSettingsInit'

// Self brand UI font (matches SelfCoder / Self Brand-Kit: "Exo 2").
// Self-hosted at build time via next/font → no runtime request, no layout shift.
const exo2 = Exo_2({ subsets: ['latin'], display: 'swap', variable: '--font-exo2' })

export const metadata: Metadata = {
  title: 'SelfDashboard',
  description: 'Your modular self-hosted dashboard',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={exo2.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CorePluginSettingsInit />
        <LogCapture />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
