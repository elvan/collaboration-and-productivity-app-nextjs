import { prisma } from "./prisma"
import { logActivity } from "./activity"

export interface WorkspaceCreateInput {
  name: string
  description?: string
  userId: string
  members?: Array<{
    userId: string
    role: "owner" | "admin" | "member"
  }>
}

export interface WorkspaceUpdateInput {
  name?: string
  description?: string
  members?: Array<{
    userId: string
    role: "owner" | "admin" | "member"
  }>
}

export async function createWorkspace(data: WorkspaceCreateInput) {
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      createdById: data.userId,
      members: {
        create: [
          { userId: data.userId, role: "owner" as const },
          ...(data.members || []).map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
        ],
      },
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
      members: {
        include: {
          user: {
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

  // Log activity
  await logActivity({
    type: "workspace.created",
    action: "created",
    entityType: "workspace",
    entityId: workspace.id,
    metadata: {
      workspaceName: workspace.name,
      memberCount: workspace.members.length,
    },
    userId: data.userId,
    workspaceId: workspace.id,
  })

  return workspace
}

export async function updateWorkspace(
  id: string,
  data: WorkspaceUpdateInput,
  userId: string
) {
  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
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
      members: {
        include: {
          user: {
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

  if (data.members) {
    // Update workspace members
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: id },
    })

    await prisma.workspaceMember.createMany({
      data: data.members.map((member) => ({
        workspaceId: id,
        userId: member.userId,
        role: member.role,
      })),
    })
  }

  // Log activity
  await logActivity({
    type: "workspace.updated",
    action: "updated",
    entityType: "workspace",
    entityId: workspace.id,
    metadata: {
      workspaceName: workspace.name,
      changes: data,
    },
    userId,
    workspaceId: workspace.id,
  })

  return workspace
}

export async function deleteWorkspace(id: string, userId: string) {
  const workspace = await prisma.workspace.delete({
    where: { id },
    include: {
      members: true,
    },
  })

  // Log activity
  await logActivity({
    type: "workspace.deleted",
    action: "deleted",
    entityType: "workspace",
    entityId: workspace.id,
    metadata: {
      workspaceName: workspace.name,
      memberCount: workspace.members.length,
    },
    userId,
    workspaceId: workspace.id,
  })

  return workspace
}

export async function getWorkspace(id: string) {
  return prisma.workspace.findUnique({
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
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          teams: true,
          documents: true,
          tasks: true,
          folders: true,
        },
      },
    },
  })
}

export async function getWorkspaces(userId: string, options?: {
  search?: string
  role?: "owner" | "admin" | "member"
}) {
  const where = {
    members: {
      some: {
        userId,
        ...(options?.role && { role: options.role }),
      },
    },
    ...(options?.search && {
      OR: [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
  }

  const [total, workspaces] = await Promise.all([
    prisma.workspace.count({ where }),
    prisma.workspace.findMany({
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
            documents: true,
            tasks: true,
            folders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    total,
    workspaces,
  }
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
  addedById: string
) {
  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId,
      role,
    },
    include: {
      workspace: true,
      user: {
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
    type: "workspace.member_added",
    action: "added",
    entityType: "workspace",
    entityId: workspaceId,
    metadata: {
      workspaceName: member.workspace.name,
      memberName: member.user.name,
      memberRole: role,
    },
    userId: addedById,
    workspaceId,
  })

  return member
}

export async function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
  updatedById: string
) {
  const member = await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    data: { role },
    include: {
      workspace: true,
      user: {
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
    type: "workspace.member_updated",
    action: "updated",
    entityType: "workspace",
    entityId: workspaceId,
    metadata: {
      workspaceName: member.workspace.name,
      memberName: member.user.name,
      memberRole: role,
    },
    userId: updatedById,
    workspaceId,
  })

  return member
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
  removedById: string
) {
  const member = await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
      user: {
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
    type: "workspace.member_removed",
    action: "removed",
    entityType: "workspace",
    entityId: workspaceId,
    metadata: {
      workspaceName: member.workspace.name,
      memberName: member.user.name,
    },
    userId: removedById,
    workspaceId,
  })

  return member
}

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
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

export async function getWorkspaceStats(workspaceId: string) {
  const [
    memberCount,
    teamCount,
    documentCount,
    taskCount,
    folderCount,
    activityCount,
  ] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.team.count({ where: { workspaceId } }),
    prisma.document.count({ where: { workspaceId } }),
    prisma.task.count({ where: { workspaceId } }),
    prisma.folder.count({ where: { workspaceId } }),
    prisma.activity.count({ where: { workspaceId } }),
  ])

  return {
    memberCount,
    teamCount,
    documentCount,
    taskCount,
    folderCount,
    activityCount,
  }
}
