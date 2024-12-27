import { prisma } from "../prisma"
import { logActivity } from "../activity"

export interface TaskCreateInput {
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  projectId: string
  assigneeId?: string
  parentId?: string
  labels?: string[]
  customFields?: Record<string, any>
  userId: string
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date | null
  assigneeId?: string | null
  parentId?: string | null
  labels?: string[]
  customFields?: Record<string, any>
}

export interface TaskQueryOptions {
  projectId?: string
  assigneeId?: string
  status?: string[]
  priority?: string[]
  dueDate?: {
    start?: Date
    end?: Date
  }
  parentId?: string | null
  labels?: string[]
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function createTask(data: TaskCreateInput) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      parentId: data.parentId,
      labels: data.labels,
      customFields: data.customFields,
      createdById: data.userId,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      parent: true,
      subtasks: true,
      project: true,
    },
  })

  // Log activity
  await logActivity({
    type: 'task.created',
    action: 'created',
    entityType: 'task',
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
    },
    userId: data.userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function updateTask(
  id: string,
  data: TaskUpdateInput,
  userId: string
) {
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      lastUpdatedById: userId,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      parent: true,
      subtasks: true,
      project: true,
    },
  })

  // Log activity
  await logActivity({
    type: 'task.updated',
    action: 'updated',
    entityType: 'task',
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      changes: data,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.delete({
    where: { id },
    include: {
      project: true,
    },
  })

  // Log activity
  await logActivity({
    type: 'task.deleted',
    action: 'deleted',
    entityType: 'task',
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function getTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      parent: true,
      subtasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      dependencies: true,
      dependents: true,
      project: true,
    },
  })
}

export async function getTasks(options: TaskQueryOptions) {
  const where = {
    projectId: options.projectId,
    assigneeId: options.assigneeId,
    status: options.status?.length ? { in: options.status } : undefined,
    priority: options.priority?.length ? { in: options.priority } : undefined,
    dueDate: options.dueDate
      ? {
          gte: options.dueDate.start,
          lte: options.dueDate.end,
        }
      : undefined,
    parentId: options.parentId,
    labels: options.labels?.length
      ? {
          hasSome: options.labels,
        }
      : undefined,
    ...(options.search && {
      OR: [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
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
        parent: true,
        _count: {
          select: {
            subtasks: true,
            dependencies: true,
            dependents: true,
          },
        },
      },
      orderBy: options.sortBy
        ? {
            [options.sortBy]: options.sortOrder || 'desc',
          }
        : undefined,
      skip: options.page && options.pageSize ? (options.page - 1) * options.pageSize : undefined,
      take: options.pageSize,
    }),
  ])

  return {
    total,
    tasks,
  }
}

export async function updateTaskDependencies(
  taskId: string,
  dependencies: string[],
  userId: string
) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      dependencies: {
        connect: dependencies.map((id) => ({ id })),
      },
    },
    include: {
      project: true,
    },
  })

  // Log activity
  await logActivity({
    type: 'task.dependencies_updated',
    action: 'updated',
    entityType: 'task',
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      dependencies,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function moveTask(
  taskId: string,
  targetProjectId: string,
  userId: string
) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      projectId: targetProjectId,
    },
    include: {
      project: true,
    },
  })

  // Log activity
  await logActivity({
    type: 'task.moved',
    action: 'moved',
    entityType: 'task',
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      targetProjectId,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function getTaskStats(projectId: string) {
  const stats = await prisma.task.groupBy({
    by: ['status'],
    where: {
      projectId,
    },
    _count: true,
  })

  const priorityStats = await prisma.task.groupBy({
    by: ['priority'],
    where: {
      projectId,
    },
    _count: true,
  })

  const assigneeStats = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: {
      projectId,
      assigneeId: { not: null },
    },
    _count: true,
  })

  return {
    byStatus: stats,
    byPriority: priorityStats,
    byAssignee: assigneeStats,
  }
}
