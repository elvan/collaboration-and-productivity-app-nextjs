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

    const roadmapItems = await prisma.projectRoadmap.findMany({
      where: {
        projectId: params.projectId,
      },
      include: {
        milestones: true,
        dependencies: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(roadmapItems)
  } catch (error) {
    console.error("[ROADMAP_GET]", error)
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
    const { title, description, startDate, endDate, dependencies } = body

    const roadmapItem = await prisma.projectRoadmap.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        projectId: params.projectId,
        createdById: session.user.id,
        dependencies: {
          connect: dependencies?.map((id: string) => ({ id })),
        },
      },
      include: {
        milestones: true,
        dependencies: true,
      },
    })

    return NextResponse.json(roadmapItem)
  } catch (error) {
    console.error("[ROADMAP_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
