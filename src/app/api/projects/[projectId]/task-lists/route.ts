import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const taskListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.array(z.string()).optional(),
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      priority: z.array(z.string()).optional(),
      assignee: z.array(z.string()).optional(),
      dueDate: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
      customFields: z.record(z.any()).optional(),
    })
    .optional(),
  viewSettings: z
    .object({
      groupBy: z.string().optional(),
      sortBy: z.string().optional(),
      sortDirection: z.enum(["asc", "desc"]).optional(),
      showSubtasks: z.boolean().optional(),
      showCompletedTasks: z.boolean().optional(),
      columns: z.array(z.string()).optional(),
    })
    .optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = params.projectId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!project || !project.members.length) {
      return new NextResponse("Not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = taskListSchema.parse(body)

    const taskList = await prisma.taskList.create({
      data: {
        ...validatedData,
        projectId,
        sortOrder: validatedData.sortOrder
          ? JSON.stringify(validatedData.sortOrder)
          : null,
        filters: validatedData.filters
          ? JSON.stringify(validatedData.filters)
          : null,
        viewSettings: validatedData.viewSettings
          ? JSON.stringify(validatedData.viewSettings)
          : null,
      },
      include: {
        tasks: {
          include: {
            assignee: true,
            customFieldValues: {
              include: {
                customField: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(taskList)
  } catch (error) {
    console.error("Failed to create task list:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = params.projectId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!project || !project.members.length) {
      return new NextResponse("Not found", { status: 404 })
    }

    const taskLists = await prisma.taskList.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            assignee: true,
            customFieldValues: {
              include: {
                customField: true,
              },
            },
          },
        },
      },
    })

    const formattedTaskLists = taskLists.map((list) => ({
      ...list,
      sortOrder: list.sortOrder ? JSON.parse(list.sortOrder as string) : null,
      filters: list.filters ? JSON.parse(list.filters as string) : null,
      viewSettings: list.viewSettings
        ? JSON.parse(list.viewSettings as string)
        : null,
    }))

    return NextResponse.json(formattedTaskLists)
  } catch (error) {
    console.error("Failed to fetch task lists:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
