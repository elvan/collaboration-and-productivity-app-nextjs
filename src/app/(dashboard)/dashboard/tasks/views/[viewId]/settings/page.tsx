import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskViewSettings } from "@/components/tasks/task-view-settings"

export const metadata: Metadata = {
  title: "View Settings | CollabSpace",
  description: "Configure your task view settings",
}

interface TaskViewSettingsPageProps {
  params: {
    viewId: string
  }
}

export default async function TaskViewSettingsPage({
  params,
}: TaskViewSettingsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const view = await prisma.taskList.findFirst({
    where: {
      id: params.viewId,
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          taskTypes: true,
          taskStatuses: true,
          taskPriorities: true,
          labels: true,
        },
      },
    },
  })

  if (!view) {
    notFound()
  }

  return <TaskViewSettings view={view} userId={session.user.id} />
}
