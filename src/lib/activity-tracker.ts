import { prisma } from "./prisma"

interface ActivityData {
  type: string
  entityType: string
  entityId: string
  entityName: string
  details?: Record<string, any>
  workspaceId: string
  userId: string
}

export class ActivityTracker {
  static async track(data: ActivityData) {
    try {
      await prisma.activity.create({
        data: {
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          details: data.details || {},
          workspaceId: data.workspaceId,
          userId: data.userId,
        },
      })
    } catch (error) {
      console.error("Failed to track activity:", error)
    }
  }

  static async getActivities({
    workspaceId,
    userId,
    entityType,
    entityId,
    limit = 50,
    offset = 0,
  }: {
    workspaceId: string
    userId?: string
    entityType?: string
    entityId?: string
    limit?: number
    offset?: number
  }) {
    try {
      const where = {
        workspaceId,
        ...(userId && { userId }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      }

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

      return {
        activities,
        total,
        hasMore: total > offset + limit,
      }
    } catch (error) {
      console.error("Failed to get activities:", error)
      return {
        activities: [],
        total: 0,
        hasMore: false,
      }
    }
  }

  static async getActivityStats({
    workspaceId,
    userId,
    days = 30,
  }: {
    workspaceId: string
    userId?: string
    days?: number
  }) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const activities = await prisma.activity.groupBy({
        by: ["type", "entityType"],
        where: {
          workspaceId,
          ...(userId && { userId }),
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      })

      const dailyActivity = await prisma.activity.groupBy({
        by: ["createdAt"],
        where: {
          workspaceId,
          ...(userId && { userId }),
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      })

      const userActivity = await prisma.activity.groupBy({
        by: ["userId"],
        where: {
          workspaceId,
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
      })

      return {
        activityByType: activities,
        dailyActivity,
        topUsers: userActivity,
      }
    } catch (error) {
      console.error("Failed to get activity stats:", error)
      return {
        activityByType: [],
        dailyActivity: [],
        topUsers: [],
      }
    }
  }
}
