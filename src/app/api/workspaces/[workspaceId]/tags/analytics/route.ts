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

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get tag usage stats
    const [usage, trend, distribution, cooccurrence] = await Promise.all([
      // Overall tag usage
      prisma.tag.findMany({
        where: {
          workspaceId: params.workspaceId,
        },
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              projectTags: true,
              folderTags: true,
            },
          },
        },
        orderBy: {
          projectTags: {
            _count: "desc",
          },
        },
      }).then((tags) =>
        tags.map((tag) => ({
          tagId: tag.id,
          tagName: tag.name,
          color: tag.color,
          count: tag._count.projectTags + tag._count.folderTags,
        }))
      ),

      // Tag usage trend
      prisma.activity.groupBy({
        by: ["createdAt", "details"],
        where: {
          workspaceId: params.workspaceId,
          type: "add_tag",
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }).then((activities) =>
        activities.map((activity) => ({
          date: activity.createdAt.toISOString(),
          tagId: activity.details?.tagId as string,
          tagName: activity.details?.tagName as string,
          count: activity._count,
        }))
      ),

      // Tag distribution by entity type
      prisma.activity.groupBy({
        by: ["entityType", "details"],
        where: {
          workspaceId: params.workspaceId,
          type: "add_tag",
        },
        _count: true,
      }).then((activities) =>
        activities.map((activity) => ({
          entityType: activity.entityType,
          tagId: activity.details?.tagId as string,
          tagName: activity.details?.tagName as string,
          count: activity._count,
        }))
      ),

      // Tag co-occurrence
      prisma.$queryRaw`
        WITH tag_pairs AS (
          SELECT 
            t1.id as tag1_id,
            t1.name as tag1_name,
            t2.id as tag2_id,
            t2.name as tag2_name,
            COUNT(*) as count
          FROM "ProjectTag" pt1
          JOIN "Tag" t1 ON pt1.tag_id = t1.id
          JOIN "ProjectTag" pt2 ON pt1.project_id = pt2.project_id
          JOIN "Tag" t2 ON pt2.tag_id = t2.id
          WHERE t1.workspace_id = ${params.workspaceId}
            AND t2.workspace_id = ${params.workspaceId}
            AND t1.id < t2.id
          GROUP BY t1.id, t1.name, t2.id, t2.name
          HAVING COUNT(*) > 1
        )
        SELECT * FROM tag_pairs
        ORDER BY count DESC
        LIMIT 20
      ` as Promise<
        {
          tag1_id: string
          tag1_name: string
          tag2_id: string
          tag2_name: string
          count: number
        }[]
      >,
    ])

    return NextResponse.json({
      usage,
      trend,
      distribution,
      cooccurrence: cooccurrence.map((item) => ({
        tag1Id: item.tag1_id,
        tag1Name: item.tag1_name,
        tag2Id: item.tag2_id,
        tag2Name: item.tag2_name,
        count: Number(item.count),
      })),
    })
  } catch (error) {
    console.error("Failed to get tag analytics:", error)
    return new NextResponse(null, { status: 500 })
  }
}
