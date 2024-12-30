import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

interface ShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden border-r bg-background lg:block lg:w-60">
        <div className="flex h-full flex-col gap-2">
          <div className="flex-1 overflow-auto py-2">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="h-full px-4 py-6 lg:px-8">
          <div className={cn("mx-auto max-w-6xl", className)} {...props}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Shell({ children, sidebar, header }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {sidebar && (
        <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-background">
          {sidebar}
        </aside>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        {header && (
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {header}
          </header>
        )}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
