import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const customFieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "user",
  "url",
  "email",
  "phone",
  "checkbox",
  "currency",
  "color",
  "file",
  "location",
  "rating",
])

export const customFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: customFieldTypeSchema,
  description: z.string().optional(),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        color: z.string().optional(),
      })
    )
    .optional(),
  defaultValue: z.any().optional(),
  metadata: z
    .object({
      placeholder: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      currency: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
})

export type CustomField = z.infer<typeof customFieldSchema>

export const taskTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  fields: z.array(customFieldSchema),
  metadata: z
    .object({
      defaultStatus: z.string().optional(),
      defaultPriority: z.string().optional(),
      defaultAssignee: z.string().optional(),
      automations: z.array(z.string()).optional(),
    })
    .optional(),
})

export type TaskType = z.infer<typeof taskTypeSchema>

export const taskStatusSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  color: z.string(),
  description: z.string().optional(),
  type: z.enum(["start", "progress", "done", "canceled", "custom"]),
  order: z.number(),
  metadata: z
    .object({
      icon: z.string().optional(),
      automations: z.array(z.string()).optional(),
    })
    .optional(),
})

export type TaskStatus = z.infer<typeof taskStatusSchema>

export async function createCustomField(
  projectId: string,
  data: CustomField
) {
  return prisma.customField.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      required: data.required,
      options: data.options ? JSON.stringify(data.options) : null,
      defaultValue: data.defaultValue
        ? JSON.stringify(data.defaultValue)
        : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      project: { connect: { id: projectId } },
    },
  })
}

export async function updateCustomField(
  id: string,
  data: Partial<CustomField>
) {
  return prisma.customField.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      required: data.required,
      options: data.options ? JSON.stringify(data.options) : undefined,
      defaultValue: data.defaultValue
        ? JSON.stringify(data.defaultValue)
        : undefined,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

export async function deleteCustomField(id: string) {
  return prisma.customField.delete({
    where: { id },
  })
}

export async function createTaskType(
  projectId: string,
  data: TaskType
) {
  return prisma.taskType.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      fields: JSON.stringify(data.fields),
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      project: { connect: { id: projectId } },
    },
  })
}

export async function updateTaskType(
  id: string,
  data: Partial<TaskType>
) {
  return prisma.taskType.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      fields: data.fields ? JSON.stringify(data.fields) : undefined,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

export async function deleteTaskType(id: string) {
  return prisma.taskType.delete({
    where: { id },
  })
}

export async function createTaskStatus(
  projectId: string,
  data: TaskStatus
) {
  return prisma.taskStatus.create({
    data: {
      name: data.name,
      color: data.color,
      description: data.description,
      type: data.type,
      order: data.order,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      project: { connect: { id: projectId } },
    },
  })
}

export async function updateTaskStatus(
  id: string,
  data: Partial<TaskStatus>
) {
  return prisma.taskStatus.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color,
      description: data.description,
      type: data.type,
      order: data.order,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

export async function deleteTaskStatus(id: string) {
  return prisma.taskStatus.delete({
    where: { id },
  })
}

export async function getProjectCustomFields(projectId: string) {
  const fields = await prisma.customField.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  })

  return fields.map((field) => ({
    ...field,
    options: field.options ? JSON.parse(field.options as string) : null,
    defaultValue: field.defaultValue
      ? JSON.parse(field.defaultValue as string)
      : null,
    metadata: field.metadata
      ? JSON.parse(field.metadata as string)
      : null,
  }))
}

export async function getProjectTaskTypes(projectId: string) {
  const types = await prisma.taskType.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  })

  return types.map((type) => ({
    ...type,
    fields: JSON.parse(type.fields as string),
    metadata: type.metadata ? JSON.parse(type.metadata as string) : null,
  }))
}

export async function getProjectTaskStatuses(projectId: string) {
  const statuses = await prisma.taskStatus.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  })

  return statuses.map((status) => ({
    ...status,
    metadata: status.metadata
      ? JSON.parse(status.metadata as string)
      : null,
  }))
}

export async function updateTaskCustomFields(
  taskId: string,
  fields: Record<string, any>
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) {
    throw new Error("Task not found")
  }

  const customFields = task.customFields
    ? JSON.parse(task.customFields as string)
    : {}

  return prisma.task.update({
    where: { id: taskId },
    data: {
      customFields: JSON.stringify({
        ...customFields,
        ...fields,
      }),
    },
  })
}

export async function getTaskCustomFields(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { customFields: true },
  })

  if (!task) {
    throw new Error("Task not found")
  }

  return task.customFields
    ? JSON.parse(task.customFields as string)
    : {}
}
