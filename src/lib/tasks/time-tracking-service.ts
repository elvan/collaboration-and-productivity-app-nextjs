import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const timeEntrySchema = z.object({
  id: z.string().optional(),
  taskId: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(false),
  metadata: z
    .object({
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customData: z.record(z.any()).optional(),
    })
    .optional(),
})

export type TimeEntry = z.infer<typeof timeEntrySchema>

export async function startTimeTracking(
  taskId: string,
  userId: string,
  data?: {
    description?: string
    billable?: boolean
    metadata?: Record<string, any>
  }
) {
  // Stop any active time entries for this user
  await stopTimeTracking(userId)

  return prisma.timeEntry.create({
    data: {
      task: { connect: { id: taskId } },
      user: { connect: { id: userId } },
      startTime: new Date(),
      description: data?.description,
      billable: data?.billable || false,
      metadata: data?.metadata ? JSON.stringify(data.metadata) : null,
    },
  })
}

export async function stopTimeTracking(userId: string) {
  const activeEntry = await prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null,
    },
  })

  if (activeEntry) {
    const endTime = new Date()
    const duration = Math.round(
      (endTime.getTime() - activeEntry.startTime.getTime()) / 1000
    )

    return prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        endTime,
        duration,
      },
    })
  }
}

export async function updateTimeEntry(
  id: string,
  data: Partial<TimeEntry>
) {
  return prisma.timeEntry.update({
    where: { id },
    data: {
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      description: data.description,
      billable: data.billable,
      metadata: data.metadata
        ? JSON.stringify(data.metadata)
        : undefined,
    },
  })
}

export async function deleteTimeEntry(id: string) {
  return prisma.timeEntry.delete({
    where: { id },
  })
}

export async function getTaskTimeEntries(taskId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  })

  return entries.map((entry) => ({
    ...entry,
    metadata: entry.metadata
      ? JSON.parse(entry.metadata as string)
      : null,
  }))
}

export async function getUserTimeEntries(
  userId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    taskId?: string
    billable?: boolean
  }
) {
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      ...(options?.startDate && {
        startTime: { gte: options.startDate },
      }),
      ...(options?.endDate && {
        startTime: { lte: options.endDate },
      }),
      ...(options?.taskId && { taskId: options.taskId }),
      ...(options?.billable !== undefined && {
        billable: options.billable,
      }),
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { startTime: "desc" },
  })

  return entries.map((entry) => ({
    ...entry,
    metadata: entry.metadata
      ? JSON.parse(entry.metadata as string)
      : null,
  }))
}

export async function getTaskTimeStats(taskId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    select: {
      duration: true,
      billable: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const totalTime = entries.reduce(
    (sum, entry) => sum + (entry.duration || 0),
    0
  )
  const billableTime = entries.reduce(
    (sum, entry) => sum + (entry.billable ? entry.duration || 0 : 0),
    0
  )

  const userStats = entries.reduce((stats, entry) => {
    const userId = entry.user.id
    if (!stats[userId]) {
      stats[userId] = {
        user: entry.user,
        totalTime: 0,
        billableTime: 0,
      }
    }
    stats[userId].totalTime += entry.duration || 0
    if (entry.billable) {
      stats[userId].billableTime += entry.duration || 0
    }
    return stats
  }, {} as Record<string, any>)

  return {
    totalTime,
    billableTime,
    userStats: Object.values(userStats),
  }
}

export async function getProjectTimeStats(
  projectId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    userId?: string
  }
) {
  const entries = await prisma.timeEntry.findMany({
    where: {
      task: { projectId },
      ...(options?.startDate && {
        startTime: { gte: options.startDate },
      }),
      ...(options?.endDate && {
        startTime: { lte: options.endDate },
      }),
      ...(options?.userId && { userId: options.userId }),
    },
    select: {
      duration: true,
      billable: true,
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const totalTime = entries.reduce(
    (sum, entry) => sum + (entry.duration || 0),
    0
  )
  const billableTime = entries.reduce(
    (sum, entry) => sum + (entry.billable ? entry.duration || 0 : 0),
    0
  )

  const taskStats = entries.reduce((stats, entry) => {
    const taskId = entry.task.id
    if (!stats[taskId]) {
      stats[taskId] = {
        task: entry.task,
        totalTime: 0,
        billableTime: 0,
      }
    }
    stats[taskId].totalTime += entry.duration || 0
    if (entry.billable) {
      stats[taskId].billableTime += entry.duration || 0
    }
    return stats
  }, {} as Record<string, any>)

  const userStats = entries.reduce((stats, entry) => {
    const userId = entry.user.id
    if (!stats[userId]) {
      stats[userId] = {
        user: entry.user,
        totalTime: 0,
        billableTime: 0,
      }
    }
    stats[userId].totalTime += entry.duration || 0
    if (entry.billable) {
      stats[userId].billableTime += entry.duration || 0
    }
    return stats
  }, {} as Record<string, any>)

  return {
    totalTime,
    billableTime,
    taskStats: Object.values(taskStats),
    userStats: Object.values(userStats),
  }
}
