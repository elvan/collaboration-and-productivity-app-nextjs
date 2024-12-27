import { prisma } from "@/lib/prisma"

export type NotificationMetricType = "notification" | "email" | "digest"
export type NotificationAction = "sent" | "read" | "clicked" | "dismissed"

interface TrackNotificationParams {
  userId: string
  projectId?: string
  type: NotificationMetricType
  action: NotificationAction
  metadata?: Record<string, any>
}

export async function trackNotification({
  userId,
  projectId,
  type,
  action,
  metadata,
}: TrackNotificationParams) {
  try {
    await prisma.notificationMetric.create({
      data: {
        userId,
        projectId,
        type,
        action,
        metadata: metadata || {},
      },
    })
  } catch (error) {
    console.error("Failed to track notification metric:", error)
  }
}

export async function getNotificationMetrics(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const metrics = await prisma.notificationMetric.groupBy({
    by: ["type", "action"],
    where: {
      userId,
      timestamp: {
        gte: startDate,
      },
    },
    _count: true,
  })

  return metrics
}

export async function getProjectNotificationMetrics(
  projectId: string,
  days: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const metrics = await prisma.notificationMetric.groupBy({
    by: ["type", "action"],
    where: {
      projectId,
      timestamp: {
        gte: startDate,
      },
    },
    _count: true,
  })

  return metrics
}

export async function getUserEngagementMetrics(userId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalNotifications,
    readRate,
    clickRate,
    dismissRate,
    avgResponseTime,
  ] = await Promise.all([
    // Total notifications
    prisma.notificationMetric.count({
      where: {
        userId,
        type: "notification",
        action: "sent",
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    }),

    // Read rate
    prisma.notificationMetric
      .groupBy({
        by: ["action"],
        where: {
          userId,
          type: "notification",
          action: { in: ["sent", "read"] },
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      })
      .then((results) => {
        const sent = results.find((r) => r.action === "sent")?._count || 0
        const read = results.find((r) => r.action === "read")?._count || 0
        return sent > 0 ? (read / sent) * 100 : 0
      }),

    // Click rate
    prisma.notificationMetric
      .groupBy({
        by: ["action"],
        where: {
          userId,
          type: "notification",
          action: { in: ["sent", "clicked"] },
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      })
      .then((results) => {
        const sent = results.find((r) => r.action === "sent")?._count || 0
        const clicked = results.find((r) => r.action === "clicked")?._count || 0
        return sent > 0 ? (clicked / sent) * 100 : 0
      }),

    // Dismiss rate
    prisma.notificationMetric
      .groupBy({
        by: ["action"],
        where: {
          userId,
          type: "notification",
          action: { in: ["sent", "dismissed"] },
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      })
      .then((results) => {
        const sent = results.find((r) => r.action === "sent")?._count || 0
        const dismissed = results.find((r) => r.action === "dismissed")?._count || 0
        return sent > 0 ? (dismissed / sent) * 100 : 0
      }),

    // Average response time
    prisma.notificationMetric
      .findMany({
        where: {
          userId,
          type: "notification",
          action: { in: ["sent", "read"] },
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      })
      .then((metrics) => {
        const responseTimesMs = []
        const sentMetrics = metrics.filter((m) => m.action === "sent")
        const readMetrics = metrics.filter((m) => m.action === "read")

        for (const sent of sentMetrics) {
          const read = readMetrics.find(
            (r) =>
              r.metadata &&
              typeof r.metadata === "object" &&
              "notificationId" in r.metadata &&
              r.metadata.notificationId === sent.metadata?.notificationId
          )
          if (read) {
            responseTimesMs.push(
              new Date(read.timestamp).getTime() -
                new Date(sent.timestamp).getTime()
            )
          }
        }

        if (responseTimesMs.length === 0) return 0
        const avgMs =
          responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length
        return avgMs / 1000 // Convert to seconds
      }),
  ])

  return {
    totalNotifications,
    readRate,
    clickRate,
    dismissRate,
    avgResponseTime,
  }
}
