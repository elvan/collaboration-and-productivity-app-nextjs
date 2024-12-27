import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  createDependency,
  updateDependency,
  deleteDependency,
  getTaskDependencies,
} from "@/lib/tasks/task-dependency-service"

const dependencySchema = z.object({
  sourceTaskId: z.string(),
  targetTaskId: z.string(),
  type: z.enum([
    "blocks",
    "blocked_by",
    "depends_on",
    "required_for",
    "related_to",
    "duplicates",
    "duplicated_by",
  ]),
  metadata: z
    .object({
      description: z.string().optional(),
      delay: z.number().optional(),
      progress: z.number().optional(),
      status: z.string().optional(),
    })
    .optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const taskId = params.taskId
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!task || !task.project.members.length) {
      return new NextResponse("Not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = dependencySchema.parse(body)

    const dependency = await createDependency(validatedData)
    return NextResponse.json(dependency)
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const taskId = params.taskId
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!task || !task.project.members.length) {
      return new NextResponse("Not found", { status: 404 })
    }

    const dependencies = await getTaskDependencies(taskId)
    return NextResponse.json(dependencies)
  } catch (error) {
    console.error("Failed to fetch task dependencies:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
