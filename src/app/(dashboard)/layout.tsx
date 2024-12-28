import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div>
        <div className="flex h-16 items-center px-4">
          <Header />
        </div>
      </div>
      <div className="flex pt-16">
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <Sidebar />
          <main className="flex w-full flex-col overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  )
}
