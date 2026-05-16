import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DashboardStateSync } from '@/components/layout/DashboardStateSync'
import { LogCapture } from '@/components/layout/LogCapture'

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
      <body>
        <DashboardStateSync />
        <LogCapture />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
