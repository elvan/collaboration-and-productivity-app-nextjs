import { prisma } from "./prisma"
import { addSeconds } from "date-fns"
import { createNotification } from "./notification"
import { trackDelivery } from "./notification-delivery"
import { checkRateLimit, trackNotificationSent } from "./notification-rate-limit"

interface BatchingRule {
  id: string
  userId: string
  templateType: string | null
  category: string | null
  enabled: boolean
  batchWindow: number
  minBatchSize: number
  maxBatchSize: number
}

export async function getBatchingRules(userId: string) {
  return prisma.notificationBatchingRule.findMany({
    where: { userId },
  })
}

export async function updateBatchingRule(
  userId: string,
  config: {
    templateType?: string
    category?: string
    enabled?: boolean
    batchWindow?: number
    minBatchSize?: number
    maxBatchSize?: number
  }
) {
  const { templateType, category, ...settings } = config

  return prisma.notificationBatchingRule.upsert({
    where: {
      userId_templateType_category: {
        userId,
        templateType: templateType || null,
        category: category || null,
      },
    },
    create: {
      userId,
      templateType: templateType || null,
      category: category || null,
      ...settings,
    },
    update: settings,
  })
}

async function findMatchingRule(
  userId: string,
  templateType: string,
  category: string
): Promise<BatchingRule | null> {
  // Find the most specific matching rule
  const rules = await prisma.notificationBatchingRule.findMany({
    where: {
      userId,
      enabled: true,
      OR: [
        // Exact match
        { templateType, category },
        // Template match, any category
        { templateType, category: null },
        // Category match, any template
        { templateType: null, category },
        // Global rule
        { templateType: null, category: null },
      ],
    },
  })

  if (!rules.length) return null

  // Sort by specificity
  return rules.sort((a, b) => {
    const aScore = (a.templateType ? 2 : 0) + (a.category ? 1 : 0)
    const bScore = (b.templateType ? 2 : 0) + (b.category ? 1 : 0)
    return bScore - aScore
  })[0]
}

async function findOrCreateBatch(
  userId: string,
  templateType: string,
  category: string,
  groupId: string | null,
  priority: string,
  rule: BatchingRule
) {
  const now = new Date()
  const cutoff = addSeconds(now, -rule.batchWindow)

  // Find an existing batch
  const batch = await prisma.notificationBatch.findFirst({
    where: {
      userId,
      templateType,
      category,
      groupId: groupId || null,
      status: "pending",
      count: {
        lt: rule.maxBatchSize,
      },
      createdAt: {
        gte: cutoff,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (batch) return batch

  // Create a new batch
  return prisma.notificationBatch.create({
    data: {
      userId,
      templateType,
      category,
      groupId: groupId || null,
      priority,
      scheduledFor: addSeconds(now, rule.batchWindow),
    },
  })
}

export async function addToBatch(notification: any) {
  const rule = await findMatchingRule(
    notification.userId,
    notification.type,
    notification.category
  )

  if (!rule) return false

  const batch = await findOrCreateBatch(
    notification.userId,
    notification.type,
    notification.category,
    notification.groupId,
    notification.priority,
    rule
  )

  // Add notification to batch
  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      batch: {
        connect: { id: batch.id },
      },
    },
  })

  // Update batch count
  await prisma.notificationBatch.update({
    where: { id: batch.id },
    data: {
      count: {
        increment: 1,
      },
      metadata: {
        ...(batch.metadata || {}),
        lastNotificationId: notification.id,
      },
    },
  })

  return true
}

export async function processBatch(batchId: string) {
  const batch = await prisma.notificationBatch.findUnique({
    where: { id: batchId },
    include: {
      notifications: true,
    },
  })

  if (!batch || batch.status !== "pending") return

  const rule = await findMatchingRule(
    batch.userId,
    batch.templateType,
    batch.category
  )

  if (!rule || batch.count < rule.minBatchSize) {
    // Not enough notifications to process as batch
    await sendIndividualNotifications(batch)
    return
  }

  try {
    // Check rate limits
    const rateLimitCheck = await checkRateLimit({
      userId: batch.userId,
      channel: "app",
      templateType: batch.templateType,
      category: batch.category,
    })

    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.reason)
    }

    // Create batch notification
    const batchNotification = await createNotification({
      type: batch.templateType,
      category: batch.category,
      priority: batch.priority,
      title: `${batch.count} new ${batch.category} notifications`,
      message: `You have ${batch.count} new notifications of type ${batch.templateType}`,
      userId: batch.userId,
      groupId: batch.groupId,
      metadata: {
        isBatch: true,
        batchId: batch.id,
        count: batch.count,
        notifications: batch.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
        })),
      },
    })

    // Track notifications
    await Promise.all([
      trackNotificationSent({
        userId: batch.userId,
        channel: "app",
        templateType: batch.templateType,
        category: batch.category,
      }),
      trackDelivery(batchNotification.id, batch.userId, "app", "sent", undefined, {
        isBatch: true,
        batchId: batch.id,
        count: batch.count,
      }),
    ])

    // Update batch status
    await prisma.notificationBatch.update({
      where: { id: batch.id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    })
  } catch (error: any) {
    console.error("Failed to process batch:", error)

    // Update batch status
    await prisma.notificationBatch.update({
      where: { id: batch.id },
      data: {
        status: "failed",
        error: error.message,
      },
    })

    // Fall back to individual notifications
    await sendIndividualNotifications(batch)
  }
}

async function sendIndividualNotifications(batch: any) {
  for (const notification of batch.notifications) {
    try {
      // Remove from batch
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          batch: {
            disconnect: true,
          },
        },
      })

      // Send individually
      await createNotification({
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        userId: notification.userId,
        groupId: notification.groupId,
        metadata: notification.metadata,
      })
    } catch (error) {
      console.error(
        `Failed to send individual notification ${notification.id}:`,
        error
      )
    }
  }
}

export async function scheduleBatchProcessing() {
  const now = new Date()

  // Find batches ready to be processed
  const batches = await prisma.notificationBatch.findMany({
    where: {
      status: "pending",
      OR: [
        // Process if scheduled time has passed
        {
          scheduledFor: {
            lte: now,
          },
        },
        // Process if max batch size reached
        {
          count: {
            gte: 10, // Default max batch size
          },
        },
      ],
    },
  })

  // Process each batch
  await Promise.all(batches.map((batch) => processBatch(batch.id)))
}
