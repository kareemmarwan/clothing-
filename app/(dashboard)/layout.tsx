import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import QueryProvider from '@/components/QueryProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header username="المدير" />
          <main className="flex-1 p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </QueryProvider>
  )
}
