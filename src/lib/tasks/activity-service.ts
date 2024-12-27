import { prisma } from "@/lib/prisma"
import { z } from "zod"

const activitySchema = z.object({
  type: z.enum([
    "task_created",
    "task_updated",
    "task_deleted",
    "status_changed",
    "priority_changed",
    "assignee_changed",
    "due_date_changed",
    "progress_updated",
    "comment_created",
    "comment_edited",
    "comment_deleted",
    "attachment_added",
    "attachment_removed",
    "dependency_added",
    "dependency_removed",
    "subtask_added",
    "subtask_removed",
    "custom_field_updated",
    "workflow_triggered",
    "automation_executed",
  ]),
  taskId: z.string(),
  userId: z.string(),
  metadata: z
    .object({
      previousValue: z.any().optional(),
      newValue: z.any().optional(),
      commentId: z.string().optional(),
      attachmentId: z.string().optional(),
      dependencyId: z.string().optional(),
      customFieldId: z.string().optional(),
      workflowId: z.string().optional(),
      automationId: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
})

export type TaskActivity = z.infer<typeof activitySchema>

export async function createActivity(data: TaskActivity) {
  return prisma.activity.create({
    data: {
      type: data.type,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      task: { connect: { id: data.taskId } },
      user: { connect: { id: data.userId } },
    },
    include: {
      user: true,
      task: true,
    },
  })
}

export async function getTaskActivities(taskId: string) {
  const activities = await prisma.activity.findMany({
    where: { taskId },
    include: {
      user: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata
      ? JSON.parse(activity.metadata as string)
      : null,
  }))
}

export async function getProjectActivities(projectId: string) {
  const activities = await prisma.activity.findMany({
    where: {
      task: {
        projectId,
      },
    },
    include: {
      user: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata
      ? JSON.parse(activity.metadata as string)
      : null,
  }))
}

export async function getUserActivities(userId: string) {
  const activities = await prisma.activity.findMany({
    where: { userId },
    include: {
      user: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata
      ? JSON.parse(activity.metadata as string)
      : null,
  }))
}

export async function getActivityStats(taskId: string) {
  const activities = await prisma.activity.findMany({
    where: { taskId },
    select: {
      type: true,
      createdAt: true,
    },
  })

  const stats = {
    totalCount: activities.length,
    byType: {} as Record<string, number>,
    byDate: {} as Record<string, number>,
  }

  for (const activity of activities) {
    // Count by type
    if (!stats.byType[activity.type]) {
      stats.byType[activity.type] = 0
    }
    stats.byType[activity.type]++

    // Count by date
    const date = activity.createdAt.toISOString().split("T")[0]
    if (!stats.byDate[date]) {
      stats.byDate[date] = 0
    }
    stats.byDate[date]++
  }

  return stats
}

export async function getActivityFeed(
  userId: string,
  options: {
    includeComments?: boolean
    includeAttachments?: boolean
    includeDependencies?: boolean
    includeWorkflow?: boolean
    startDate?: Date
    endDate?: Date
    limit?: number
  } = {}
) {
  const {
    includeComments = true,
    includeAttachments = true,
    includeDependencies = true,
    includeWorkflow = true,
    startDate,
    endDate,
    limit = 50,
  } = options

  // Build type filter based on options
  const typeFilter: string[] = ["task_created", "task_updated", "task_deleted"]
  if (includeComments) {
    typeFilter.push("comment_created", "comment_edited", "comment_deleted")
  }
  if (includeAttachments) {
    typeFilter.push("attachment_added", "attachment_removed")
  }
  if (includeDependencies) {
    typeFilter.push("dependency_added", "dependency_removed")
  }
  if (includeWorkflow) {
    typeFilter.push("workflow_triggered", "automation_executed")
  }

  const activities = await prisma.activity.findMany({
    where: {
      task: {
        project: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      type: {
        in: typeFilter,
      },
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    },
    include: {
      user: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata
      ? JSON.parse(activity.metadata as string)
      : null,
  }))
}

export function formatActivityMessage(
  activity: TaskActivity & {
    user: { name: string }
    task: { title: string }
  }
) {
  const metadata = activity.metadata || {}
  const userName = activity.user.name
  const taskTitle = activity.task.title

  switch (activity.type) {
    case "task_created":
      return `${userName} created task "${taskTitle}"`

    case "task_updated":
      return `${userName} updated task "${taskTitle}"`

    case "task_deleted":
      return `${userName} deleted task "${taskTitle}"`

    case "status_changed":
      return `${userName} changed status of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

    case "priority_changed":
      return `${userName} changed priority of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

    case "assignee_changed":
      return `${userName} changed assignee of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

    case "due_date_changed":
      return `${userName} changed due date of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

    case "progress_updated":
      return `${userName} updated progress of "${taskTitle}" to ${metadata.newValue}%`

    case "comment_created":
      return `${userName} commented on "${taskTitle}"`

    case "comment_edited":
      return `${userName} edited a comment on "${taskTitle}"`

    case "comment_deleted":
      return `${userName} deleted a comment from "${taskTitle}"`

    case "attachment_added":
      return `${userName} added an attachment to "${taskTitle}"`

    case "attachment_removed":
      return `${userName} removed an attachment from "${taskTitle}"`

    case "dependency_added":
      return `${userName} added a dependency to "${taskTitle}"`

    case "dependency_removed":
      return `${userName} removed a dependency from "${taskTitle}"`

    case "subtask_added":
      return `${userName} added a subtask to "${taskTitle}"`

    case "subtask_removed":
      return `${userName} removed a subtask from "${taskTitle}"`

    case "custom_field_updated":
      return `${userName} updated custom field "${metadata.customFieldId}" on "${taskTitle}"`

    case "workflow_triggered":
      return `${userName} triggered workflow "${metadata.workflowId}" on "${taskTitle}"`

    case "automation_executed":
      return `Automation "${metadata.automationId}" executed on "${taskTitle}"`

    default:
      return `${userName} performed an action on "${taskTitle}"`
  }
}
