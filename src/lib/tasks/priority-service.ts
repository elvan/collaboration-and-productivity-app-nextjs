import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addDays, isAfter, isBefore, startOfDay } from "date-fns"

const priorityLevels = {
  critical: {
    level: 5,
    color: "red",
    autoEscalation: true,
  },
  urgent: {
    level: 4,
    color: "orange",
    autoEscalation: true,
  },
  high: {
    level: 3,
    color: "yellow",
    autoEscalation: false,
  },
  medium: {
    level: 2,
    color: "blue",
    autoEscalation: false,
  },
  low: {
    level: 1,
    color: "gray",
    autoEscalation: false,
  },
}

const priorityRuleSchema = z.object({
  projectId: z.string(),
  conditions: z.object({
    dueDate: z.object({
      days: z.number(),
      priority: z.string(),
    }).optional(),
    dependencies: z.object({
      priority: z.string(),
      escalate: z.boolean(),
    }).optional(),
    inactivity: z.object({
      days: z.number(),
      priority: z.string(),
    }).optional(),
  }),
  enabled: z.boolean().default(true),
})

export type PriorityRule = z.infer<typeof priorityRuleSchema>

export async function createPriorityRule(data: PriorityRule) {
  return prisma.priorityRule.create({
    data: {
      projectId: data.projectId,
      conditions: JSON.stringify(data.conditions),
      enabled: data.enabled,
    },
  })
}

export async function updatePriorityRule(
  id: string,
  data: Partial<PriorityRule>
) {
  return prisma.priorityRule.update({
    where: { id },
    data: {
      ...data,
      conditions: data.conditions
        ? JSON.stringify(data.conditions)
        : undefined,
    },
  })
}

export async function deletePriorityRule(id: string) {
  return prisma.priorityRule.delete({
    where: { id },
  })
}

export async function getProjectPriorityRules(projectId: string) {
  const rules = await prisma.priorityRule.findMany({
    where: { projectId },
  })

  return rules.map((rule) => ({
    ...rule,
    conditions: JSON.parse(rule.conditions as string),
  }))
}

export async function updateTaskPriority(taskId: string, priority: string) {
  // Update task priority and create activity log
  const [task] = await Promise.all([
    prisma.task.update({
      where: { id: taskId },
      data: { priority },
      include: {
        project: true,
        assignee: true,
      },
    }),
    prisma.activity.create({
      data: {
        type: "task_priority_updated",
        taskId,
        metadata: JSON.stringify({
          priority,
        }),
      },
    }),
  ])

  // Trigger notifications if priority is escalated
  if (
    priorityLevels[priority as keyof typeof priorityLevels].level >
    priorityLevels[task.priority as keyof typeof priorityLevels].level
  ) {
    if (task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: "task_priority_escalated",
          title: "Task Priority Escalated",
          content: `Task "${task.title}" priority has been escalated to ${priority}`,
          userId: task.assigneeId,
          taskId: task.id,
        },
      })
    }
  }

  return task
}

export async function evaluatePriorityRules() {
  const tasks = await prisma.task.findMany({
    where: {
      status: {
        not: "done",
      },
    },
    include: {
      project: {
        include: {
          priorityRules: true,
        },
      },
      incomingRelationships: {
        where: {
          type: "depends_on",
        },
        include: {
          sourceTask: true,
        },
      },
    },
  })

  for (const task of tasks) {
    const rules = task.project.priorityRules.map((rule) => ({
      ...rule,
      conditions: JSON.parse(rule.conditions as string),
    }))

    for (const rule of rules) {
      if (!rule.enabled) continue

      let shouldUpdatePriority = false
      let newPriority = task.priority

      // Check due date conditions
      if (rule.conditions.dueDate && task.dueDate) {
        const daysUntilDue = Math.ceil(
          (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilDue <= rule.conditions.dueDate.days) {
          const rulePriorityLevel =
            priorityLevels[
              rule.conditions.dueDate.priority as keyof typeof priorityLevels
            ].level
          const currentPriorityLevel =
            priorityLevels[task.priority as keyof typeof priorityLevels]
              .level
          if (rulePriorityLevel > currentPriorityLevel) {
            newPriority = rule.conditions.dueDate.priority
            shouldUpdatePriority = true
          }
        }
      }

      // Check dependency conditions
      if (rule.conditions.dependencies) {
        const dependencyPriorityLevel =
          priorityLevels[
            rule.conditions.dependencies.priority as keyof typeof priorityLevels
          ].level
        for (const rel of task.incomingRelationships) {
          const dependencyPriority = rel.sourceTask.priority
          const currentDependencyLevel =
            priorityLevels[dependencyPriority as keyof typeof priorityLevels]
              .level
          if (currentDependencyLevel >= dependencyPriorityLevel) {
            if (rule.conditions.dependencies.escalate) {
              const escalatedLevel = Math.min(currentDependencyLevel + 1, 5)
              const escalatedPriority = Object.entries(priorityLevels).find(
                ([_, value]) => value.level === escalatedLevel
              )?.[0]
              if (escalatedPriority) {
                newPriority = escalatedPriority
                shouldUpdatePriority = true
              }
            }
          }
        }
      }

      // Check inactivity conditions
      if (rule.conditions.inactivity) {
        const lastActivity = await prisma.activity.findFirst({
          where: {
            taskId: task.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        if (lastActivity) {
          const daysSinceActivity = Math.floor(
            (Date.now() - lastActivity.createdAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          if (daysSinceActivity >= rule.conditions.inactivity.days) {
            const inactivityPriorityLevel =
              priorityLevels[
                rule.conditions.inactivity
                  .priority as keyof typeof priorityLevels
              ].level
            const currentPriorityLevel =
              priorityLevels[task.priority as keyof typeof priorityLevels]
                .level
            if (inactivityPriorityLevel > currentPriorityLevel) {
              newPriority = rule.conditions.inactivity.priority
              shouldUpdatePriority = true
            }
          }
        }
      }

      if (shouldUpdatePriority) {
        await updateTaskPriority(task.id, newPriority)
      }
    }
  }
}

// Schedule priority rule evaluation (should be called by a cron job)
export async function schedulePriorityRuleEvaluation() {
  try {
    await evaluatePriorityRules()
  } catch (error) {
    console.error("Failed to evaluate priority rules:", error)
  }
}
