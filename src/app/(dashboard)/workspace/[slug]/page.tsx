import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceAnalyticsComponent } from "@/components/workspace/workspace-analytics"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
import { MembersTable } from "@/components/workspace/members-table"
import { RolesTable } from "@/components/workspace/roles-table"

async function getWorkspace(slug: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId,
          status: "active",
        },
      },
    },
    include: {
      members: {
        where: {
          status: "active",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          role: true,
        },
      },
      WorkspaceRole: true,
      analytics: true,
    },
  })

  if (!workspace) {
    notFound()
  }

  return workspace
}

export default async function WorkspacePage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const workspace = await getWorkspace(params.slug, session.user.id)
  const isAdmin = workspace.members.some(
    (member) =>
      member.userId === session.user.id && member.role.name === "Admin"
  )

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {workspace.name}
          </h1>
          <p className="text-muted-foreground">{workspace.description}</p>
        </div>
        {isAdmin && <InviteMemberDialog workspaceId={workspace.id} roles={workspace.WorkspaceRole} />}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="roles">Roles</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <WorkspaceAnalyticsComponent analytics={workspace.analytics} />
        </TabsContent>
        <TabsContent value="members">
          <MembersTable
            members={workspace.members}
            roles={workspace.WorkspaceRole}
            workspaceId={workspace.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="roles">
            <RolesTable
              roles={workspace.WorkspaceRole}
              workspaceId={workspace.id}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
