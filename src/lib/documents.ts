import { prisma } from "./prisma"
import { logActivity } from "./activity"
import { nanoid } from "nanoid"

export interface DocumentCreateInput {
  title: string
  content: string
  templateId?: string
  folderId?: string
  workspaceId: string
  userId: string
}

export interface DocumentUpdateInput {
  title?: string
  content?: string
  folderId?: string | null
}

export interface DocumentVersion {
  id: string
  documentId: string
  content: string
  createdAt: Date
  createdBy: {
    id: string
    name: string
  }
}

export async function createDocument(data: DocumentCreateInput) {
  const document = await prisma.document.create({
    data: {
      id: nanoid(),
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      folderId: data.folderId,
      workspaceId: data.workspaceId,
      createdById: data.userId,
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
      content: data.content,
      version: 1,
      createdById: data.userId,
    },
  })

  // Log activity
  await logActivity({
    type: "document.created",
    action: "created",
    entityType: "document",
    entityId: document.id,
    metadata: {
      documentTitle: document.title,
      templateId: data.templateId,
      folderId: data.folderId,
    },
    userId: data.userId,
    workspaceId: data.workspaceId,
  })

  return document
}

export async function updateDocument(
  id: string,
  data: DocumentUpdateInput,
  userId: string
) {
  const document = await prisma.document.update({
    where: { id },
    data: {
      ...data,
      currentVersion: {
        increment: 1,
      },
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
      folder: true,
      template: true,
    },
  })

  // Create new version
  if (data.content) {
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        content: data.content,
        version: document.currentVersion,
        createdById: userId,
      },
    })
  }

  // Log activity
  await logActivity({
    type: "document.updated",
    action: "updated",
    entityType: "document",
    entityId: document.id,
    metadata: {
      documentTitle: document.title,
      changes: data,
    },
    userId,
    workspaceId: document.workspaceId,
  })

  return document
}

export async function deleteDocument(id: string, userId: string) {
  const document = await prisma.document.delete({
    where: { id },
    include: {
      versions: true,
    },
  })

  // Log activity
  await logActivity({
    type: "document.deleted",
    action: "deleted",
    entityType: "document",
    entityId: document.id,
    metadata: {
      documentTitle: document.title,
    },
    userId,
    workspaceId: document.workspaceId,
  })

  return document
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
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
      folder: true,
      template: true,
      collaborators: {
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

export async function getDocuments(workspaceId: string, options?: {
  folderId?: string
  templateId?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}) {
  const where = {
    workspaceId,
    ...(options?.folderId && { folderId: options.folderId }),
    ...(options?.templateId && { templateId: options.templateId }),
    ...(options?.search && {
      OR: [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy = options?.sort
    ? { [options.sort]: options.order || 'desc' }
    : { updatedAt: 'desc' }

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
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
        folder: true,
        template: true,
      },
    }),
  ])

  return {
    total,
    documents,
  }
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { version: 'desc' },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return versions
}

export async function restoreDocumentVersion(
  documentId: string,
  versionId: string,
  userId: string
) {
  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
  })

  if (!version) {
    throw new Error("Version not found")
  }

  const document = await updateDocument(
    documentId,
    { content: version.content },
    userId
  )

  // Log activity
  await logActivity({
    type: "document.version_restored",
    action: "restored",
    entityType: "document",
    entityId: documentId,
    metadata: {
      documentTitle: document.title,
      versionId: versionId,
      version: version.version,
    },
    userId,
    workspaceId: document.workspaceId,
  })

  return document
}

export async function addDocumentCollaborator(
  documentId: string,
  userId: string,
  addedById: string
) {
  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      collaborators: {
        connect: { id: userId },
      },
    },
    include: {
      collaborators: {
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
    type: "document.collaborator_added",
    action: "added",
    entityType: "document",
    entityId: documentId,
    metadata: {
      documentTitle: document.title,
      collaboratorId: userId,
    },
    userId: addedById,
    workspaceId: document.workspaceId,
  })

  return document
}

export async function removeDocumentCollaborator(
  documentId: string,
  userId: string,
  removedById: string
) {
  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      collaborators: {
        disconnect: { id: userId },
      },
    },
    include: {
      collaborators: {
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
    type: "document.collaborator_removed",
    action: "removed",
    entityType: "document",
    entityId: documentId,
    metadata: {
      documentTitle: document.title,
      collaboratorId: userId,
    },
    userId: removedById,
    workspaceId: document.workspaceId,
  })

  return document
}

export async function searchDocuments(
  workspaceId: string,
  query: string,
  options?: {
    folderId?: string
    templateId?: string
  }
) {
  const documents = await prisma.document.findMany({
    where: {
      workspaceId,
      ...(options?.folderId && { folderId: options.folderId }),
      ...(options?.templateId && { templateId: options.templateId }),
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
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
      folder: true,
      template: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return documents
}
