import { prisma } from "./prisma"
import { logActivity } from "./activity"

export interface TemplateCreateInput {
  title: string
  description: string
  content: string
  workspaceId: string
  userId: string
  isPublic?: boolean
  tags?: string[]
}

export interface TemplateUpdateInput {
  title?: string
  description?: string
  content?: string
  isPublic?: boolean
  tags?: string[]
}

export async function createTemplate(data: TemplateCreateInput) {
  const template = await prisma.documentTemplate.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      workspaceId: data.workspaceId,
      createdById: data.userId,
      isPublic: data.isPublic || false,
      tags: data.tags || [],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "template.created",
    action: "created",
    entityType: "template",
    entityId: template.id,
    metadata: {
      templateTitle: template.title,
      isPublic: template.isPublic,
      tags: template.tags,
    },
    userId: data.userId,
    workspaceId: data.workspaceId,
  })

  return template
}

export async function updateTemplate(
  id: string,
  data: TemplateUpdateInput,
  userId: string
) {
  const template = await prisma.documentTemplate.update({
    where: { id },
    data: {
      ...data,
      lastUpdatedById: userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "template.updated",
    action: "updated",
    entityType: "template",
    entityId: template.id,
    metadata: {
      templateTitle: template.title,
      changes: data,
    },
    userId,
    workspaceId: template.workspaceId,
  })

  return template
}

export async function deleteTemplate(id: string, userId: string) {
  const template = await prisma.documentTemplate.delete({
    where: { id },
  })

  // Log activity
  await logActivity({
    type: "template.deleted",
    action: "deleted",
    entityType: "template",
    entityId: template.id,
    metadata: {
      templateTitle: template.title,
    },
    userId,
    workspaceId: template.workspaceId,
  })

  return template
}

export async function getTemplate(id: string) {
  return prisma.documentTemplate.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

export async function getTemplates(workspaceId: string, options?: {
  search?: string
  tags?: string[]
  isPublic?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}) {
  const where = {
    workspaceId,
    ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
    ...(options?.tags && { tags: { hasEvery: options.tags } }),
    ...(options?.search && {
      OR: [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy = options?.sort
    ? { [options.sort]: options.order || 'desc' }
    : { updatedAt: 'desc' }

  const [total, templates] = await Promise.all([
    prisma.documentTemplate.count({ where }),
    prisma.documentTemplate.findMany({
      where,
      orderBy,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    }),
  ])

  return {
    total,
    templates,
  }
}

export async function getPopularTemplates(workspaceId: string, limit = 5) {
  const templates = await prisma.documentTemplate.findMany({
    where: {
      workspaceId,
      isPublic: true,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          documents: true,
        },
      },
    },
    orderBy: {
      documents: {
        _count: 'desc',
      },
    },
    take: limit,
  })

  return templates
}

export async function getTemplateTags(workspaceId: string) {
  const templates = await prisma.documentTemplate.findMany({
    where: { workspaceId },
    select: { tags: true },
  })

  const tags = new Set<string>()
  templates.forEach((template) => {
    template.tags.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags)
}

export async function createDocumentFromTemplate(
  templateId: string,
  data: {
    title: string
    folderId?: string
    workspaceId: string
    userId: string
  }
) {
  const template = await getTemplate(templateId)
  if (!template) {
    throw new Error("Template not found")
  }

  const document = await prisma.document.create({
    data: {
      title: data.title,
      content: template.content,
      folderId: data.folderId,
      workspaceId: data.workspaceId,
      createdById: data.userId,
      templateId: template.id,
      currentVersion: 1,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      folder: true,
      template: true,
    },
  })

  // Create initial version
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      content: template.content,
      version: 1,
      createdById: data.userId,
    },
  })

  // Log activity
  await logActivity({
    type: "document.created_from_template",
    action: "created",
    entityType: "document",
    entityId: document.id,
    metadata: {
      documentTitle: document.title,
      templateId: template.id,
      templateTitle: template.title,
      folderId: data.folderId,
    },
    userId: data.userId,
    workspaceId: data.workspaceId,
  })

  return document
}
