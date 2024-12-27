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

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: { projectId: string; listId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId, listId } = params
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

    const taskList = await prisma.taskList.findUnique({
      where: { id: listId },
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

    if (!taskList || taskList.projectId !== projectId) {
      return new NextResponse("Not found", { status: 404 })
    }

    const formattedTaskList = {
      ...taskList,
      sortOrder: taskList.sortOrder
        ? JSON.parse(taskList.sortOrder as string)
        : null,
      filters: taskList.filters
        ? JSON.parse(taskList.filters as string)
        : null,
      viewSettings: taskList.viewSettings
        ? JSON.parse(taskList.viewSettings as string)
        : null,
    }

    return NextResponse.json(formattedTaskList)
  } catch (error) {
    console.error("Failed to fetch task list:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: { projectId: string; listId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId, listId } = params
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

    const taskList = await prisma.taskList.findUnique({
      where: { id: listId },
    })

    if (!taskList || taskList.projectId !== projectId) {
      return new NextResponse("Not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = taskListSchema.parse(body)

    const updatedTaskList = await prisma.taskList.update({
      where: { id: listId },
      data: {
        ...validatedData,
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

    return NextResponse.json(updatedTaskList)
  } catch (error) {
    console.error("Failed to update task list:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: { projectId: string; listId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId, listId } = params
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

    const taskList = await prisma.taskList.findUnique({
      where: { id: listId },
    })

    if (!taskList || taskList.projectId !== projectId) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.taskList.delete({
      where: { id: listId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete task list:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
