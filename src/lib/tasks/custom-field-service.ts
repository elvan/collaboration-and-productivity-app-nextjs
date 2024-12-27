import { prisma } from "@/lib/prisma"
import { z } from "zod"

const customFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "number", "date", "select", "multiselect", "user"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
})

export type CustomField = z.infer<typeof customFieldSchema>

export async function createCustomField(
  projectId: string,
  data: CustomField
) {
  return prisma.customField.create({
    data: {
      ...data,
      options: data.options ? JSON.stringify(data.options) : null,
      projectId,
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
      ...data,
      options: data.options ? JSON.stringify(data.options) : undefined,
    },
  })
}

export async function deleteCustomField(id: string) {
  return prisma.customField.delete({
    where: { id },
  })
}

export async function getProjectCustomFields(projectId: string) {
  return prisma.customField.findMany({
    where: { projectId },
    include: {
      values: true,
    },
  })
}

export async function setCustomFieldValue(
  taskId: string,
  customFieldId: string,
  value: any
) {
  return prisma.customFieldValue.upsert({
    where: {
      taskId_customFieldId: {
        taskId,
        customFieldId,
      },
    },
    update: {
      value: JSON.stringify(value),
    },
    create: {
      taskId,
      customFieldId,
      value: JSON.stringify(value),
    },
  })
}

export async function getTaskCustomFieldValues(taskId: string) {
  const values = await prisma.customFieldValue.findMany({
    where: { taskId },
    include: {
      customField: true,
    },
  })

  return values.map((v) => ({
    ...v,
    value: JSON.parse(v.value as string),
  }))
}

export async function validateCustomFieldValue(
  fieldType: string,
  value: any
): Promise<boolean> {
  switch (fieldType) {
    case "text":
      return typeof value === "string"
    case "number":
      return typeof value === "number"
    case "date":
      return !isNaN(Date.parse(value))
    case "select":
      return typeof value === "string"
    case "multiselect":
      return Array.isArray(value) && value.every((v) => typeof v === "string")
    case "user":
      return typeof value === "string" && value.length > 0
    default:
      return false
  }
}
