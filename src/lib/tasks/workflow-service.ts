import { prisma } from "@/lib/prisma"
import { z } from "zod"

const workflowStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  transitions: z.array(z.string()),
})

const workflowSchema = z.object({
  name: z.string().min(1),
  statuses: z.array(workflowStatusSchema),
})

const automationTriggerSchema = z.object({
  type: z.enum(["status_change", "priority_change", "assignee_change", "custom_field_change"]),
  condition: z.record(z.any()),
})

const automationActionSchema = z.object({
  type: z.enum([
    "update_status",
    "update_priority",
    "update_assignee",
    "update_custom_field",
    "send_notification",
  ]),
  params: z.record(z.any()),
})

const workflowAutomationSchema = z.object({
  name: z.string().min(1),
  trigger: automationTriggerSchema,
  actions: z.array(automationActionSchema),
  enabled: z.boolean().default(true),
})

export type Workflow = z.infer<typeof workflowSchema>
export type WorkflowAutomation = z.infer<typeof workflowAutomationSchema>

export async function createWorkflow(projectId: string, data: Workflow) {
  return prisma.workflow.create({
    data: {
      ...data,
      statuses: JSON.stringify(data.statuses),
      projectId,
    },
  })
}

export async function updateWorkflow(id: string, data: Partial<Workflow>) {
  return prisma.workflow.update({
    where: { id },
    data: {
      ...data,
      statuses: data.statuses ? JSON.stringify(data.statuses) : undefined,
    },
  })
}

export async function deleteWorkflow(id: string) {
  return prisma.workflow.delete({
    where: { id },
  })
}

export async function getProjectWorkflows(projectId: string) {
  const workflows = await prisma.workflow.findMany({
    where: { projectId },
    include: {
      automations: true,
    },
  })

  return workflows.map((w) => ({
    ...w,
    statuses: JSON.parse(w.statuses as string),
    automations: w.automations.map((a) => ({
      ...a,
      trigger: JSON.parse(a.trigger as string),
      actions: JSON.parse(a.actions as string),
    })),
  }))
}

export async function createWorkflowAutomation(
  workflowId: string,
  data: WorkflowAutomation
) {
  return prisma.workflowAutomation.create({
    data: {
      ...data,
      trigger: JSON.stringify(data.trigger),
      actions: JSON.stringify(data.actions),
      workflowId,
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

export async function executeWorkflowAutomations(
  taskId: string,
  trigger: {
    type: string
    oldValue: any
    newValue: any
  }
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          workflows: {
            include: {
              automations: true,
            },
          },
        },
      },
    },
  })

  if (!task) return

  const automations = task.project.workflows
    .flatMap((w) => w.automations)
    .filter((a) => a.enabled)
    .map((a) => ({
      ...a,
      trigger: JSON.parse(a.trigger as string),
      actions: JSON.parse(a.actions as string),
    }))

  for (const automation of automations) {
    if (automation.trigger.type === trigger.type) {
      const conditionMet = evaluateCondition(
        automation.trigger.condition,
        trigger.oldValue,
        trigger.newValue
      )

      if (conditionMet) {
        await executeActions(taskId, automation.actions)
      }
    }
  }
}

function evaluateCondition(
  condition: Record<string, any>,
  oldValue: any,
  newValue: any
): boolean {
  // Implement condition evaluation logic
  // Example: { "from": "todo", "to": "in_progress" }
  return Object.entries(condition).every(([key, value]) => {
    switch (key) {
      case "from":
        return oldValue === value
      case "to":
        return newValue === value
      default:
        return false
    }
  })
}

async function executeActions(
  taskId: string,
  actions: Array<{
    type: string
    params: Record<string, any>
  }>
) {
  for (const action of actions) {
    switch (action.type) {
      case "update_status":
        await prisma.task.update({
          where: { id: taskId },
          data: { status: action.params.status },
        })
        break
      case "update_priority":
        await prisma.task.update({
          where: { id: taskId },
          data: { priority: action.params.priority },
        })
        break
      case "update_assignee":
        await prisma.task.update({
          where: { id: taskId },
          data: { assigneeId: action.params.assigneeId },
        })
        break
      case "update_custom_field":
        await prisma.customFieldValue.upsert({
          where: {
            taskId_customFieldId: {
              taskId,
              customFieldId: action.params.fieldId,
            },
          },
          update: { value: JSON.stringify(action.params.value) },
          create: {
            taskId,
            customFieldId: action.params.fieldId,
            value: JSON.stringify(action.params.value),
          },
        })
        break
      case "send_notification":
        // Implement notification sending logic
        break
    }
  }
}
