import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  updateDependency,
  deleteDependency,
} from "@/lib/tasks/task-dependency-service"

const dependencyUpdateSchema = z.object({
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

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: { taskId: string; dependencyId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { taskId, dependencyId } = params
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

    const dependency = await prisma.taskRelationship.findUnique({
      where: { id: dependencyId },
    })

    if (!dependency || dependency.sourceTaskId !== taskId) {
      return new NextResponse("Not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = dependencyUpdateSchema.parse(body)

    const updatedDependency = await updateDependency(dependencyId, validatedData)
    return NextResponse.json(updatedDependency)
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: { taskId: string; dependencyId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { taskId, dependencyId } = params
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

    const dependency = await prisma.taskRelationship.findUnique({
      where: { id: dependencyId },
    })

    if (!dependency || dependency.sourceTaskId !== taskId) {
      return new NextResponse("Not found", { status: 404 })
    }

    await deleteDependency(dependencyId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete dependency:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
