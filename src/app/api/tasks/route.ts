import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import {
  createTask,
  filterTasks,
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

    // Parse filter parameters
    const status = searchParams.getAll("status")
    const priority = searchParams.getAll("priority")
    const assigneeId = searchParams.getAll("assigneeId")
    const tags = searchParams.getAll("tags")
    const search = searchParams.get("search") || undefined
    const sortBy = searchParams.get("sortBy") || undefined
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    // Parse date filters
    const dueDateStart = searchParams.get("dueDateStart")
    const dueDateEnd = searchParams.get("dueDateEnd")
    const dueDate = dueDateStart || dueDateEnd ? {
      start: dueDateStart ? new Date(dueDateStart) : undefined,
      end: dueDateEnd ? new Date(dueDateEnd) : undefined,
    } : undefined

    // Parse custom fields
    const customFieldsParam = searchParams.get("customFields")
    const customFields = customFieldsParam ? JSON.parse(customFieldsParam) : undefined

    // Parse dependencies
    const dependencyType = searchParams.get("dependencyType")
    const dependencyTaskId = searchParams.get("dependencyTaskId")
    const dependencies = dependencyType && dependencyTaskId ? {
      type: dependencyType,
      taskId: dependencyTaskId,
    } : undefined

    const result = await filterTasks(projectId, {
      status,
      priority,
      assigneeId,
      dueDate,
      tags,
      search,
      customFields,
      dependencies,
      sortBy,
      sortOrder,
      page,
      pageSize,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error filtering tasks:", error)
    return new NextResponse(null, { status: 500 })
  }
}
