import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const userId = searchParams.get("userId")
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            status: "active",
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Build where clause
    const where = {
      workspaceId: params.workspaceId,
      ...(userId && { userId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    }

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
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
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      total,
      hasMore: total > offset + limit,
    })
  } catch (error) {
    console.error("Failed to get activities:", error)
    return new NextResponse(null, { status: 500 })
  }
}
