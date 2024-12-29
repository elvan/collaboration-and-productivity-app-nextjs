import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        workspaceId: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        tasks: {
          include: {
            assignee: true,
            status: true,
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Calculate analytics
    const completedTasks = project.tasks.filter((task) => task.completedAt)
    const totalCompletionTime = completedTasks.reduce((total, task) => {
      if (task.completedAt && task.createdAt) {
        const completionTime =
          new Date(task.completedAt).getTime() -
          new Date(task.createdAt).getTime()
        return total + completionTime
      }
      return total
    }, 0)

    const averageCompletionTime =
      completedTasks.length > 0
        ? totalCompletionTime / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
        : null

    // Update project analytics
    const analytics = await prisma.projectAnalytics.upsert({
      where: {
        projectId: params.projectId,
      },
      create: {
        projectId: params.projectId,
        totalTasks: project.tasks.length,
        completedTasks: completedTasks.length,
        averageCompletionTime,
      },
      update: {
        totalTasks: project.tasks.length,
        completedTasks: completedTasks.length,
        averageCompletionTime,
      },
    })

    return NextResponse.json(analytics)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
