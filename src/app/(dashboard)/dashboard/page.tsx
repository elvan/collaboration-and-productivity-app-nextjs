import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard | CollabSpace",
  description: "Manage your projects and tasks",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome back, ${session?.user?.name}`}
      >
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Projects
              </p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tasks Due Today
              </p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Members
              </p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed Tasks
              </p>
              <p className="text-2xl font-bold">128</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
