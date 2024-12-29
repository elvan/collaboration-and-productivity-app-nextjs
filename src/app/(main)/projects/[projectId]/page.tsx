import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { ProjectTabs } from "@/components/projects/project-tabs"
import { ProjectHeader } from "@/components/projects/project-header"
import { Project } from "@/types/project"

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

async function getProject(projectId: string, userId: string): Promise<Project | null> {
  return await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        {
          ownerId: userId
        },
        {
          members: {
            some: {
              userId: userId
            }
          }
        }
      ]
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          image: true
        }
      },
      workspace: {
        select: {
          name: true
        }
      },
      tasks: {
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          project: true,
          taskStatus: true,
          taskPriority: true,
          taskType: true,
          labels: true,
          customFields: true,
          customValues: true,
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      },
      activities: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      }
    }
  })
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {}
  }

  const project = await getProject(params.projectId, session.user.id)

  if (!project) {
    return {}
  }

  return {
    title: `${project.name} | CollabSpace`,
    description: project.description || "Project details",
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const project = await getProject(params.projectId, session.user.id)

  if (!project) {
    notFound()
  }

  const completedTasks = project.tasks.filter(
    (task) => task.status === "completed"
  ).length
  const progress = project.tasks.length === 0 
    ? 0 
    : (completedTasks / project.tasks.length) * 100

  return (
    <DashboardShell>
      <ProjectHeader project={project} progress={progress} />
      <div className="grid gap-8">
        <ProjectTabs project={project} />
      </div>
    </DashboardShell>
  )
}
