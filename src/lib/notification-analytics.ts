import { prisma } from "./prisma"
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  subMonths,
} from "date-fns"

export type NotificationEvent =
  | "sent"
  | "delivered"
  | "read"
  | "clicked"
  | "dismissed"

export type NotificationChannel = "app" | "email" | "push"

interface TrackEventOptions {
  userId: string
  event: NotificationEvent
  channel: NotificationChannel
  notificationId?: string
  batchId?: string
  metadata?: Record<string, any>
}

export async function trackEvent({
  userId,
  event,
  channel,
  notificationId,
  batchId,
  metadata,
}: TrackEventOptions) {
  // Record analytics event
  await prisma.notificationAnalytics.create({
    data: {
      userId,
      event,
      channel,
      notificationId,
      batchId,
      metadata,
    },
  })

  // Update stats if the event affects counts
  if (["sent", "read", "clicked", "dismissed"].includes(event)) {
    const now = new Date()

    // Update daily stats
    await updateStats(userId, channel, "daily", startOfDay(now), event)

    // Update weekly stats
    await updateStats(userId, channel, "weekly", startOfWeek(now), event)

    // Update monthly stats
    await updateStats(userId, channel, "monthly", startOfMonth(now), event)
  }
}

async function updateStats(
  userId: string,
  channel: NotificationChannel,
  period: "daily" | "weekly" | "monthly",
  date: Date,
  event: NotificationEvent
) {
  const updateData: Record<string, number> = { total: 1 }
  if (event === "read") updateData.read = 1
  if (event === "clicked") updateData.clicked = 1
  if (event === "dismissed") updateData.dismissed = 1

  await prisma.notificationStats.upsert({
    where: {
      userId_period_date_channel: {
        userId,
        period,
        date,
        channel,
      },
    },
    create: {
      userId,
      period,
      date,
      channel,
      ...updateData,
    },
    update: {
      total: { increment: event === "sent" ? 1 : 0 },
      read: { increment: event === "read" ? 1 : 0 },
      clicked: { increment: event === "clicked" ? 1 : 0 },
      dismissed: { increment: event === "dismissed" ? 1 : 0 },
    },
  })
}

export async function getNotificationStats(
  userId: string,
  period: "daily" | "weekly" | "monthly" = "daily",
  channel?: NotificationChannel,
  months = 3
) {
  const now = new Date()
  const startDate = subMonths(now, months)

  let dateRange
  if (period === "daily") {
    dateRange = { gte: startOfDay(startDate), lte: endOfDay(now) }
  } else if (period === "weekly") {
    dateRange = { gte: startOfWeek(startDate), lte: endOfWeek(now) }
  } else {
    dateRange = { gte: startOfMonth(startDate), lte: endOfMonth(now) }
  }

  const stats = await prisma.notificationStats.findMany({
    where: {
      userId,
      period,
      date: dateRange,
      ...(channel ? { channel } : {}),
    },
    orderBy: {
      date: "asc",
    },
  })

  return stats
}

export async function getNotificationTrends(userId: string) {
  const now = new Date()
  const startDate = subMonths(now, 1)

  // Get event counts by type
  const eventCounts = await prisma.notificationAnalytics.groupBy({
    by: ["event", "channel"],
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
    _count: true,
  })

  // Get engagement rates
  const totalSent = eventCounts.find((c) => c.event === "sent")?._count || 0
  const totalRead = eventCounts.find((c) => c.event === "read")?._count || 0
  const totalClicked = eventCounts.find((c) => c.event === "clicked")?._count || 0

  const engagementRate = totalSent ? (totalRead / totalSent) * 100 : 0
  const clickThroughRate = totalRead ? (totalClicked / totalRead) * 100 : 0

  // Get channel distribution
  const channelCounts = await prisma.notificationAnalytics.groupBy({
    by: ["channel"],
    where: {
      userId,
      event: "sent",
      createdAt: {
        gte: startDate,
      },
    },
    _count: true,
  })

  // Get most active times
  const hourlyDistribution = await prisma.$queryRaw\`
    SELECT EXTRACT(HOUR FROM "createdAt") as hour,
           COUNT(*) as count
    FROM "NotificationAnalytics"
    WHERE "userId" = \${userId}
      AND "createdAt" >= \${startDate}
      AND event = 'sent'
    GROUP BY hour
    ORDER BY hour
  \`

  return {
    eventCounts,
    engagementRate,
    clickThroughRate,
    channelDistribution: channelCounts,
    hourlyDistribution,
  }
}

export async function getPopularNotifications(userId: string) {
  const startDate = subMonths(new Date(), 1)

  // Get most engaged notifications
  return prisma.notification.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      id: true,
      type: true,
      category: true,
      title: true,
      message: true,
      createdAt: true,
      _count: {
        select: {
          analytics: {
            where: {
              event: {
                in: ["read", "clicked"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      analytics: {
        _count: "desc",
      },
    },
    take: 10,
  })
}
