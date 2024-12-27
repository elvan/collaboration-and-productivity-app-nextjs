import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import {
  createTask,
  getTasks,
  TaskCreateInput,
} from "@/lib/tasks"

const taskCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = taskCreateSchema.parse(json)

    const task = await createTask(
      {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      } as TaskCreateInput,
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    
    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 })
    }

    const status = searchParams.get("status") || undefined
    const priority = searchParams.get("priority") || undefined
    const assigneeId = searchParams.get("assigneeId") || undefined
    const search = searchParams.get("search") || undefined
    const sortBy = searchParams.get("sortBy") || undefined
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"

    const result = await getTasks(projectId, {
      status,
      priority,
      assigneeId,
      search,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
