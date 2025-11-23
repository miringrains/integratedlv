import { Sidebar } from '@/components/layouts/Sidebar'
import { Header } from '@/components/layouts/Header'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { requireAuth } from '@/lib/auth'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 min-h-0">
            <div className="max-w-7xl mx-auto min-h-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

