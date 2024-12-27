import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
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

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.project.delete({
      where: {
        id: params.projectId,
      },
    })

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
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["active", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }).parse(json)

    // Check if user owns the project or is a member
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
    })

    if (!project) {
      return new NextResponse("Not found", { status: 404 })
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
