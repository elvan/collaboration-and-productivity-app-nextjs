import { prisma } from "@/lib/prisma"
import { z } from "zod"

const attachmentSchema = z.object({
  taskId: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  url: z.string(),
  metadata: z
    .object({
      description: z.string().optional(),
      version: z.number().optional(),
      tags: z.array(z.string()).optional(),
      thumbnailUrl: z.string().optional(),
      previewUrl: z.string().optional(),
    })
    .optional(),
})

export type TaskAttachment = z.infer<typeof attachmentSchema>

export async function createAttachment(data: TaskAttachment) {
  return prisma.attachment.create({
    data: {
      name: data.name,
      type: data.type,
      size: data.size,
      url: data.url,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      task: {
        connect: { id: data.taskId },
      },
    },
  })
}

export async function updateAttachment(
  id: string,
  data: Partial<TaskAttachment>
) {
  return prisma.attachment.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      size: data.size,
      url: data.url,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

export async function deleteAttachment(id: string) {
  return prisma.attachment.delete({
    where: { id },
  })
}

export async function getTaskAttachments(taskId: string) {
  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  })

  return attachments.map((attachment) => ({
    ...attachment,
    metadata: attachment.metadata
      ? JSON.parse(attachment.metadata as string)
      : null,
  }))
}

export async function getAttachmentsByType(taskId: string, type: string) {
  const attachments = await prisma.attachment.findMany({
    where: { taskId, type },
    orderBy: { createdAt: "desc" },
  })

  return attachments.map((attachment) => ({
    ...attachment,
    metadata: attachment.metadata
      ? JSON.parse(attachment.metadata as string)
      : null,
  }))
}

export async function getAttachmentsByTag(taskId: string, tag: string) {
  const attachments = await prisma.attachment.findMany({
    where: {
      taskId,
      metadata: {
        path: ["tags"],
        array_contains: tag,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return attachments.map((attachment) => ({
    ...attachment,
    metadata: attachment.metadata
      ? JSON.parse(attachment.metadata as string)
      : null,
  }))
}

export async function addAttachmentTag(id: string, tag: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error("Attachment not found")
  }

  const metadata = attachment.metadata
    ? JSON.parse(attachment.metadata as string)
    : {}
  const tags = metadata.tags || []

  if (!tags.includes(tag)) {
    metadata.tags = [...tags, tag]
    return prisma.attachment.update({
      where: { id },
      data: {
        metadata: JSON.stringify(metadata),
      },
    })
  }

  return attachment
}

export async function removeAttachmentTag(id: string, tag: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error("Attachment not found")
  }

  const metadata = attachment.metadata
    ? JSON.parse(attachment.metadata as string)
    : {}
  const tags = metadata.tags || []

  metadata.tags = tags.filter((t: string) => t !== tag)
  return prisma.attachment.update({
    where: { id },
    data: {
      metadata: JSON.stringify(metadata),
    },
  })
}

export async function updateAttachmentVersion(
  id: string,
  version: number,
  url: string
) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error("Attachment not found")
  }

  const metadata = attachment.metadata
    ? JSON.parse(attachment.metadata as string)
    : {}

  metadata.version = version
  return prisma.attachment.update({
    where: { id },
    data: {
      url,
      metadata: JSON.stringify(metadata),
    },
  })
}

export async function setAttachmentThumbnail(
  id: string,
  thumbnailUrl: string
) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error("Attachment not found")
  }

  const metadata = attachment.metadata
    ? JSON.parse(attachment.metadata as string)
    : {}

  metadata.thumbnailUrl = thumbnailUrl
  return prisma.attachment.update({
    where: { id },
    data: {
      metadata: JSON.stringify(metadata),
    },
  })
}

export async function setAttachmentPreview(id: string, previewUrl: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error("Attachment not found")
  }

  const metadata = attachment.metadata
    ? JSON.parse(attachment.metadata as string)
    : {}

  metadata.previewUrl = previewUrl
  return prisma.attachment.update({
    where: { id },
    data: {
      metadata: JSON.stringify(metadata),
    },
  })
}

export async function getAttachmentStats(taskId: string) {
  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    select: {
      type: true,
      size: true,
    },
  })

  const stats = {
    totalSize: 0,
    totalCount: attachments.length,
    byType: {} as Record<string, { count: number; size: number }>,
  }

  for (const attachment of attachments) {
    stats.totalSize += attachment.size

    if (!stats.byType[attachment.type]) {
      stats.byType[attachment.type] = { count: 0, size: 0 }
    }

    stats.byType[attachment.type].count++
    stats.byType[attachment.type].size += attachment.size
  }

  return stats
}
