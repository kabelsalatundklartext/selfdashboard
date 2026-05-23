import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LogCapture } from '@/components/layout/LogCapture'
import { CorePluginSettingsInit } from '@/components/settings/CorePluginSettingsInit'

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CorePluginSettingsInit />
        <LogCapture />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
