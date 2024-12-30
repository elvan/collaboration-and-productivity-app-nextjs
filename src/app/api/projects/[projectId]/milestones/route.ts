import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const milestones = await prisma.projectMilestone.findMany({
      where: {
        projectId: params.projectId,
      },
      include: {
        tasks: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json(milestones)
  } catch (error) {
    console.error("[MILESTONES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, description, dueDate, assignedToId } = body

    const milestone = await prisma.projectMilestone.create({
      data: {
        title,
        description,
        dueDate,
        projectId: params.projectId,
        createdById: session.user.id,
        assignedToId,
      },
      include: {
        tasks: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error("[MILESTONE_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
