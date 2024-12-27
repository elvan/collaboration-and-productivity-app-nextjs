import { prisma } from "./prisma"
import { logActivity } from "./activity"

export interface FolderCreateInput {
  name: string
  description?: string
  parentId?: string
  workspaceId: string
  userId: string
}

export interface FolderUpdateInput {
  name?: string
  description?: string
  parentId?: string | null
}

export async function createFolder(data: FolderCreateInput) {
  const folder = await prisma.folder.create({
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      workspaceId: data.workspaceId,
      createdById: data.userId,
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
      parent: true,
    },
  })

  // Log activity
  await logActivity({
    type: "folder.created",
    action: "created",
    entityType: "folder",
    entityId: folder.id,
    metadata: {
      folderName: folder.name,
      parentId: folder.parentId,
    },
    userId: data.userId,
    workspaceId: data.workspaceId,
  })

  return folder
}

export async function updateFolder(
  id: string,
  data: FolderUpdateInput,
  userId: string
) {
  const folder = await prisma.folder.update({
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
      parent: true,
    },
  })

  // Log activity
  await logActivity({
    type: "folder.updated",
    action: "updated",
    entityType: "folder",
    entityId: folder.id,
    metadata: {
      folderName: folder.name,
      changes: data,
    },
    userId,
    workspaceId: folder.workspaceId,
  })

  return folder
}

export async function deleteFolder(id: string, userId: string) {
  const folder = await prisma.folder.delete({
    where: { id },
    include: {
      documents: true,
      children: true,
    },
  })

  // Log activity
  await logActivity({
    type: "folder.deleted",
    action: "deleted",
    entityType: "folder",
    entityId: folder.id,
    metadata: {
      folderName: folder.name,
      documentCount: folder.documents.length,
      childFolderCount: folder.children.length,
    },
    userId,
    workspaceId: folder.workspaceId,
  })

  return folder
}

export async function getFolder(id: string) {
  return prisma.folder.findUnique({
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
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              documents: true,
              children: true,
            },
          },
        },
      },
      documents: {
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
      },
    },
  })
}

export async function getFolders(workspaceId: string, options?: {
  parentId?: string | null
  search?: string
}) {
  const where = {
    workspaceId,
    parentId: options?.parentId ?? null,
    ...(options?.search && {
      OR: [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [total, folders] = await Promise.all([
    prisma.folder.count({ where }),
    prisma.folder.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        parent: true,
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
      orderBy: [
        { name: "asc" },
      ],
    }),
  ])

  return {
    total,
    folders,
  }
}

export async function getFolderPath(id: string) {
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      parent: true,
    },
  })

  if (!folder) return []

  const path = [folder]
  let currentFolder = folder

  while (currentFolder.parentId) {
    const parent = await prisma.folder.findUnique({
      where: { id: currentFolder.parentId },
      include: {
        parent: true,
      },
    })
    if (!parent) break
    path.unshift(parent)
    currentFolder = parent
  }

  return path
}

export async function moveFolderContents(
  sourceId: string,
  targetId: string | null,
  userId: string
) {
  const source = await prisma.folder.findUnique({
    where: { id: sourceId },
    include: {
      documents: true,
      children: true,
    },
  })

  if (!source) throw new Error("Source folder not found")

  // Move documents
  await prisma.document.updateMany({
    where: { folderId: sourceId },
    data: { folderId: targetId },
  })

  // Move child folders
  await prisma.folder.updateMany({
    where: { parentId: sourceId },
    data: { parentId: targetId },
  })

  // Log activity
  await logActivity({
    type: "folder.contents_moved",
    action: "moved",
    entityType: "folder",
    entityId: sourceId,
    metadata: {
      sourceFolderName: source.name,
      targetFolderId: targetId,
      documentCount: source.documents.length,
      childFolderCount: source.children.length,
    },
    userId,
    workspaceId: source.workspaceId,
  })

  return source
}

export async function getFolderStats(id: string) {
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          documents: true,
          children: true,
        },
      },
    },
  })

  if (!folder) throw new Error("Folder not found")

  const documentCount = folder._count.documents
  const childFolderCount = folder._count.children

  // Get total document count including subfolders
  const getTotalDocumentCount = async (folderId: string): Promise<number> => {
    const children = await prisma.folder.findMany({
      where: { parentId: folderId },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    const childDocumentCounts = await Promise.all(
      children.map((child) => getTotalDocumentCount(child.id))
    )

    return (
      folder._count.documents +
      childDocumentCounts.reduce((sum, count) => sum + count, 0)
    )
  }

  const totalDocumentCount = await getTotalDocumentCount(id)

  return {
    documentCount,
    childFolderCount,
    totalDocumentCount,
  }
}
