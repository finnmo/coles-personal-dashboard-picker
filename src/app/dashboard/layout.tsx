import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <TabNav />
      <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
