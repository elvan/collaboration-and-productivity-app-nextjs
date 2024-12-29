import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface TagScore {
  tagId: string
  score: number
  reason: string
  cooccurringTags?: string[]
  similarItems?: {
    id: string
    name: string
    type: "project" | "folder"
  }[]
}

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
    const itemId = searchParams.get("itemId")
    const itemType = searchParams.get("itemType")
    const currentTags = searchParams.get("currentTags")?.split(",") || []

    if (!itemId || !itemType) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

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

    // Get all workspace tags except current ones
    const availableTags = await prisma.tag.findMany({
      where: {
        workspaceId: params.workspaceId,
        id: {
          notIn: currentTags,
        },
      },
    })

    const tagScores: Map<string, TagScore> = new Map()

    // Initialize scores
    availableTags.forEach((tag) => {
      tagScores.set(tag.id, {
        tagId: tag.id,
        score: 0,
        reason: "default",
      })
    })

    // Calculate scores based on different factors
    await Promise.all([
      // 1. Co-occurrence analysis
      (async () => {
        if (currentTags.length > 0) {
          const cooccurrences = await prisma.$transaction(async (tx) => {
            const projectCooccurrences = await tx.projectTag.groupBy({
              by: ["tagId"],
              where: {
                project: {
                  workspaceId: params.workspaceId,
                  projectTags: {
                    some: {
                      tagId: {
                        in: currentTags,
                      },
                    },
                  },
                },
                tagId: {
                  notIn: currentTags,
                },
              },
              _count: true,
            })

            const folderCooccurrences = await tx.folderTag.groupBy({
              by: ["tagId"],
              where: {
                folder: {
                  workspaceId: params.workspaceId,
                  folderTags: {
                    some: {
                      tagId: {
                        in: currentTags,
                      },
                    },
                  },
                },
                tagId: {
                  notIn: currentTags,
                },
              },
              _count: true,
            })

            return [...projectCooccurrences, ...folderCooccurrences]
          })

          cooccurrences.forEach((cooc) => {
            const currentScore = tagScores.get(cooc.tagId)
            if (currentScore) {
              currentScore.score += cooc._count * 0.3 // Weight for co-occurrence
              currentScore.reason = "cooccurrence"

              // Get co-occurring tag names
              const cooccurringTags = availableTags
                .filter((tag) => currentTags.includes(tag.id))
                .map((tag) => tag.name)
              currentScore.cooccurringTags = cooccurringTags
            }
          })
        }
      })(),

      // 2. Similar items analysis
      (async () => {
        const similarItems = await prisma.$transaction(async (tx) => {
          if (itemType === "project") {
            const project = await tx.project.findUnique({
              where: { id: itemId },
              select: { name: true },
            })

            if (!project) return []

            return await tx.project.findMany({
              where: {
                workspaceId: params.workspaceId,
                id: { not: itemId },
                name: {
                  contains: project.name,
                  mode: "insensitive",
                },
              },
              include: {
                projectTags: {
                  include: {
                    tag: true,
                  },
                },
              },
              take: 5,
            })
          } else {
            const folder = await tx.folder.findUnique({
              where: { id: itemId },
              select: { name: true },
            })

            if (!folder) return []

            return await tx.folder.findMany({
              where: {
                workspaceId: params.workspaceId,
                id: { not: itemId },
                name: {
                  contains: folder.name,
                  mode: "insensitive",
                },
              },
              include: {
                folderTags: {
                  include: {
                    tag: true,
                  },
                },
              },
              take: 5,
            })
          }
        })

        similarItems.forEach((item) => {
          const tags =
            itemType === "project"
              ? (item as any).projectTags
              : (item as any).folderTags

          tags.forEach((tagRelation: any) => {
            const tag = tagRelation.tag
            if (!currentTags.includes(tag.id)) {
              const currentScore = tagScores.get(tag.id)
              if (currentScore) {
                currentScore.score += 0.2 // Weight for similar items
                currentScore.reason = "similar_items"
                if (!currentScore.similarItems) {
                  currentScore.similarItems = []
                }
                currentScore.similarItems.push({
                  id: item.id,
                  name: item.name,
                  type: itemType,
                })
              }
            }
          })
        })
      })(),
    ])

    // Convert scores to array and sort
    const sortedRecommendations = Array.from(tagScores.values())
      .filter((score) => score.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Get top 5 recommendations

    // Combine with tag data
    const recommendations = await Promise.all(
      sortedRecommendations.map(async (score) => {
        const tag = await prisma.tag.findUnique({
          where: { id: score.tagId },
        })
        return {
          tag,
          score: score.score,
          reason: score.reason,
          cooccurringTags: score.cooccurringTags,
          similarItems: score.similarItems,
        }
      })
    )

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Failed to get tag recommendations:", error)
    return new NextResponse(null, { status: 500 })
  }
}
