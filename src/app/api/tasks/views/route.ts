import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { prisma } from "@/lib/prisma"

const viewCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  viewType: z.string(),
  projectId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = viewCreateSchema.parse(json)

    const view = await prisma.taskList.create({
      data: {
        ...body,
        viewSettings: JSON.stringify({
          visibleColumns: ["title", "status", "priority", "assignee", "dueDate"],
          filters: [],
          autoRefresh: false,
          refreshInterval: 30,
        }),
      },
    })

    return NextResponse.json(view)
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

    const views = await prisma.taskList.findMany({
      where: projectId
        ? {
            projectId,
            project: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          }
        : {
            project: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(views)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
