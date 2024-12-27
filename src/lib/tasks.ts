import { prisma } from "./prisma"
import { logActivity } from "./activity"

export interface TaskCreateInput {
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  projectId: string
  assigneeId?: string
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date | null
  assigneeId?: string | null
}

export async function createTask(data: TaskCreateInput, userId: string) {
  const task = await prisma.task.create({
    data: {
      ...data,
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
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.created",
    action: "created",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
    },
    userId,
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
    data,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.updated",
    action: "updated",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
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
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.deleted",
    action: "deleted",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
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
      project: {
        select: {
          id: true,
          name: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

export async function getTasks(projectId: string, options?: {
  status?: string
  priority?: string
  assigneeId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const where = {
    projectId,
    ...(options?.status && { status: options.status }),
    ...(options?.priority && { priority: options.priority }),
    ...(options?.assigneeId && { assigneeId: options.assigneeId }),
    ...(options?.search && {
      OR: [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy = options?.sortBy
    ? { [options.sortBy]: options.sortOrder || 'desc' }
    : { createdAt: 'desc' }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy,
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
    }),
  ])

  return {
    total,
    tasks,
  }
}

export async function assignTask(
  id: string,
  assigneeId: string | null,
  userId: string
) {
  const task = await prisma.task.update({
    where: { id },
    data: { assigneeId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.assigned",
    action: "assigned",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      assigneeId: assigneeId,
      assigneeName: task.assignee?.name,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function updateTaskStatus(
  id: string,
  status: string,
  userId: string
) {
  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.status_updated",
    action: "updated",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      status,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}

export async function updateTaskPriority(
  id: string,
  priority: string,
  userId: string
) {
  const task = await prisma.task.update({
    where: { id },
    data: { priority },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "task.priority_updated",
    action: "updated",
    entityType: "task",
    entityId: task.id,
    metadata: {
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      priority,
    },
    userId,
    workspaceId: task.project.workspaceId,
  })

  return task
}
