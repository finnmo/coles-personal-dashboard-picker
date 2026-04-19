import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <TabNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
