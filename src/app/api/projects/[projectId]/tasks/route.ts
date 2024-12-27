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

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedToId: z.string().optional(),
  dueDate: z.string().datetime(),
})

export async function POST(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if user is a member of the project
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
      return new NextResponse("Project not found", { status: 404 })
    }

    const json = await req.json()
    const body = taskSchema.parse(json)

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: "in_progress",
        dueDate: new Date(body.dueDate),
        project: { connect: { id: params.projectId } },
        assignedTo: body.assignedToId
          ? { connect: { id: body.assignedToId } }
          : undefined,
        createdBy: { connect: { id: session.user.id } },
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

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
