import { Activity, Project, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { sendActivityNotificationEmail } from "@/lib/email"
import { trackNotification } from "@/lib/analytics"
import { sendPushNotification } from "@/lib/web-push"
import { trackDelivery } from "@/lib/notification-delivery"
import {
  NotificationTemplateData,
  formatNotification,
} from "./notification-templates"

interface NotificationData {
  type: string
  category: string
  priority?: "high" | "normal" | "low"
  title: string
  message: string
  userId: string
  activityId?: string
  groupId?: string
  metadata?: Record<string, any>
}

interface NotificationGroup {
  id: string
  category: string
  notifications: Array<{
    id: string
    title: string
    message: string
    createdAt: Date
    read: boolean
    metadata?: Record<string, any>
  }>
}

interface NotificationFilters {
  categories?: string[]
  priority?: string[]
  read?: boolean
  startDate?: Date
  endDate?: Date
  search?: string
}

export async function createNotificationFromTemplate(
  templateType: string,
  data: NotificationTemplateData,
  userId: string,
  activityId?: string
) {
  const formattedNotification = formatNotification(templateType, data)

  const notification = await prisma.notification.create({
    data: {
      type: formattedNotification.type,
      category: formattedNotification.category,
      priority: formattedNotification.priority,
      title: formattedNotification.title,
      message: formattedNotification.message,
      groupId: formattedNotification.groupId,
      metadata: formattedNotification.metadata,
      userId,
      activityId,
    },
  })

  // Track in-app notification
  await trackDelivery(notification.id, userId, "app", "sent", undefined, {
    type: formattedNotification.type,
    category: formattedNotification.category,
    priority: formattedNotification.priority,
  })

  // Track analytics
  await trackNotification({
    userId,
    type: "notification",
    action: "sent",
    metadata: {
      notificationId: notification.id,
      notificationType: formattedNotification.type,
      category: formattedNotification.category,
      groupId: formattedNotification.groupId,
    },
  })

  // Send and track push notification
  try {
    await sendPushNotification(userId, {
      id: notification.id,
      type: formattedNotification.type,
      title: formattedNotification.title,
      message: formattedNotification.message,
      url: `/notifications?id=${notification.id}`,
      metadata: {
        ...formattedNotification.metadata,
        category: formattedNotification.category,
        priority: formattedNotification.priority,
      },
    })
    await trackDelivery(notification.id, userId, "push", "sent")
  } catch (error: any) {
    await trackDelivery(notification.id, userId, "push", "failed", error.message)
  }

  // Send and track email notification
  try {
    await sendActivityNotificationEmail(notification as any)
    await trackDelivery(notification.id, userId, "email", "sent")
  } catch (error: any) {
    await trackDelivery(notification.id, userId, "email", "failed", error.message)
  }

  return notification
}

export async function createNotification({
  type,
  category,
  priority = "normal",
  title,
  message,
  userId,
  activityId,
  groupId,
  metadata,
}: NotificationData) {
  // Try to find an existing group for the notification
  let effectiveGroupId = groupId
  if (!effectiveGroupId && metadata?.projectId) {
    // Find the most recent group for this project and category
    const recentGroup = await prisma.notification.findFirst({
      where: {
        userId,
        category,
        groupId: { not: null },
        metadata: {
          path: ["projectId"],
          equals: metadata.projectId,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: "desc" },
    })
    if (recentGroup) {
      effectiveGroupId = recentGroup.groupId
    }
  }

  // If no group found, create a new one
  if (!effectiveGroupId) {
    effectiveGroupId = type + "_" + Date.now()
  }

  // Get the next order in the group
  const lastInGroup = await prisma.notification.findFirst({
    where: { groupId: effectiveGroupId },
    orderBy: { groupOrder: "desc" },
  })
  const groupOrder = (lastInGroup?.groupOrder ?? 0) + 1

  const notification = await prisma.notification.create({
    data: {
      type,
      category,
      priority,
      title,
      message,
      userId,
      activityId,
      groupId: effectiveGroupId,
      groupOrder,
      metadata: metadata || {},
    },
  })

  // Track in-app notification
  await trackDelivery(notification.id, userId, "app", "sent", undefined, {
    type,
    category,
    priority,
  })

  // Track analytics
  await trackNotification({
    userId,
    type: "notification",
    action: "sent",
    metadata: {
      notificationId: notification.id,
      notificationType: type,
      category,
      groupId: effectiveGroupId,
    },
  })

  // Send and track push notification
  try {
    await sendPushNotification(userId, {
      id: notification.id,
      type,
      title,
      message,
      url: `/notifications?id=${notification.id}`,
      metadata: {
        ...metadata,
        category,
        priority,
      },
    })
    await trackDelivery(notification.id, userId, "push", "sent")
  } catch (error: any) {
    await trackDelivery(notification.id, userId, "push", "failed", error.message)
  }

  return notification
}

export async function createActivityNotification(
  activity: Activity & {
    user: Pick<User, "name" | "email">
    project: Pick<Project, "name">
  }
) {
  const data = activity.data as any

  // Map activity type to notification template type
  let templateType: string
  let templateData: NotificationTemplateData

  switch (activity.type) {
    case "member_added":
      templateType = "member.joined"
      templateData = {
        actor: activity.user,
        project: activity.project,
        action: "joined",
        subject: {
          id: data.memberId,
          name: data.memberName,
          email: data.memberEmail,
        },
        role: data.role,
      }
      break

    case "task_created":
      templateType = "task.created"
      templateData = {
        actor: activity.user,
        project: activity.project,
        action: "created",
        task: {
          id: data.taskId,
          title: data.taskTitle,
        },
      }
      break

    case "task_completed":
      templateType = "task.completed"
      templateData = {
        actor: activity.user,
        project: activity.project,
        action: "completed",
        task: {
          id: data.taskId,
          title: data.taskTitle,
        },
      }
      break

    case "task_assigned":
      templateType = "task.assigned"
      templateData = {
        actor: activity.user,
        project: activity.project,
        action: "assigned",
        task: {
          id: data.taskId,
          title: data.taskTitle,
        },
        assignee: {
          id: data.assigneeId,
          name: data.assigneeName,
          email: data.assigneeEmail,
        },
      }
      break

    default:
      return // Skip unknown activity types
  }

  // Get project members to notify
  const projectMembers = await prisma.project.findUnique({
    where: { id: activity.projectId },
    select: {
      members: {
        select: { id: true },
      },
      owner: {
        select: { id: true },
      },
    },
  })

  if (!projectMembers) return

  // Create notifications for all project members except the activity creator
  const memberIds = [
    ...projectMembers.members.map((m) => m.id),
    projectMembers.owner.id,
  ]

  for (const memberId of memberIds) {
    if (memberId === activity.userId) continue

    await createNotificationFromTemplate(
      templateType,
      templateData,
      memberId,
      activity.id
    )
  }

  // Send email notifications
  await sendActivityNotificationEmail(activity)
}

export async function getGroupedNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      dismissed: false,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
      { groupOrder: "desc" },
    ],
  })

  // Group notifications
  const groups: Record<string, NotificationGroup> = {}
  const ungrouped: typeof notifications = []

  notifications.forEach((notification) => {
    if (notification.groupId) {
      if (!groups[notification.groupId]) {
        groups[notification.groupId] = {
          id: notification.groupId,
          category: notification.category,
          notifications: [],
        }
      }
      groups[notification.groupId].notifications.push({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
        metadata: notification.metadata as Record<string, any>,
      })
    } else {
      ungrouped.push(notification)
    }
  })

  return {
    groups: Object.values(groups),
    ungrouped,
  }
}

export async function getFilteredNotifications(
  userId: string,
  filters: NotificationFilters = {},
  page = 1,
  pageSize = 20
) {
  const where: any = { userId }

  // Apply filters
  if (filters.categories?.length) {
    where.category = { in: filters.categories }
  }
  if (filters.priority?.length) {
    where.priority = { in: filters.priority }
  }
  if (filters.read !== undefined) {
    where.read = filters.read
  }
  if (filters.startDate) {
    where.createdAt = { ...where.createdAt, gte: filters.startDate }
  }
  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: filters.endDate }
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { message: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Get total count for pagination
  const total = await prisma.notification.count({ where })

  // Get notifications with pagination
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
      { groupOrder: "desc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Group notifications
  const groups: Record<string, NotificationGroup> = {}
  const ungrouped: typeof notifications = []

  notifications.forEach((notification) => {
    if (notification.groupId) {
      if (!groups[notification.groupId]) {
        groups[notification.groupId] = {
          id: notification.groupId,
          category: notification.category,
          notifications: [],
        }
      }
      groups[notification.groupId].notifications.push({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
        metadata: notification.metadata as Record<string, any>,
      })
    } else {
      ungrouped.push(notification)
    }
  })

  return {
    groups: Object.values(groups),
    ungrouped,
    pagination: {
      total,
      pages: Math.ceil(total / pageSize),
      current: page,
      pageSize,
    },
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  await trackDelivery(notificationId, notification.userId, "app", "delivered")

  return notification
}

export async function dismissNotification(notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { dismissed: true },
  })

  await trackDelivery(notificationId, notification.userId, "app", "dismissed")

  return notification
}

export async function trackNotificationClick(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) return

  await trackDelivery(notificationId, notification.userId, "app", "clicked")
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId },
  })
}
