import { DashboardPage } from '@/components/layout/DashboardPage'

export default function Page({ params }: { params: { id: string } }) {
  return <DashboardPage id={params.id} />
}
