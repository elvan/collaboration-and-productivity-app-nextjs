import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const customFieldTypes = [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "user",
  "url",
  "email",
  "phone",
  "currency",
] as const

export const customFieldSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(customFieldTypes),
  required: z.boolean().default(false),
  projectId: z.string(),
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
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
})

export type CustomField = z.infer<typeof customFieldSchema>

export async function createCustomField(data: CustomField) {
  return prisma.customField.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      required: data.required,
      projectId: data.projectId,
      options: data.options ? JSON.stringify(data.options) : null,
      defaultValue: data.defaultValue ? JSON.stringify(data.defaultValue) : null,
      validation: data.validation ? JSON.stringify(data.validation) : null,
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
      defaultValue: data.defaultValue
        ? JSON.stringify(data.defaultValue)
        : undefined,
      validation: data.validation
        ? JSON.stringify(data.validation)
        : undefined,
    },
  })
}

export async function deleteCustomField(id: string) {
  return prisma.customField.delete({
    where: { id },
  })
}

export async function getProjectCustomFields(projectId: string) {
  const fields = await prisma.customField.findMany({
    where: { projectId },
    include: {
      values: true,
    },
  })

  return fields.map((field) => ({
    ...field,
    options: field.options ? JSON.parse(field.options as string) : null,
    defaultValue: field.defaultValue
      ? JSON.parse(field.defaultValue as string)
      : null,
    validation: field.validation
      ? JSON.parse(field.validation as string)
      : null,
  }))
}

export async function setCustomFieldValue(
  taskId: string,
  fieldId: string,
  value: any
) {
  return prisma.customFieldValue.upsert({
    where: {
      taskId_customFieldId: {
        taskId,
        customFieldId: fieldId,
      },
    },
    create: {
      taskId,
      customFieldId: fieldId,
      value: JSON.stringify(value),
    },
    update: {
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

  return values.map((value) => ({
    ...value,
    value: JSON.parse(value.value as string),
    customField: {
      ...value.customField,
      options: value.customField.options
        ? JSON.parse(value.customField.options as string)
        : null,
      defaultValue: value.customField.defaultValue
        ? JSON.parse(value.customField.defaultValue as string)
        : null,
      validation: value.customField.validation
        ? JSON.parse(value.customField.validation as string)
        : null,
    },
  }))
}

export function validateCustomFieldValue(
  field: CustomField,
  value: any
): { valid: boolean; error?: string } {
  if (field.required && (value === null || value === undefined)) {
    return { valid: false, error: "This field is required" }
  }

  if (value === null || value === undefined) {
    return { valid: true }
  }

  switch (field.type) {
    case "text":
    case "email":
    case "url":
    case "phone":
      if (typeof value !== "string") {
        return { valid: false, error: "Value must be a string" }
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(value)) {
          return {
            valid: false,
            error: "Value does not match the required format",
          }
        }
      }
      break

    case "number":
    case "currency":
      if (typeof value !== "number") {
        return { valid: false, error: "Value must be a number" }
      }
      if (
        field.validation?.min !== undefined &&
        value < field.validation.min
      ) {
        return {
          valid: false,
          error: `Value must be at least ${field.validation.min}`,
        }
      }
      if (
        field.validation?.max !== undefined &&
        value > field.validation.max
      ) {
        return {
          valid: false,
          error: `Value must be at most ${field.validation.max}`,
        }
      }
      break

    case "date":
      if (!(value instanceof Date) && !Date.parse(value)) {
        return { valid: false, error: "Value must be a valid date" }
      }
      break

    case "select":
      if (
        field.options &&
        !field.options.some((option) => option.value === value)
      ) {
        return { valid: false, error: "Invalid option selected" }
      }
      break

    case "multiselect":
      if (!Array.isArray(value)) {
        return { valid: false, error: "Value must be an array" }
      }
      if (
        field.options &&
        !value.every((v) =>
          field.options?.some((option) => option.value === v)
        )
      ) {
        return { valid: false, error: "One or more invalid options selected" }
      }
      break

    case "user":
      // Validate user ID exists
      break
  }

  return { valid: true }
}
