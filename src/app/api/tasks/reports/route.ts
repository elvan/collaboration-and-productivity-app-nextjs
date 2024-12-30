import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const assigneeId = searchParams.get("assigneeId")

    const where = {
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    const [tasks, taskStats, timeStats] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.timeEntry.groupBy({
        by: ["taskId"],
        where: {
          task: where,
        },
        _sum: {
          duration: true,
        },
      }),
    ])

    return NextResponse.json({
      tasks,
      taskStats,
      timeStats,
    })
  } catch (error) {
    console.error("[TASKS_REPORTS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, description, filters, schedule } = body

    const report = await prisma.taskReport.create({
      data: {
        name,
        description,
        filters,
        schedule,
        userId: session.user.id,
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("[TASKS_REPORTS_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
