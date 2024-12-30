import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const category = searchParams.get("category")

    const where = {
      ...(projectId && { projectId }),
      ...(category && { category }),
    }

    const templates = await prisma.taskTemplate.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("[TASK_TEMPLATES]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, description, category, projectId, fields } = body

    const template = await prisma.taskTemplate.create({
      data: {
        name,
        description,
        category,
        projectId,
        fields,
        createdById: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("[TASK_TEMPLATES_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
