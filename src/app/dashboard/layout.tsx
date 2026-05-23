import { DashboardStateSync } from '@/components/layout/DashboardStateSync'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardStateSync />
      {children}
    </>
  )
}
