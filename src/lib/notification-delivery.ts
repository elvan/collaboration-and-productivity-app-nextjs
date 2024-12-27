import { prisma } from "./prisma"

export type DeliveryChannel = "app" | "email" | "push"
export type DeliveryStatus =
  | "sent"
  | "delivered"
  | "failed"
  | "clicked"
  | "dismissed"

interface DeliveryMetadata {
  deviceInfo?: {
    type: string
    os?: string
    browser?: string
  }
  emailClient?: string
  errorDetails?: any
  location?: string
  timestamp?: string
  [key: string]: any
}

export async function trackDelivery(
  notificationId: string,
  userId: string,
  channel: DeliveryChannel,
  status: DeliveryStatus,
  error?: string,
  metadata?: DeliveryMetadata
) {
  return prisma.notificationDelivery.create({
    data: {
      notificationId,
      userId,
      channel,
      status,
      error,
      metadata: metadata || {},
    },
  })
}

export async function updateDeliveryStatus(
  notificationId: string,
  channel: DeliveryChannel,
  status: DeliveryStatus,
  metadata?: DeliveryMetadata
) {
  const delivery = await prisma.notificationDelivery.findFirst({
    where: {
      notificationId,
      channel,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (!delivery) return null

  return prisma.notificationDelivery.update({
    where: { id: delivery.id },
    data: {
      status,
      metadata: {
        ...delivery.metadata,
        ...metadata,
        statusUpdatedAt: new Date().toISOString(),
      },
    },
  })
}

export async function getDeliveryAnalytics(
  userId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {}
  
  if (userId) {
    where.userId = userId
  }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [
    totalDeliveries,
    deliveriesByChannel,
    deliveriesByStatus,
    failureRates,
    clickRates,
    averageDeliveryTimes,
  ] = await Promise.all([
    // Total deliveries
    prisma.notificationDelivery.count({ where }),

    // Deliveries by channel
    prisma.notificationDelivery.groupBy({
      by: ["channel"],
      where,
      _count: true,
    }),

    // Deliveries by status
    prisma.notificationDelivery.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),

    // Failure rates by channel
    prisma.notificationDelivery.groupBy({
      by: ["channel"],
      where: {
        ...where,
        status: "failed",
      },
      _count: true,
    }),

    // Click rates by channel
    prisma.notificationDelivery.groupBy({
      by: ["channel"],
      where: {
        ...where,
        status: "clicked",
      },
      _count: true,
    }),

    // Average delivery times
    prisma.$queryRaw`
      SELECT 
        channel,
        AVG(EXTRACT(EPOCH FROM (
          CASE 
            WHEN status = 'delivered' 
            THEN "updatedAt" 
            ELSE "createdAt" 
          END - "createdAt"
        ))) as avg_delivery_time
      FROM "NotificationDelivery"
      WHERE status IN ('delivered', 'clicked')
      GROUP BY channel
    `,
  ])

  return {
    total: totalDeliveries,
    byChannel: deliveriesByChannel.reduce(
      (acc, { channel, _count }) => ({ ...acc, [channel]: _count }),
      {}
    ),
    byStatus: deliveriesByStatus.reduce(
      (acc, { status, _count }) => ({ ...acc, [status]: _count }),
      {}
    ),
    failureRates: failureRates.reduce(
      (acc, { channel, _count }) => ({
        ...acc,
        [channel]: (_count / totalDeliveries) * 100,
      }),
      {}
    ),
    clickRates: clickRates.reduce(
      (acc, { channel, _count }) => ({
        ...acc,
        [channel]: (_count / totalDeliveries) * 100,
      }),
      {}
    ),
    averageDeliveryTimes,
  }
}

export async function getDeliveryTimeline(
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  interval: "hour" | "day" | "week" = "day"
) {
  const where: any = {}
  
  if (userId) {
    where.userId = userId
  }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const timeFormat = {
    hour: "YYYY-MM-DD HH24:00:00",
    day: "YYYY-MM-DD",
    week: "YYYY-WW",
  }[interval]

  return prisma.$queryRaw`
    SELECT 
      TO_CHAR(DATE_TRUNC('${interval}', "createdAt"), '${timeFormat}') as time_period,
      channel,
      status,
      COUNT(*) as count
    FROM "NotificationDelivery"
    WHERE ${where}
    GROUP BY time_period, channel, status
    ORDER BY time_period ASC
  `
}
