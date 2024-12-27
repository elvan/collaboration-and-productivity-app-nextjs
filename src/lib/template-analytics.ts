import { prisma } from "./prisma"
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns"

type AnalyticsEvent =
  | "sent"
  | "delivered"
  | "read"
  | "clicked"
  | "converted"

interface EventMetadata {
  [key: string]: any
}

export async function trackEvent(
  templateId: string,
  event: AnalyticsEvent,
  userId?: string,
  metadata?: EventMetadata
) {
  // Record event
  const analyticsEvent = await prisma.templateAnalytics.create({
    data: {
      templateId,
      event,
      userId,
      metadata,
    },
  })

  // Update performance metrics
  await updatePerformanceMetrics(templateId)

  return analyticsEvent
}

async function updatePerformanceMetrics(templateId: string) {
  const now = new Date()

  // Update daily metrics
  await updatePeriodMetrics(
    templateId,
    "daily",
    startOfDay(now),
    endOfDay(now)
  )

  // Update weekly metrics
  await updatePeriodMetrics(
    templateId,
    "weekly",
    startOfWeek(now),
    endOfWeek(now)
  )

  // Update monthly metrics
  await updatePeriodMetrics(
    templateId,
    "monthly",
    startOfMonth(now),
    endOfMonth(now)
  )
}

async function updatePeriodMetrics(
  templateId: string,
  period: string,
  startDate: Date,
  endDate: Date
) {
  // Get event counts
  const [
    sentCount,
    deliveredCount,
    readCount,
    clickCount,
    conversionCount,
    readTimes,
  ] = await Promise.all([
    getEventCount(templateId, "sent", startDate, endDate),
    getEventCount(templateId, "delivered", startDate, endDate),
    getEventCount(templateId, "read", startDate, endDate),
    getEventCount(templateId, "clicked", startDate, endDate),
    getEventCount(templateId, "converted", startDate, endDate),
    getReadTimes(templateId, startDate, endDate),
  ])

  // Calculate rates
  const deliveryRate = sentCount > 0 ? deliveredCount / sentCount : 0
  const readRate = deliveredCount > 0 ? readCount / deliveredCount : 0
  const clickRate = readCount > 0 ? clickCount / readCount : 0
  const conversionRate = clickCount > 0 ? conversionCount / clickCount : 0

  // Calculate average read time
  const averageReadTime =
    readTimes.length > 0
      ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
      : null

  // Update or create performance record
  await prisma.templatePerformance.upsert({
    where: {
      templateId_period_startDate: {
        templateId,
        period,
        startDate,
      },
    },
    create: {
      templateId,
      period,
      startDate,
      endDate,
      sentCount,
      deliveredCount,
      readCount,
      clickCount,
      conversionCount,
      deliveryRate,
      readRate,
      clickRate,
      conversionRate,
      averageReadTime,
    },
    update: {
      endDate,
      sentCount,
      deliveredCount,
      readCount,
      clickCount,
      conversionCount,
      deliveryRate,
      readRate,
      clickRate,
      conversionRate,
      averageReadTime,
    },
  })
}

async function getEventCount(
  templateId: string,
  event: AnalyticsEvent,
  startDate: Date,
  endDate: Date
): Promise<number> {
  return prisma.templateAnalytics.count({
    where: {
      templateId,
      event,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  })
}

async function getReadTimes(
  templateId: string,
  startDate: Date,
  endDate: Date
): Promise<number[]> {
  const readEvents = await prisma.templateAnalytics.findMany({
    where: {
      templateId,
      event: "read",
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      metadata: true,
    },
  })

  return readEvents
    .map((event) => (event.metadata as any)?.readTime as number)
    .filter((time): time is number => typeof time === "number")
}

export async function getTemplatePerformance(
  templateId: string,
  period: string = "daily",
  limit: number = 30
) {
  return prisma.templatePerformance.findMany({
    where: {
      templateId,
      period,
    },
    orderBy: {
      startDate: "desc",
    },
    take: limit,
  })
}

export async function getTemplateComparison(
  templateIds: string[],
  period: string = "monthly",
  startDate?: Date,
  endDate: Date = new Date()
) {
  if (!startDate) {
    startDate =
      period === "daily"
        ? subDays(endDate, 30)
        : period === "weekly"
        ? subWeeks(endDate, 12)
        : subMonths(endDate, 12)
  }

  return prisma.templatePerformance.findMany({
    where: {
      templateId: {
        in: templateIds,
      },
      period,
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [
      {
        templateId: "asc",
      },
      {
        startDate: "asc",
      },
    ],
  })
}

export async function getTopPerformingTemplates(
  period: string = "monthly",
  metric: keyof TemplatePerformance = "conversionRate",
  limit: number = 10
) {
  const latestDate = await prisma.templatePerformance.findFirst({
    where: { period },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  })

  if (!latestDate) {
    return []
  }

  return prisma.templatePerformance.findMany({
    where: {
      period,
      startDate: latestDate.startDate,
    },
    orderBy: {
      [metric]: "desc",
    },
    take: limit,
    include: {
      template: {
        select: {
          name: true,
          type: true,
        },
      },
    },
  })
}

export async function getTemplateInsights(templateId: string) {
  const now = new Date()
  const [daily, weekly, monthly] = await Promise.all([
    getTemplatePerformance(templateId, "daily", 7),
    getTemplatePerformance(templateId, "weekly", 4),
    getTemplatePerformance(templateId, "monthly", 12),
  ])

  const trends = {
    daily: calculateTrends(daily),
    weekly: calculateTrends(weekly),
    monthly: calculateTrends(monthly),
  }

  return {
    performance: {
      daily: daily[0],
      weekly: weekly[0],
      monthly: monthly[0],
    },
    trends,
    history: {
      daily,
      weekly,
      monthly,
    },
  }
}

function calculateTrends(data: any[]) {
  if (data.length < 2) return {}

  const metrics = [
    "deliveryRate",
    "readRate",
    "clickRate",
    "conversionRate",
  ]

  return metrics.reduce((acc, metric) => {
    const current = data[0][metric]
    const previous = data[1][metric]
    const change = previous > 0 ? (current - previous) / previous : 0

    return {
      ...acc,
      [metric]: {
        change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
      },
    }
  }, {})
}
