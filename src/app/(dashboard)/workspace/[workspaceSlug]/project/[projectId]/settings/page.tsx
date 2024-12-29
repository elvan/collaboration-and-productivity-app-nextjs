import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ProjectSettings } from "@/components/project/project-settings"

async function getProject(workspaceSlug: string, projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        slug: workspaceSlug,
      },
      members: {
        some: {
          userId,
          role: "ADMIN",
        },
      },
    },
    include: {
      folder: true,
      taskStatuses: {
        orderBy: {
          position: "asc",
        },
      },
      taskPriorities: {
        orderBy: {
          position: "asc",
        },
      },
    },
  })

  if (!project) {
    throw new Error("Project not found")
  }

  return project
}

async function getFolders(workspaceSlug: string) {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: workspaceSlug,
    },
    include: {
      projectFolders: {
        orderBy: {
          position: "asc",
        },
      },
    },
  })

  if (!workspace) {
    throw new Error("Workspace not found")
  }

  return workspace.projectFolders
}

interface ProjectSettingsPageProps {
  params: {
    workspaceSlug: string
    projectId: string
  }
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const [project, folders] = await Promise.all([
    getProject(params.workspaceSlug, params.projectId, session.user.id),
    getFolders(params.workspaceSlug),
  ])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground">
          Manage your project settings and configuration
        </p>
      </div>

      <div className="space-y-8">
        <ProjectSettings project={project} folders={folders} />
      </div>
    </div>
  )
}
