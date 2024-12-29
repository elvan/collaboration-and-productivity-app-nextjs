import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { WorkspaceCard } from "@/components/workspace/workspace-card"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { Skeleton } from "@/components/ui/skeleton"

async function getWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
      isArchived: {
        equals: false,
      },
    },
    include: {
      _count: {
        select: {
          projects: true,
          teams: true,
        },
      },
      members: {
        where: {
          userId,
        },
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}

export default async function WorkspacesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const allWorkspaces = await getWorkspaces(session.user.id)
  const workspaces = allWorkspaces.filter(workspace => 
    workspace.members.some(member => member.status === "active")
  )

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and teams
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense
          fallback={[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        >
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              projectCount={workspace._count.projects}
              teamCount={workspace._count.teams}
            />
          ))}
        </Suspense>
      </div>
    </div>
  )
}
