import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface TaskFilterOptions {
  status?: string[]
  priority?: string[]
  assigneeId?: string[]
  dueDate?: {
    start?: Date
    end?: Date
  }
  tags?: string[]
  search?: string
  customFields?: Array<{
    fieldId: string
    value: any
  }>
  dependencies?: {
    type: string
    taskId: string
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function filterTasks(projectId: string, options: TaskFilterOptions) {
  const {
    status,
    priority,
    assigneeId,
    dueDate,
    tags,
    search,
    customFields,
    dependencies,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = options

  // Build where clause
  const where: Prisma.TaskWhereInput = {
    projectId,
    AND: [],
  }

  // Status filter
  if (status?.length) {
    where.status = { in: status }
  }

  // Priority filter
  if (priority?.length) {
    where.priority = { in: priority }
  }

  // Assignee filter
  if (assigneeId?.length) {
    where.assigneeId = { in: assigneeId }
  }

  // Due date filter
  if (dueDate?.start || dueDate?.end) {
    where.dueDate = {
      ...(dueDate.start && { gte: dueDate.start }),
      ...(dueDate.end && { lte: dueDate.end }),
    }
  }

  // Tags filter
  if (tags?.length) {
    where.tags = {
      some: {
        tag: {
          name: { in: tags },
        },
      },
    }
  }

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Custom fields filter
  if (customFields?.length) {
    where.customFieldValues = {
      some: {
        OR: customFields.map(({ fieldId, value }) => ({
          fieldId,
          value: { equals: value },
        })),
      },
    }
  }

  // Dependencies filter
  if (dependencies) {
    const { type, taskId } = dependencies
    where.OR = [
      {
        outgoingRelationships: {
          some: {
            type,
            targetTaskId: taskId,
          },
        },
      },
      {
        incomingRelationships: {
          some: {
            type,
            sourceTaskId: taskId,
          },
        },
      },
    ]
  }

  // Execute query
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        customFieldValues: {
          include: {
            field: true,
          },
        },
        outgoingRelationships: {
          include: {
            targetTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        incomingRelationships: {
          include: {
            sourceTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ])

  return {
    tasks,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}
