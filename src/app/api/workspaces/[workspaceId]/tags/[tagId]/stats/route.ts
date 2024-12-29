import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: { workspaceId: string; tagId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check workspace access and tag ownership
    const tag = await prisma.tag.findFirst({
      where: {
        id: params.tagId,
        workspace: {
          id: params.workspaceId,
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
    })

    if (!tag) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Get tag statistics
    const [
      projectCount,
      folderCount,
      templateCount,
      childrenCount,
      recentActivity,
    ] = await Promise.all([
      // Count projects with this tag
      prisma.project.count({
        where: {
          tags: {
            some: {
              id: params.tagId,
            },
          },
          workspaceId: params.workspaceId,
        },
      }),

      // Count folders with this tag
      prisma.folder.count({
        where: {
          tags: {
            some: {
              id: params.tagId,
            },
          },
          workspaceId: params.workspaceId,
        },
      }),

      // Count templates with this tag
      prisma.folderTemplate.count({
        where: {
          tags: {
            some: {
              id: params.tagId,
            },
          },
          workspaceId: params.workspaceId,
        },
      }),

      // Count child tags
      prisma.tag.count({
        where: {
          parentId: params.tagId,
          workspaceId: params.workspaceId,
        },
      }),

      // Get recent activity
      prisma.activity.findMany({
        where: {
          entityType: "tag",
          entityId: params.tagId,
          workspaceId: params.workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
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
    ])

    // Get usage trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const usageTrend = await prisma.activity.groupBy({
      by: ["createdAt"],
      where: {
        entityType: "tag",
        entityId: params.tagId,
        workspaceId: params.workspaceId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    })

    return NextResponse.json({
      stats: {
        projectCount,
        folderCount,
        templateCount,
        childrenCount,
        totalItems: projectCount + folderCount + templateCount,
      },
      recentActivity,
      usageTrend,
    })
  } catch (error) {
    console.error("Failed to get tag stats:", error)
    return new NextResponse(null, { status: 500 })
  }
}
