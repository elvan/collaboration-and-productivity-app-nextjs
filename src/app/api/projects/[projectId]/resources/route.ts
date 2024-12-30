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

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const [resources, allocations] = await Promise.all([
      prisma.projectResource.findMany({
        where: {
          projectId: params.projectId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.resourceAllocation.findMany({
        where: {
          projectId: params.projectId,
          ...(startDate && endDate && {
            startDate: {
              gte: new Date(startDate),
            },
            endDate: {
              lte: new Date(endDate),
            },
          }),
        },
        include: {
          resource: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          task: true,
        },
      }),
    ])

    return NextResponse.json({ resources, allocations })
  } catch (error) {
    console.error("[RESOURCES_GET]", error)
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
    const { userId, role, availability, startDate, endDate } = body

    const resource = await prisma.projectResource.create({
      data: {
        projectId: params.projectId,
        userId,
        role,
        availability,
        startDate,
        endDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error("[RESOURCE_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
