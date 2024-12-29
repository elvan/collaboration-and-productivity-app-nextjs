import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon, Briefcase, CheckCircle, Clock } from "lucide-react"
import { redirect } from "next/navigation"
import { ProjectCard } from "@/components/dashboard/project-card"
import { TaskList } from "@/components/dashboard/task-list"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { QuickActions } from "@/components/dashboard/quick-actions"

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
      assignees: {
        some: {
          userId: userId
        }
      },
      status: { not: "completed" },
      dueDate: {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due within 24 hours
      }
    }
  })

  const completedTasks = await prisma.task.count({
    where: {
      assignees: {
        some: {
          userId: userId
        }
      },
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
      assignees: {
        some: {
          userId: userId
        }
      },
      status: { not: "completed" },
      dueDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
    include: {
      project: true,
    },
  })
}

async function getRecentActivities(userId: string) {
  return await prisma.activity.findMany({
    where: {
      userId: userId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });
}

async function getNotifications(userId: string) {
  // For now, return mock notifications
  return [
    {
      id: "1",
      title: "New Comment",
      message: "John commented on your task",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      title: "Task Due Soon",
      message: "Project proposal due in 2 hours",
      time: "3 hours ago",
      read: true,
    },
    {
      id: "3",
      title: "Meeting Reminder",
      message: "Team standup in 30 minutes",
      time: "4 hours ago",
      read: false,
    },
  ]
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth")
  }

  const [stats, recentProjects, upcomingTasks, activities, notifications] = await Promise.all([
    getProjectStats(session.user.id),
    getRecentProjects(session.user.id),
    getUpcomingTasks(session.user.id),
    getRecentActivities(session.user.id),
    getNotifications(session.user.id),
  ])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your workspace."
      >
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatsCard
          title="Due Tasks"
          value={stats.dueTasks}
          description="Tasks due in next 24 hours"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <h2 className="mb-4 text-2xl font-bold">Recent Projects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="col-span-3">
          <QuickActions notifications={notifications} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TaskList tasks={upcomingTasks} />
        <div className="space-y-4">
          <CalendarView tasks={upcomingTasks} />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </DashboardShell>
  )
}
