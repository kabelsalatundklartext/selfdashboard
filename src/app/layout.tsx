import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DashboardStateSync } from '@/components/layout/DashboardStateSync'

export const metadata: Metadata = {
  title: 'SelfDashboard',
  description: 'Your modular self-hosted dashboard',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DashboardStateSync />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
