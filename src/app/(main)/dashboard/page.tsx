import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { ProjectCard } from "@/components/dashboard/project-card"
import { TaskList } from "@/components/dashboard/task-list"

export const metadata: Metadata = {
  title: "Dashboard | CollabSpace",
  description: "Manage your projects and tasks",
}

async function getProjectStats(userId: string) {
  const activeProjects = await prisma.project.count({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } }
      ]
    }
  })

  const dueTasks = await prisma.task.count({
    where: {
      assigneeId: userId,
      status: { not: "completed" },
      dueDate: {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due within 24 hours
      }
    }
  })

  const completedTasks = await prisma.task.count({
    where: {
      assigneeId: userId,
      status: "completed"
    }
  })

  const teamMembers = await prisma.user.count({
    where: {
      workspaces: {
        some: {
          workspace: {
            members: {
              some: {
                userId
              }
            }
          }
        }
      }
    }
  })

  return {
    activeProjects,
    dueTasks,
    teamMembers,
    completedTasks
  }
}

async function getRecentProjects(userId: string) {
  return await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } }
      ]
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 3,
    include: {
      tasks: {
        select: {
          id: true,
          status: true
        }
      }
    }
  })
}

async function getUpcomingTasks(userId: string) {
  return await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "completed" },
      dueDate: {
        gte: new Date()
      }
    },
    orderBy: {
      dueDate: "asc"
    },
    take: 5,
    include: {
      project: true
    }
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [stats, recentProjects, upcomingTasks] = await Promise.all([
    getProjectStats(session.user.id),
    getRecentProjects(session.user.id),
    getUpcomingTasks(session.user.id)
  ])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome back, ${session.user.name}`}
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
              <p className="text-2xl font-bold">{stats.activeProjects}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tasks Due Soon
              </p>
              <p className="text-2xl font-bold">{stats.dueTasks}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Members
              </p>
              <p className="text-2xl font-bold">{stats.teamMembers}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed Tasks
              </p>
              <p className="text-2xl font-bold">{stats.completedTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
          <div className="grid gap-4 mt-4">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="col-span-3">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Tasks</h2>
          <div className="mt-4">
            <TaskList tasks={upcomingTasks} />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
