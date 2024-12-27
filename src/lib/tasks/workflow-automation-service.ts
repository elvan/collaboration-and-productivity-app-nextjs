import { prisma } from "@/lib/prisma"
import { z } from "zod"

const workflowTriggerSchema = z.object({
  type: z.enum([
    "status_changed",
    "priority_changed",
    "assignee_changed",
    "due_date_changed",
    "comment_added",
    "attachment_added",
    "custom_field_changed",
  ]),
  conditions: z.record(z.any()).optional(),
})

const workflowActionSchema = z.object({
  type: z.enum([
    "update_task",
    "create_task",
    "assign_task",
    "send_notification",
    "send_email",
    "update_custom_field",
    "trigger_webhook",
  ]),
  params: z.record(z.any()),
})

const workflowAutomationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  trigger: workflowTriggerSchema,
  actions: z.array(workflowActionSchema),
  enabled: z.boolean().default(true),
})

export type WorkflowAutomation = z.infer<typeof workflowAutomationSchema>

export async function createWorkflowAutomation(data: WorkflowAutomation) {
  return prisma.workflowAutomation.create({
    data: {
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      trigger: JSON.stringify(data.trigger),
      actions: JSON.stringify(data.actions),
      enabled: data.enabled,
    },
  })
}

export async function updateWorkflowAutomation(
  id: string,
  data: Partial<WorkflowAutomation>
) {
  return prisma.workflowAutomation.update({
    where: { id },
    data: {
      ...data,
      trigger: data.trigger ? JSON.stringify(data.trigger) : undefined,
      actions: data.actions ? JSON.stringify(data.actions) : undefined,
    },
  })
}

export async function deleteWorkflowAutomation(id: string) {
  return prisma.workflowAutomation.delete({
    where: { id },
  })
}

export async function getProjectWorkflowAutomations(projectId: string) {
  const automations = await prisma.workflowAutomation.findMany({
    where: { projectId },
  })

  return automations.map((automation) => ({
    ...automation,
    trigger: JSON.parse(automation.trigger as string),
    actions: JSON.parse(automation.actions as string),
  }))
}

export async function executeWorkflowAutomations(
  projectId: string,
  event: {
    type: string
    taskId: string
    data: any
    previousData?: any
  }
) {
  const automations = await getProjectWorkflowAutomations(projectId)
  const task = await prisma.task.findUnique({
    where: { id: event.taskId },
    include: {
      assignee: true,
      project: true,
      customFieldValues: {
        include: {
          customField: true,
        },
      },
    },
  })

  if (!task) return

  for (const automation of automations) {
    if (!automation.enabled) continue

    const trigger = automation.trigger
    if (trigger.type !== event.type) continue

    // Check conditions
    if (trigger.conditions) {
      const conditionsMet = evaluateConditions(trigger.conditions, {
        task,
        event,
      })
      if (!conditionsMet) continue
    }

    // Execute actions
    for (const action of automation.actions) {
      await executeAction(action, {
        task,
        event,
        projectId,
      })
    }
  }
}

function evaluateConditions(conditions: any, context: any): boolean {
  // Implement condition evaluation logic
  // Example: { field: "status", operator: "equals", value: "done" }
  const { task, event } = context

  for (const [field, condition] of Object.entries(conditions)) {
    const value = task[field]
    const previousValue = event.previousData?.[field]

    switch (condition.operator) {
      case "equals":
        if (value !== condition.value) return false
        break
      case "not_equals":
        if (value === condition.value) return false
        break
      case "changed_to":
        if (value !== condition.value || previousValue === condition.value)
          return false
        break
      case "changed_from":
        if (previousValue !== condition.value) return false
        break
      // Add more operators as needed
    }
  }

  return true
}

async function executeAction(action: any, context: any) {
  const { task, event, projectId } = context

  switch (action.type) {
    case "update_task":
      await prisma.task.update({
        where: { id: task.id },
        data: action.params,
      })
      break

    case "create_task":
      await prisma.task.create({
        data: {
          ...action.params,
          projectId,
        },
      })
      break

    case "assign_task":
      await prisma.task.update({
        where: { id: task.id },
        data: {
          assigneeId: action.params.assigneeId,
        },
      })
      break

    case "send_notification":
      await prisma.notification.create({
        data: {
          type: "task_automation",
          title: action.params.title,
          content: action.params.content,
          userId: action.params.userId,
          taskId: task.id,
        },
      })
      break

    case "send_email":
      // Integrate with email service
      break

    case "update_custom_field":
      await prisma.customFieldValue.upsert({
        where: {
          taskId_customFieldId: {
            taskId: task.id,
            customFieldId: action.params.customFieldId,
          },
        },
        create: {
          taskId: task.id,
          customFieldId: action.params.customFieldId,
          value: JSON.stringify(action.params.value),
        },
        update: {
          value: JSON.stringify(action.params.value),
        },
      })
      break

    case "trigger_webhook":
      // Integrate with webhook service
      break
  }
}
