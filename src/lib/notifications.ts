import { prisma } from "./prisma"
import { Notification } from "@prisma/client"

export interface NotificationCreateInput {
  type: string
  title: string
  message: string
  userId: string
  workspaceId: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
}

export async function createNotification(data: NotificationCreateInput) {
  return prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      userId: data.userId,
      workspaceId: data.workspaceId,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata || {},
    },
  })
}

export async function createNotifications(
  notifications: NotificationCreateInput[]
) {
  return prisma.notification.createMany({
    data: notifications.map((notification) => ({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      workspaceId: notification.workspaceId,
      entityType: notification.entityType,
      entityId: notification.entityId,
      metadata: notification.metadata || {},
    })),
  })
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({
    where: { id },
  })
}

export async function getNotification(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  })
}

export async function getNotifications(
  userId: string,
  options?: {
    read?: boolean
    type?: string
    entityType?: string
    entityId?: string
    limit?: number
    offset?: number
  }
) {
  const where = {
    userId,
    ...(options?.read !== undefined && { read: options.read }),
    ...(options?.type && { type: options.type }),
    ...(options?.entityType && { entityType: options.entityType }),
    ...(options?.entityId && { entityId: options.entityId }),
  }

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    }),
  ])

  return {
    total,
    notifications,
  }
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  })
}

// Notification Templates
const notificationTemplates = {
  "team.invitation": {
    title: "Team Invitation",
    message: "You have been invited to join the team {teamName}",
  },
  "team.member_added": {
    title: "New Team Member",
    message: "{memberName} has joined the team {teamName}",
  },
  "team.member_removed": {
    title: "Team Member Removed",
    message: "{memberName} has been removed from the team {teamName}",
  },
  "document.shared": {
    title: "Document Shared",
    message: "{userName} has shared the document {documentTitle} with you",
  },
  "document.comment": {
    title: "New Comment",
    message: "{userName} commented on {documentTitle}",
  },
  "task.assigned": {
    title: "Task Assigned",
    message: "You have been assigned to the task {taskTitle}",
  },
  "task.completed": {
    title: "Task Completed",
    message: "Task {taskTitle} has been marked as complete",
  },
  "task.comment": {
    title: "New Task Comment",
    message: "{userName} commented on task {taskTitle}",
  },
} as const

type NotificationTemplate = keyof typeof notificationTemplates

export function createNotificationFromTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>,
  data: Omit<NotificationCreateInput, "title" | "message" | "type">
) {
  const templateData = notificationTemplates[template]
  let title = templateData.title
  let message = templateData.message

  // Replace variables in title and message
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value)
    message = message.replace(`{${key}}`, value)
  })

  return createNotification({
    ...data,
    type: template,
    title,
    message,
  })
}

export function createNotificationsFromTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>,
  data: Array<Omit<NotificationCreateInput, "title" | "message" | "type">>
) {
  const templateData = notificationTemplates[template]
  let title = templateData.title
  let message = templateData.message

  // Replace variables in title and message
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value)
    message = message.replace(`{${key}}`, value)
  })

  return createNotifications(
    data.map((item) => ({
      ...item,
      type: template,
      title,
      message,
    }))
  )
}
