import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivity } from "@/lib/activity"

const routeContextSchema = z.object({
  params: z.object({
    taskId: z.string(),
  }),
})

export async function DELETE(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if user is a member of the project that contains this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } },
          ],
        },
      },
      include: {
        project: true,
      },
    })

    if (!task) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.task.delete({
      where: {
        id: params.taskId,
      },
    })

    // Create activity for task deletion
    await createActivity(
      "task_deleted",
      {
        taskTitle: task.title,
        taskId: task.id,
      },
      task.projectId,
      session.user.id
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const json = await req.json()
    const body = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      assignedToId: z.string().optional(),
      dueDate: z.string().datetime().optional(),
    }).parse(json)

    // Check if user is a member of the project that contains this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } },
          ],
        },
      },
      include: {
        project: true,
      },
    })

    if (!task) {
      return new NextResponse("Not found", { status: 404 })
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: params.taskId,
      },
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        assignedTo: body.assignedToId
          ? { connect: { id: body.assignedToId } }
          : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Create activity for task update
    if (body.status === "completed") {
      await createActivity(
        "task_completed",
        {
          taskTitle: updatedTask.title,
          taskId: updatedTask.id,
        },
        task.projectId,
        session.user.id
      )
    } else if (body.assignedToId && body.assignedToId !== task.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignedToId },
        select: { name: true, email: true },
      })
      await createActivity(
        "task_assigned",
        {
          taskTitle: updatedTask.title,
          taskId: updatedTask.id,
          assigneeName: assignee?.name || assignee?.email,
          assigneeId: body.assignedToId,
        },
        task.projectId,
        session.user.id
      )
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
