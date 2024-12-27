import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const taskTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  typeId: z.string().optional(),
  statusId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  estimatedTime: z.number().optional(),
  customFields: z.record(z.any()).optional(),
  checklists: z
    .array(
      z.object({
        name: z.string(),
        items: z.array(
          z.object({
            content: z.string(),
            checked: z.boolean().default(false),
          })
        ),
      })
    )
    .optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        typeId: z.string().optional(),
        statusId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        estimatedTime: z.number().optional(),
        customFields: z.record(z.any()).optional(),
      })
    )
    .optional(),
  automations: z
    .array(
      z.object({
        trigger: z.enum([
          "on_create",
          "on_status_change",
          "on_assignee_change",
          "on_due_date_change",
          "on_priority_change",
          "on_custom_field_change",
        ]),
        conditions: z.array(
          z.object({
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
            ]),
            value: z.any(),
          })
        ),
        actions: z.array(
          z.object({
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
            ]),
            params: z.record(z.any()),
          })
        ),
      })
    )
    .optional(),
})

export type TaskTemplate = z.infer<typeof taskTemplateSchema>

export async function createTaskTemplate(
  projectId: string,
  data: TaskTemplate
) {
  return prisma.taskTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      typeId: data.typeId,
      statusId: data.statusId,
      priority: data.priority,
      estimatedTime: data.estimatedTime,
      customFields: data.customFields
        ? JSON.stringify(data.customFields)
        : null,
      checklists: data.checklists
        ? JSON.stringify(data.checklists)
        : null,
      subtasks: data.subtasks ? JSON.stringify(data.subtasks) : null,
      automations: data.automations
        ? JSON.stringify(data.automations)
        : null,
      project: { connect: { id: projectId } },
    },
  })
}

export async function updateTaskTemplate(
  id: string,
  data: Partial<TaskTemplate>
) {
  return prisma.taskTemplate.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      typeId: data.typeId,
      statusId: data.statusId,
      priority: data.priority,
      estimatedTime: data.estimatedTime,
      customFields: data.customFields
        ? JSON.stringify(data.customFields)
        : undefined,
      checklists: data.checklists
        ? JSON.stringify(data.checklists)
        : undefined,
      subtasks: data.subtasks
        ? JSON.stringify(data.subtasks)
        : undefined,
      automations: data.automations
        ? JSON.stringify(data.automations)
        : undefined,
    },
  })
}

export async function deleteTaskTemplate(id: string) {
  return prisma.taskTemplate.delete({
    where: { id },
  })
}

export async function getProjectTaskTemplates(projectId: string) {
  const templates = await prisma.taskTemplate.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  })

  return templates.map((template) => ({
    ...template,
    customFields: template.customFields
      ? JSON.parse(template.customFields as string)
      : null,
    checklists: template.checklists
      ? JSON.parse(template.checklists as string)
      : null,
    subtasks: template.subtasks
      ? JSON.parse(template.subtasks as string)
      : null,
    automations: template.automations
      ? JSON.parse(template.automations as string)
      : null,
  }))
}

export async function createTaskFromTemplate(
  templateId: string,
  projectId: string,
  listId: string,
  data?: {
    title?: string
    description?: string
    assigneeId?: string
    dueDate?: Date
    customFields?: Record<string, any>
  }
) {
  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  const task = await prisma.task.create({
    data: {
      title: data?.title || template.name,
      description: data?.description || template.description,
      typeId: template.typeId,
      statusId: template.statusId,
      priority: template.priority,
      estimatedTime: template.estimatedTime,
      customFields: JSON.stringify({
        ...(template.customFields
          ? JSON.parse(template.customFields as string)
          : {}),
        ...(data?.customFields || {}),
      }),
      project: { connect: { id: projectId } },
      list: { connect: { id: listId } },
      assignee: data?.assigneeId
        ? { connect: { id: data.assigneeId } }
        : undefined,
      dueDate: data?.dueDate,
    },
  })

  if (template.checklists) {
    const checklists = JSON.parse(template.checklists as string)
    for (const checklist of checklists) {
      await prisma.checklist.create({
        data: {
          name: checklist.name,
          items: {
            createMany: {
              data: checklist.items,
            },
          },
          task: { connect: { id: task.id } },
        },
      })
    }
  }

  if (template.subtasks) {
    const subtasks = JSON.parse(template.subtasks as string)
    for (const subtask of subtasks) {
      await prisma.task.create({
        data: {
          ...subtask,
          customFields: subtask.customFields
            ? JSON.stringify(subtask.customFields)
            : null,
          project: { connect: { id: projectId } },
          list: { connect: { id: listId } },
          parent: { connect: { id: task.id } },
        },
      })
    }
  }

  if (template.automations) {
    const automations = JSON.parse(template.automations as string)
    await prisma.taskAutomation.createMany({
      data: automations.map((automation: any) => ({
        ...automation,
        taskId: task.id,
      })),
    })
  }

  return task
}
