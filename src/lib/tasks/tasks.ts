import { prisma } from "@/lib/prisma"
import { Task } from "@prisma/client"

export interface ITask {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high"
  assigneeId?: string
  projectId?: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  tags: string[]
}

export async function filterTasks(filters: {
  status?: string[]
  priority?: string[]
  assigneeId?: string
  projectId?: string
  search?: string
  dueDate?: { start: Date; end: Date }
}) {
  const where = {
    ...(filters.status?.length && { status: { in: filters.status } }),
    ...(filters.priority?.length && { priority: { in: filters.priority } }),
    ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
    ...(filters.dueDate && {
      dueDate: {
        gte: filters.dueDate.start,
        lte: filters.dueDate.end,
      },
    }),
  }

  return prisma.task.findMany({
    where,
    include: {
      assignee: true,
      project: true,
    },
  })
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      project: true,
    },
  })
}

export async function getAllTasks(): Promise<Task[]> {
  return prisma.task.findMany({
    include: {
      assignee: true,
      project: true,
    },
  })
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  return prisma.task.create({
    data: data as any,
    include: {
      assignee: true,
      project: true,
    },
  })
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: true,
      project: true,
    },
  })
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.task.delete({
    where: { id },
  })
}

export async function updateTaskStatus(
  id: string,
  status: Task["status"]
): Promise<void> {
  await prisma.task.update({
    where: { id },
    data: { status },
  })
}

export async function assignTask(
  taskId: string,
  assigneeId: string
): Promise<void> {
  // TODO: Implement actual database query
}

export async function updateTaskPriority(
  taskId: string,
  priority: Task["priority"]
): Promise<void> {
  // TODO: Implement actual database query
}
