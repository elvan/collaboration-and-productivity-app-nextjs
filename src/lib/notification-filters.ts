import { prisma } from "./prisma"
import { Prisma } from "@prisma/client"

export interface FilterConditions {
  type?: string | string[]
  category?: string | string[]
  priority?: string | string[]
  read?: boolean
  dismissed?: boolean
  startDate?: Date
  endDate?: Date
  search?: string
  groupId?: string
  isBatch?: boolean
  metadata?: Record<string, any>
}

export interface NotificationFilterOptions {
  conditions: FilterConditions
  sortBy?: string
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export async function getSavedFilters(userId: string) {
  return prisma.notificationFilter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getDefaultFilter(userId: string) {
  return prisma.notificationFilter.findFirst({
    where: { userId, isDefault: true },
  })
}

export async function saveFilter(
  userId: string,
  name: string,
  options: NotificationFilterOptions,
  description?: string,
  isDefault?: boolean
) {
  // If setting as default, unset any existing default
  if (isDefault) {
    await prisma.notificationFilter.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })
  }

  return prisma.notificationFilter.upsert({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
    create: {
      userId,
      name,
      description,
      isDefault: isDefault || false,
      conditions: options.conditions,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
    },
    update: {
      description,
      isDefault: isDefault || false,
      conditions: options.conditions,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
    },
  })
}

export async function deleteFilter(userId: string, filterId: string) {
  return prisma.notificationFilter.deleteMany({
    where: {
      id: filterId,
      userId,
    },
  })
}

export async function buildFilterQuery(
  conditions: FilterConditions
): Promise<Prisma.NotificationWhereInput> {
  const query: Prisma.NotificationWhereInput = {}
  const AND: Prisma.NotificationWhereInput[] = []

  // Handle type filter
  if (conditions.type) {
    AND.push({
      type: Array.isArray(conditions.type)
        ? { in: conditions.type }
        : conditions.type,
    })
  }

  // Handle category filter
  if (conditions.category) {
    AND.push({
      category: Array.isArray(conditions.category)
        ? { in: conditions.category }
        : conditions.category,
    })
  }

  // Handle priority filter
  if (conditions.priority) {
    AND.push({
      priority: Array.isArray(conditions.priority)
        ? { in: conditions.priority }
        : conditions.priority,
    })
  }

  // Handle read/unread filter
  if (typeof conditions.read === "boolean") {
    AND.push({ read: conditions.read })
  }

  // Handle dismissed filter
  if (typeof conditions.dismissed === "boolean") {
    AND.push({ dismissed: conditions.dismissed })
  }

  // Handle date range filter
  if (conditions.startDate || conditions.endDate) {
    const dateFilter: Prisma.DateTimeFilter = {}
    if (conditions.startDate) dateFilter.gte = conditions.startDate
    if (conditions.endDate) dateFilter.lte = conditions.endDate
    AND.push({ createdAt: dateFilter })
  }

  // Handle search filter
  if (conditions.search) {
    AND.push({
      OR: [
        { title: { contains: conditions.search, mode: "insensitive" } },
        { message: { contains: conditions.search, mode: "insensitive" } },
      ],
    })
  }

  // Handle group filter
  if (conditions.groupId) {
    AND.push({ groupId: conditions.groupId })
  }

  // Handle batch filter
  if (typeof conditions.isBatch === "boolean") {
    if (conditions.isBatch) {
      AND.push({ batch: { isNot: null } })
    } else {
      AND.push({ batch: null })
    }
  }

  // Handle metadata filter
  if (conditions.metadata) {
    Object.entries(conditions.metadata).forEach(([key, value]) => {
      AND.push({
        metadata: {
          path: [key],
          equals: value,
        },
      })
    })
  }

  if (AND.length > 0) {
    query.AND = AND
  }

  return query
}

export async function filterNotifications(
  userId: string,
  options: NotificationFilterOptions
) {
  const { conditions, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = options

  const query = await buildFilterQuery(conditions)
  query.userId = userId // Always filter by user

  const [total, notifications] = await Promise.all([
    // Get total count
    prisma.notification.count({
      where: query,
    }),

    // Get paginated results
    prisma.notification.findMany({
      where: query,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        activity: true,
        batch: true,
      },
    }),
  ])

  return {
    notifications,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function getFilterStats(userId: string, filterId: string) {
  const filter = await prisma.notificationFilter.findFirst({
    where: { id: filterId, userId },
  })

  if (!filter) return null

  const query = await buildFilterQuery(filter.conditions as FilterConditions)
  query.userId = userId

  const [total, unread, priority] = await Promise.all([
    // Total count
    prisma.notification.count({
      where: query,
    }),

    // Unread count
    prisma.notification.count({
      where: {
        ...query,
        read: false,
      },
    }),

    // Priority breakdown
    prisma.notification.groupBy({
      by: ["priority"],
      where: query,
      _count: true,
    }),
  ])

  return {
    total,
    unread,
    priority: priority.reduce(
      (acc, { priority, _count }) => ({ ...acc, [priority]: _count }),
      {}
    ),
  }
}
