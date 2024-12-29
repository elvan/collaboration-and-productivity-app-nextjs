import { PrismaClient } from "@prisma/client"
import { cosineDistance } from "./utils/vector-math"

const prisma = new PrismaClient()

interface TagScore {
  id: string
  score: number
  reasons: {
    type: "similar_content" | "co_occurrence" | "user_pattern" | "popularity"
    description: string
    score: number
  }[]
}

export class TagRecommendationEngine {
  static async getRecommendations(params: {
    workspaceId: string
    entityId: string
    entityType: string
    currentTags: string[]
    userId: string
  }): Promise<TagScore[]> {
    const { workspaceId, entityId, entityType, currentTags, userId } = params

    // Get all workspace tags except current ones
    const availableTags = await prisma.tag.findMany({
      where: {
        workspaceId,
        id: {
          notIn: currentTags,
        },
      },
    })

    if (availableTags.length === 0) {
      return []
    }

    // Calculate different types of scores
    const [
      contentScores,
      coOccurrenceScores,
      userPatternScores,
      popularityScores,
    ] = await Promise.all([
      this.calculateContentSimilarityScores(
        workspaceId,
        entityId,
        entityType,
        availableTags
      ),
      this.calculateCoOccurrenceScores(workspaceId, currentTags, availableTags),
      this.calculateUserPatternScores(workspaceId, userId, availableTags),
      this.calculatePopularityScores(workspaceId, availableTags),
    ])

    // Combine scores with weights
    const weights = {
      content: 0.4,
      coOccurrence: 0.3,
      userPattern: 0.2,
      popularity: 0.1,
    }

    const combinedScores = availableTags.map((tag) => {
      const contentScore = contentScores.get(tag.id) || 0
      const coOccurrenceScore = coOccurrenceScores.get(tag.id) || 0
      const userPatternScore = userPatternScores.get(tag.id) || 0
      const popularityScore = popularityScores.get(tag.id) || 0

      const totalScore =
        contentScore * weights.content +
        coOccurrenceScore * weights.coOccurrence +
        userPatternScore * weights.userPattern +
        popularityScore * weights.popularity

      const reasons = []

      if (contentScore > 0) {
        reasons.push({
          type: "similar_content" as const,
          description: "Based on content similarity",
          score: contentScore,
        })
      }

      if (coOccurrenceScore > 0) {
        reasons.push({
          type: "co_occurrence" as const,
          description: "Often used together with your current tags",
          score: coOccurrenceScore,
        })
      }

      if (userPatternScore > 0) {
        reasons.push({
          type: "user_pattern" as const,
          description: "Based on your tagging patterns",
          score: userPatternScore,
        })
      }

      if (popularityScore > 0) {
        reasons.push({
          type: "popularity" as const,
          description: "Popular in similar contexts",
          score: popularityScore,
        })
      }

      return {
        id: tag.id,
        score: totalScore,
        reasons,
      }
    })

    // Sort by score and return top recommendations
    return combinedScores
      .filter((score) => score.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  private static async calculateContentSimilarityScores(
    workspaceId: string,
    entityId: string,
    entityType: string,
    availableTags: any[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()

    // Get entity content vector (implementation depends on your vector storage)
    const entityVector = await this.getEntityVector(entityId, entityType)
    if (!entityVector) return scores

    // Get tag vectors and calculate similarity
    for (const tag of availableTags) {
      const tagVector = await this.getTagVector(tag.id)
      if (tagVector) {
        const similarity = 1 - cosineDistance(entityVector, tagVector)
        if (similarity > 0.5) {
          scores.set(tag.id, similarity)
        }
      }
    }

    return scores
  }

  private static async calculateCoOccurrenceScores(
    workspaceId: string,
    currentTags: string[],
    availableTags: any[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()
    if (currentTags.length === 0) return scores

    // Calculate co-occurrence frequencies
    const coOccurrences = await prisma.$queryRaw`
      WITH tag_pairs AS (
        SELECT 
          t1.id as tag1_id,
          t2.id as tag2_id,
          COUNT(*) as pair_count
        FROM 
          "_TagToEntity" te1
          JOIN "_TagToEntity" te2 ON te1."B" = te2."B"
          JOIN "Tag" t1 ON te1."A" = t1.id
          JOIN "Tag" t2 ON te2."A" = t2.id
        WHERE 
          t1.id != t2.id
          AND t1."workspaceId" = ${workspaceId}
          AND t2."workspaceId" = ${workspaceId}
          AND t1.id = ANY(${currentTags})
        GROUP BY 
          t1.id, t2.id
      )
      SELECT 
        tag2_id,
        SUM(pair_count) as total_count
      FROM 
        tag_pairs
      GROUP BY 
        tag2_id
    `

    // Normalize scores
    const maxCount = Math.max(
      ...coOccurrences.map((co: any) => Number(co.total_count))
    )
    if (maxCount > 0) {
      for (const co of coOccurrences) {
        scores.set(co.tag2_id, Number(co.total_count) / maxCount)
      }
    }

    return scores
  }

  private static async calculateUserPatternScores(
    workspaceId: string,
    userId: string,
    availableTags: any[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()

    // Get user's recent tagging patterns
    const userPatterns = await prisma.activity.groupBy({
      by: ["entityId"],
      where: {
        type: "add_tag",
        userId,
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: true,
    })

    // Normalize scores
    const maxCount = Math.max(...userPatterns.map((p) => p._count))
    if (maxCount > 0) {
      for (const pattern of userPatterns) {
        scores.set(pattern.entityId, pattern._count / maxCount)
      }
    }

    return scores
  }

  private static async calculatePopularityScores(
    workspaceId: string,
    availableTags: any[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()

    // Get tag usage counts
    const tagCounts = await prisma.tag.findMany({
      where: {
        id: {
          in: availableTags.map((t) => t.id),
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            projects: true,
            folders: true,
            templates: true,
          },
        },
      },
    })

    // Normalize scores
    const maxCount = Math.max(
      ...tagCounts.map(
        (tc) => tc._count.projects + tc._count.folders + tc._count.templates
      )
    )
    if (maxCount > 0) {
      for (const tc of tagCounts) {
        const count =
          tc._count.projects + tc._count.folders + tc._count.templates
        scores.set(tc.id, count / maxCount)
      }
    }

    return scores
  }

  private static async getEntityVector(
    entityId: string,
    entityType: string
  ): Promise<number[] | null> {
    // Implement vector retrieval based on your vector storage
    // This could be from a vector database or computed on the fly
    return null
  }

  private static async getTagVector(tagId: string): Promise<number[] | null> {
    // Implement vector retrieval for tags
    // This could be pre-computed or generated from tag usage patterns
    return null
  }
}
