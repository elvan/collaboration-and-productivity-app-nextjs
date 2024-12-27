import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const json = await req.json()
    const body = projectSchema.parse(json)

    // Get user's workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("No workspace found", { status: 404 })
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        priority: body.priority,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: "active",
        workspace: { connect: { id: workspace.id } },
        owner: { connect: { id: session.user.id } },
        members: { connect: [{ id: session.user.id }] },
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

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
