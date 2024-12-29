import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { WorkspaceAnalyticsComponent } from "@/components/workspace/workspace-analytics"
import { MembersTable } from "@/components/workspace/members-table"
import { RolesTable } from "@/components/workspace/roles-table"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
import { WorkspaceSettings } from "@/components/workspace/workspace-settings"
import { ProjectFolders } from "@/components/project/project-folders"
import { CreateProjectDialog } from "@/components/project/create-project-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getWorkspace(slug: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      workspaceMembers: {
        some: {
          userId,
          status: "active",
        },
      },
    },
    include: {
      workspaceMembers: {
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
      workspaceRoles: true,
      workspaceAnalytics: true,
      projects: {
        orderBy: {
          position: "asc",
        },
      },
      projectFolders: {
        orderBy: {
          position: "asc",
        },
        include: {
          projects: {
            orderBy: {
              position: "asc",
            },
          },
          children: true,
        },
      },
    },
  })

  if (!workspace) {
    notFound()
  }

  return workspace
}

interface WorkspacePageProps {
  params: {
    slug: string
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const workspace = await getWorkspace(params.slug, session.user.id)
  const isAdmin = workspace.workspaceMembers.some(
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
        <div className="flex gap-4">
          <CreateProjectDialog
            workspaceId={workspace.id}
            folders={workspace.projectFolders}
            workspaceRoles={workspace.workspaceRoles}
          />
          {isAdmin && (
            <InviteMemberDialog
              workspaceId={workspace.id}
              workspaceRoles={workspace.workspaceRoles}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <WorkspaceAnalyticsComponent
            analytics={workspace.workspaceAnalytics}
          />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectFolders
            workspaceId={workspace.id}
            folders={workspace.projectFolders}
            projects={workspace.projects}
          />
        </TabsContent>
        <TabsContent value="members">
          <MembersTable
            workspaceMembers={workspace.workspaceMembers}
            workspaceRoles={workspace.workspaceRoles}
            workspaceId={workspace.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="roles">
              <RolesTable
                workspaceRoles={workspace.workspaceRoles}
                workspaceId={workspace.id}
              />
            </TabsContent>
            <TabsContent value="settings">
              <WorkspaceSettings workspace={workspace} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
