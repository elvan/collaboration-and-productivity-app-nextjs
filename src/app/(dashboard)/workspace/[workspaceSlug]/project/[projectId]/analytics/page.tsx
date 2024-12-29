import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ProjectAnalytics } from "@/components/project/project-analytics"

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
        },
      },
    },
    include: {
      taskStatuses: {
        orderBy: {
          position: "asc",
        },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      analytics: true,
    },
  })

  if (!project) {
    throw new Error("Project not found")
  }

  return project
}

interface ProjectAnalyticsPageProps {
  params: {
    workspaceSlug: string
    projectId: string
  }
}

export default async function ProjectAnalyticsPage({
  params,
}: ProjectAnalyticsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const project = await getProject(
    params.workspaceSlug,
    params.projectId,
    session.user.id
  )

  return (
    <div className="container py-8">
      <ProjectAnalytics project={project} />
    </div>
  )
}
