import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon, Briefcase, CheckCircle, Clock, MessageSquare, Bell } from "lucide-react"
import { ProjectCard } from "@/components/dashboard/project-card"
import { TaskList } from "@/components/dashboard/task-list"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { redirect } from 'next/navigation';

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
            workspaceMembers: {
              some: {
                userId,
              },
            },
          },
        },
      },
    },
  });

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
      type: 'comment',
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Task Due Soon",
      message: "Project proposal due in 2 hours",
      time: "3 hours ago",
      read: true,
      type: 'task',
      createdAt: new Date(),
    },
    {
      id: "3",
      title: "Meeting Reminder",
      message: "Team standup in 30 minutes",
      time: "4 hours ago",
      read: false,
      type: 'meeting',
      createdAt: new Date(),
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Dashboard"
          text="Welcome back! Here's an overview of your workspace."
        />
        <Button className="bg-primary hover:bg-primary/90">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<Briefcase className="h-4 w-4 text-blue-500" />}
          trend={"+5%"}
          className="bg-card hover:shadow-md transition-shadow"
        />
        <StatsCard
          title="Due Tasks"
          value={stats.dueTasks}
          description="Tasks due in next 24 hours"
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          trend={"-2%"}
          className="bg-card hover:shadow-md transition-shadow"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          trend={"+12%"}
          className="bg-card hover:shadow-md transition-shadow"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          <QuickActions notifications={notifications} />

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-lg font-semibold">Recent Notifications</h3>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 text-sm">
                  <div className="rounded-full bg-primary/10 p-2">
                    {notification.type === 'comment' ? (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Bell className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-muted-foreground">{notification.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
              <Button variant="outline" size="sm">View Calendar</Button>
            </div>
            <TaskList tasks={upcomingTasks} />
          </div>
          <CalendarView tasks={upcomingTasks} />
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  )
}
