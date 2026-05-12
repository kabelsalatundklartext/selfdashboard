import { DashboardPage } from '@/components/layout/DashboardPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DashboardPage id={id} />
}
