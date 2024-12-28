import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import {
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  updateTaskPriority,
  TaskUpdateInput,
} from "@/lib/tasks/tasks"

const taskUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const task = await getTask(params.taskId)
    if (!task) {
      return new NextResponse("Task not found", { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = taskUpdateSchema.parse(json)

    const task = await updateTask(
      params.taskId,
      {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      } as TaskUpdateInput,
      session.user.id
    )

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const task = await deleteTask(params.taskId, session.user.id)
    return NextResponse.json(task)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

// PUT /api/tasks/[taskId]/assign
export async function PUT(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { action, value } = json

    let task

    switch (action) {
      case "assign":
        task = await assignTask(params.taskId, value, session.user.id)
        break
      case "status":
        task = await updateTaskStatus(params.taskId, value, session.user.id)
        break
      case "priority":
        task = await updateTaskPriority(params.taskId, value, session.user.id)
        break
      default:
        return new NextResponse("Invalid action", { status: 400 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
