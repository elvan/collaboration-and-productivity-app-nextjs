import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskViewsClient } from "@/components/tasks/task-views-client"

export const metadata: Metadata = {
  title: "Task Views | CollabSpace",
  description: "Manage and customize your task views",
}

export default async function TaskViewsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const views = await prisma.taskList.findMany({
    where: {
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
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return <TaskViewsClient views={views} userId={session.user.id} />
}
