import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const ITEMS_PER_PAGE = 10

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Parse query parameters
    const url = new URL(req.url)
    const query = url.searchParams.get("query") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const entityType = url.searchParams.get("entityType")
    const authorId = url.searchParams.get("authorId")
    const mentionId = url.searchParams.get("mentionId")
    const sortField = url.searchParams.get("sortField") || "relevance"
    const sortDirection = url.searchParams.get("sortDirection") || "desc"
    const dateStart = url.searchParams.get("dateStart")
    const dateEnd = url.searchParams.get("dateEnd")

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

    // Build search conditions
    const whereConditions: any = {
      workspaceId: params.workspaceId,
      OR: [
        {
          content: {
            search: query,
          },
        },
        {
          mentions: {
            some: {
              user: {
                name: {
                  search: query,
                },
              },
            },
          },
        },
      ],
    }

    // Add filters
    if (entityType) {
      whereConditions.entityType = entityType
    }

    if (authorId) {
      whereConditions.authorId = authorId
    }

    if (mentionId) {
      whereConditions.mentions = {
        some: {
          userId: mentionId,
        },
      }
    }

    if (dateStart || dateEnd) {
      whereConditions.createdAt = {}
      if (dateStart) {
        whereConditions.createdAt.gte = new Date(dateStart)
      }
      if (dateEnd) {
        whereConditions.createdAt.lte = new Date(dateEnd)
      }
    }

    // Build sort conditions
    let orderBy: any = {}
    if (sortField === "relevance") {
      orderBy = {
        _relevance: {
          fields: ["content"],
          search: query,
          sort: sortDirection,
        },
      }
    } else {
      orderBy[sortField] = sortDirection
    }

    // Perform search with pagination
    const [results, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereConditions,
        orderBy,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          mentions: {
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
          reactions: {
            select: {
              type: true,
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
          entity: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: whereConditions,
      }),
    ])

    // Transform results
    const transformedResults = results.map((result) => ({
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      entityType: result.entityType,
      entityId: result.entityId,
      entityName: result.entity.name,
      author: result.author,
      mentions: result.mentions.map((mention) => mention.user),
      reactions: result.reactions.map((reaction) => ({
        type: reaction.type,
        count: reaction._count.users,
      })),
    }))

    return NextResponse.json({
      results: transformedResults,
      hasMore: (page * ITEMS_PER_PAGE) < totalCount,
      total: totalCount,
    })
  } catch (error) {
    console.error("Failed to search comments:", error)
    return new NextResponse(null, { status: 500 })
  }
}
