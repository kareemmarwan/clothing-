'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import QueryProvider from '@/components/QueryProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            username="المدير"
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </QueryProvider>
  )
}
