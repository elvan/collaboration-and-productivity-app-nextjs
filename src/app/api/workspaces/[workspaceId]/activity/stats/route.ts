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
    const days = parseInt(searchParams.get("days") || "30")
    const userId = searchParams.get("userId")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

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

    // Get activity stats
    const [activityByType, dailyActivity, topUsers] = await Promise.all([
      // Activity by type
      prisma.activity.groupBy({
        by: ["type", "entityType"],
        where: {
          workspaceId: params.workspaceId,
          ...(userId && { userId }),
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }),

      // Daily activity
      prisma.activity.groupBy({
        by: ["createdAt"],
        where: {
          workspaceId: params.workspaceId,
          ...(userId && { userId }),
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }),

      // Top users
      prisma.activity.groupBy({
        by: ["userId"],
        where: {
          workspaceId: params.workspaceId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 5,
      }).then(async (users) => {
        // Get user details for top users
        const userDetails = await prisma.user.findMany({
          where: {
            id: {
              in: users.map((u) => u.userId),
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        })

        return users.map((user) => ({
          ...user,
          user: userDetails.find((u) => u.id === user.userId),
        }))
      }),
    ])

    return NextResponse.json({
      activityByType,
      dailyActivity,
      topUsers,
    })
  } catch (error) {
    console.error("Failed to get activity stats:", error)
    return new NextResponse(null, { status: 500 })
  }
}
