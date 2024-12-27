import { prisma } from "./prisma"
import { FilterConditions, buildFilterQuery } from "./notification-filters"
import { trackEvent } from "./notification-analytics"

export type BulkActionType =
  | "markAsRead"
  | "markAsUnread"
  | "dismiss"
  | "delete"

interface BulkActionOptions {
  userId: string
  type: BulkActionType
  filter?: FilterConditions
  notificationIds?: string[]
}

const BATCH_SIZE = 100

export async function createBulkAction({
  userId,
  type,
  filter,
  notificationIds,
}: BulkActionOptions) {
  // Create bulk action record
  const action = await prisma.bulkAction.create({
    data: {
      userId,
      type,
      status: "pending",
      filter: filter || {},
    },
  })

  // Start processing in the background
  processBulkAction(action.id).catch((error) => {
    console.error(\`Failed to process bulk action \${action.id}:\`, error)
  })

  return action
}

export async function getBulkAction(actionId: string) {
  return prisma.bulkAction.findUnique({
    where: { id: actionId },
  })
}

export async function getBulkActions(userId: string) {
  return prisma.bulkAction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

async function processBulkAction(actionId: string) {
  const action = await prisma.bulkAction.findUnique({
    where: { id: actionId },
  })

  if (!action) {
    throw new Error("Bulk action not found")
  }

  try {
    // Mark as processing
    await prisma.bulkAction.update({
      where: { id: actionId },
      data: { status: "processing" },
    })

    // Build query from filter
    const query = action.filter
      ? await buildFilterQuery(action.filter as FilterConditions)
      : {}
    query.userId = action.userId

    // Get total count
    const total = await prisma.notification.count({
      where: query,
    })

    await prisma.bulkAction.update({
      where: { id: actionId },
      data: { total },
    })

    let processed = 0
    let failed = 0

    // Process in batches
    while (processed < total) {
      const notifications = await prisma.notification.findMany({
        where: query,
        select: { id: true },
        skip: processed,
        take: BATCH_SIZE,
      })

      try {
        // Apply the action
        switch (action.type) {
          case "markAsRead":
            await markAsRead(action.userId, notifications.map((n) => n.id))
            break
          case "markAsUnread":
            await markAsUnread(action.userId, notifications.map((n) => n.id))
            break
          case "dismiss":
            await dismiss(action.userId, notifications.map((n) => n.id))
            break
          case "delete":
            await deleteNotifications(action.userId, notifications.map((n) => n.id))
            break
        }

        processed += notifications.length
      } catch (error) {
        failed += notifications.length
        console.error(
          \`Failed to process batch for action \${actionId}:\`,
          error
        )
      }

      // Update progress
      await prisma.bulkAction.update({
        where: { id: actionId },
        data: {
          processed,
          failed,
        },
      })
    }

    // Mark as completed
    await prisma.bulkAction.update({
      where: { id: actionId },
      data: {
        status: failed === total ? "failed" : "completed",
        completedAt: new Date(),
      },
    })
  } catch (error) {
    // Mark as failed
    await prisma.bulkAction.update({
      where: { id: actionId },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    })
    throw error
  }
}

async function markAsRead(userId: string, notificationIds: string[]) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  })

  // Track events
  await Promise.all(
    notificationIds.map((id) =>
      trackEvent({
        userId,
        event: "read",
        channel: "app",
        notificationId: id,
      })
    )
  )
}

async function markAsUnread(userId: string, notificationIds: string[]) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: {
      read: false,
      readAt: null,
    },
  })
}

async function dismiss(userId: string, notificationIds: string[]) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: {
      dismissed: true,
      dismissedAt: new Date(),
    },
  })

  // Track events
  await Promise.all(
    notificationIds.map((id) =>
      trackEvent({
        userId,
        event: "dismissed",
        channel: "app",
        notificationId: id,
      })
    )
  )
}

async function deleteNotifications(userId: string, notificationIds: string[]) {
  await prisma.notification.deleteMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
  })
}
