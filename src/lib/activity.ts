import { prisma } from "./prisma"
import { processWebhooks } from "./webhooks"

interface ActivityOptions {
  type: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, any>
  userId: string
  workspaceId: string
}

interface AuditOptions {
  type: string
  action: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  userId?: string
  workspaceId: string
}

export async function logActivity(options: ActivityOptions) {
  const activity = await prisma.activityLog.create({
    data: options,
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
  })

  // Process webhooks for the activity
  await processWebhooks("activity.created", activity)

  return activity
}

export async function getActivities(
  workspaceId: string,
  options?: {
    userId?: string
    entityType?: string
    entityId?: string
    type?: string
    limit?: number
    offset?: number
  }
) {
  const where = {
    workspaceId,
    ...(options?.userId && { userId: options.userId }),
    ...(options?.entityType && { entityType: options.entityType }),
    ...(options?.entityId && { entityId: options.entityId }),
    ...(options?.type && { type: options.type }),
  }

  const [total, activities] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
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
      orderBy: { createdAt: "desc" },
      skip: options?.offset || 0,
      take: options?.limit || 50,
    }),
  ])

  return {
    total,
    activities,
  }
}

export async function logAudit(options: AuditOptions) {
  return prisma.audit.create({
    data: options,
  })
}

export async function getAuditLogs(
  workspaceId: string,
  options?: {
    userId?: string
    type?: string
    action?: string
    limit?: number
    offset?: number
  }
) {
  const where = {
    workspaceId,
    ...(options?.userId && { userId: options.userId }),
    ...(options?.type && { type: options.type }),
    ...(options?.action && { action: options.action }),
  }

  const [total, logs] = await Promise.all([
    prisma.audit.count({ where }),
    prisma.audit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: options?.offset || 0,
      take: options?.limit || 50,
    }),
  ])

  return {
    total,
    logs,
  }
}

export async function updateWorkspaceAnalytics(workspaceId: string) {
  const [
    activeUsers,
    taskStats,
    documentCount,
    commentCount,
    storageUsed,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        workspaces: {
          some: {
            id: workspaceId,
          },
        },
        lastActive: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
        },
      },
    }),
    prisma.task.groupBy({
      by: ["completed"],
      where: {
        workspaceId,
      },
      _count: true,
    }),
    prisma.document.count({
      where: {
        workspaceId,
      },
    }),
    prisma.comment.count({
      where: {
        workspaceId,
      },
    }),
    prisma.file.aggregate({
      where: {
        workspaceId,
      },
      _sum: {
        size: true,
      },
    }),
  ])

  const completedTasks = taskStats.find((stat) => stat.completed)?._count || 0
  const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0)

  return prisma.workspaceAnalytics.upsert({
    where: {
      workspaceId,
    },
    create: {
      workspaceId,
      activeUsers,
      taskCount: totalTasks,
      completedTasks,
      documentCount,
      commentCount,
      storageUsed: storageUsed._sum.size || 0,
    },
    update: {
      activeUsers,
      taskCount: totalTasks,
      completedTasks,
      documentCount,
      commentCount,
      storageUsed: storageUsed._sum.size || 0,
      lastUpdated: new Date(),
    },
  })
}

export async function getWorkspaceAnalytics(workspaceId: string) {
  return prisma.workspaceAnalytics.findUnique({
    where: {
      workspaceId,
    },
  })
}
