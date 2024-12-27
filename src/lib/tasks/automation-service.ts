import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const automationTriggerSchema = z.enum([
  "on_create",
  "on_status_change",
  "on_assignee_change",
  "on_due_date_change",
  "on_priority_change",
  "on_custom_field_change",
  "on_comment",
  "on_attachment",
  "on_dependency_change",
  "on_time_tracked",
  "on_schedule",
])

export const automationConditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
    "changed_to",
    "changed_from",
    "was_changed",
    "was_not_changed",
  ]),
  value: z.any(),
})

export const automationActionSchema = z.object({
  type: z.enum([
    "update_field",
    "send_notification",
    "create_task",
    "update_status",
    "assign_user",
    "add_comment",
    "add_checklist",
    "add_dependency",
    "trigger_webhook",
    "send_email",
    "start_time_tracking",
    "stop_time_tracking",
  ]),
  params: z.record(z.any()),
})

export const automationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  trigger: automationTriggerSchema,
  conditions: z.array(automationConditionSchema),
  actions: z.array(automationActionSchema),
  metadata: z
    .object({
      schedule: z.string().optional(), // Cron expression for scheduled triggers
      priority: z.number().optional(),
      maxRuns: z.number().optional(),
      cooldown: z.number().optional(), // Minimum time between runs in seconds
      errorHandling: z
        .object({
          retryCount: z.number().optional(),
          retryDelay: z.number().optional(),
          fallbackAction: automationActionSchema.optional(),
        })
        .optional(),
    })
    .optional(),
})

export type AutomationRule = z.infer<typeof automationRuleSchema>

export async function createAutomationRule(
  projectId: string,
  data: AutomationRule
) {
  return prisma.automationRule.create({
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      trigger: data.trigger,
      conditions: JSON.stringify(data.conditions),
      actions: JSON.stringify(data.actions),
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      project: { connect: { id: projectId } },
    },
  })
}

export async function updateAutomationRule(
  id: string,
  data: Partial<AutomationRule>
) {
  return prisma.automationRule.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      trigger: data.trigger,
      conditions: data.conditions
        ? JSON.stringify(data.conditions)
        : undefined,
      actions: data.actions ? JSON.stringify(data.actions) : undefined,
      metadata: data.metadata
        ? JSON.stringify(data.metadata)
        : undefined,
    },
  })
}

export async function deleteAutomationRule(id: string) {
  return prisma.automationRule.delete({
    where: { id },
  })
}

export async function getProjectAutomationRules(projectId: string) {
  const rules = await prisma.automationRule.findMany({
    where: { projectId },
    orderBy: [
      { metadata: "desc" }, // Sort by priority if exists in metadata
      { name: "asc" },
    ],
  })

  return rules.map((rule) => ({
    ...rule,
    conditions: JSON.parse(rule.conditions as string),
    actions: JSON.parse(rule.actions as string),
    metadata: rule.metadata ? JSON.parse(rule.metadata as string) : null,
  }))
}

export async function evaluateCondition(
  condition: z.infer<typeof automationConditionSchema>,
  context: Record<string, any>
) {
  const { field, operator, value } = condition
  const fieldValue = context[field]

  switch (operator) {
    case "equals":
      return fieldValue === value
    case "not_equals":
      return fieldValue !== value
    case "contains":
      return String(fieldValue).includes(String(value))
    case "not_contains":
      return !String(fieldValue).includes(String(value))
    case "greater_than":
      return fieldValue > value
    case "less_than":
      return fieldValue < value
    case "is_empty":
      return !fieldValue || fieldValue.length === 0
    case "is_not_empty":
      return fieldValue && fieldValue.length > 0
    case "changed_to":
      return (
        context._changes &&
        context._changes[field] &&
        context._changes[field].new === value
      )
    case "changed_from":
      return (
        context._changes &&
        context._changes[field] &&
        context._changes[field].old === value
      )
    case "was_changed":
      return context._changes && field in context._changes
    case "was_not_changed":
      return !context._changes || !(field in context._changes)
    default:
      return false
  }
}

export async function executeAction(
  action: z.infer<typeof automationActionSchema>,
  context: Record<string, any>
) {
  const { type, params } = action

  switch (type) {
    case "update_field":
      return prisma.task.update({
        where: { id: context.taskId },
        data: {
          [params.field]: params.value,
        },
      })

    case "send_notification":
      return prisma.notification.create({
        data: {
          type: "automation",
          title: params.title,
          message: params.message,
          user: { connect: { id: params.userId } },
          metadata: JSON.stringify({
            taskId: context.taskId,
            automationId: context.automationId,
          }),
        },
      })

    case "create_task":
      return prisma.task.create({
        data: {
          title: params.title,
          description: params.description,
          project: { connect: { id: context.projectId } },
          list: { connect: { id: params.listId } },
          type: params.typeId
            ? { connect: { id: params.typeId } }
            : undefined,
          status: params.statusId
            ? { connect: { id: params.statusId } }
            : undefined,
          assignee: params.assigneeId
            ? { connect: { id: params.assigneeId } }
            : undefined,
          priority: params.priority,
          dueDate: params.dueDate,
          customFields: params.customFields
            ? JSON.stringify(params.customFields)
            : null,
        },
      })

    case "update_status":
      return prisma.task.update({
        where: { id: context.taskId },
        data: {
          status: { connect: { id: params.statusId } },
        },
      })

    case "assign_user":
      return prisma.task.update({
        where: { id: context.taskId },
        data: {
          assignee: { connect: { id: params.userId } },
        },
      })

    case "add_comment":
      return prisma.comment.create({
        data: {
          content: params.content,
          task: { connect: { id: context.taskId } },
          user: { connect: { id: context.userId } },
          system: true,
        },
      })

    case "add_checklist":
      return prisma.checklist.create({
        data: {
          name: params.name,
          task: { connect: { id: context.taskId } },
          items: {
            createMany: {
              data: params.items,
            },
          },
        },
      })

    case "add_dependency":
      return prisma.taskDependency.create({
        data: {
          type: params.type,
          fromTask: { connect: { id: context.taskId } },
          toTask: { connect: { id: params.dependencyTaskId } },
        },
      })

    case "trigger_webhook":
      // Implement webhook triggering logic
      return

    case "send_email":
      // Implement email sending logic
      return

    case "start_time_tracking":
      return prisma.timeEntry.create({
        data: {
          task: { connect: { id: context.taskId } },
          user: { connect: { id: params.userId } },
          startTime: new Date(),
          description: params.description,
          billable: params.billable || false,
        },
      })

    case "stop_time_tracking":
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          taskId: context.taskId,
          userId: params.userId,
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

    default:
      throw new Error(`Unknown action type: ${type}`)
  }
}

export async function processAutomationRules(
  trigger: z.infer<typeof automationTriggerSchema>,
  context: Record<string, any>
) {
  const rules = await prisma.automationRule.findMany({
    where: {
      projectId: context.projectId,
      trigger,
      enabled: true,
    },
  })

  for (const rule of rules) {
    try {
      const conditions = JSON.parse(rule.conditions as string)
      const actions = JSON.parse(rule.actions as string)
      const metadata = rule.metadata
        ? JSON.parse(rule.metadata as string)
        : null

      // Check cooldown
      if (metadata?.cooldown) {
        const lastRun = await prisma.automationRun.findFirst({
          where: { ruleId: rule.id },
          orderBy: { createdAt: "desc" },
        })

        if (
          lastRun &&
          Date.now() - lastRun.createdAt.getTime() <
            metadata.cooldown * 1000
        ) {
          continue
        }
      }

      // Check max runs
      if (metadata?.maxRuns) {
        const runCount = await prisma.automationRun.count({
          where: { ruleId: rule.id },
        })

        if (runCount >= metadata.maxRuns) {
          continue
        }
      }

      // Evaluate conditions
      const conditionsMet = conditions.every((condition: any) =>
        evaluateCondition(condition, context)
      )

      if (conditionsMet) {
        // Execute actions with retry logic
        const maxRetries = metadata?.errorHandling?.retryCount || 0
        const retryDelay = metadata?.errorHandling?.retryDelay || 1000

        for (const action of actions) {
          let attempts = 0
          let success = false

          while (attempts <= maxRetries && !success) {
            try {
              await executeAction(action, {
                ...context,
                automationId: rule.id,
              })
              success = true
            } catch (error) {
              attempts++
              if (attempts <= maxRetries) {
                await new Promise((resolve) =>
                  setTimeout(resolve, retryDelay)
                )
              } else if (metadata?.errorHandling?.fallbackAction) {
                await executeAction(
                  metadata.errorHandling.fallbackAction,
                  {
                    ...context,
                    automationId: rule.id,
                    error,
                  }
                )
              }
            }
          }
        }

        // Record automation run
        await prisma.automationRun.create({
          data: {
            rule: { connect: { id: rule.id } },
            trigger,
            context: JSON.stringify(context),
            success: true,
          },
        })
      }
    } catch (error) {
      console.error(
        `Error processing automation rule ${rule.id}:`,
        error
      )
      
      // Record failed automation run
      await prisma.automationRun.create({
        data: {
          rule: { connect: { id: rule.id } },
          trigger,
          context: JSON.stringify(context),
          success: false,
          error: JSON.stringify(error),
        },
      })
    }
  }
}
