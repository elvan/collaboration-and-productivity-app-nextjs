import { prisma } from '@/lib/prisma'
import { Prisma, Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client'
import { generateSlug } from '@/lib/utils'

export class WorkspaceService {
  // Create a new workspace
  static async createWorkspace(data: {
    name: string
    description?: string
    ownerId: string
    settings?: Prisma.JsonValue
    theme?: Prisma.JsonValue
    logoUrl?: string
  }): Promise<Workspace> {
    const slug = await generateSlug(data.name)
    
    const workspace = await prisma.workspace.create({
      data: {
        ...data,
        slug,
        analytics: {
          create: {} // Creates default analytics
        },
        WorkspaceRole: {
          create: [
            {
              name: 'Admin',
              permissions: ['*'],
              isDefault: false
            },
            {
              name: 'Member',
              permissions: ['read', 'write'],
              isDefault: true
            },
            {
              name: 'Guest',
              permissions: ['read'],
              isDefault: false
            }
          ]
        }
      },
      include: {
        analytics: true,
        WorkspaceRole: true
      }
    })

    // Add owner as admin
    const adminRole = workspace.WorkspaceRole.find(role => role.name === 'Admin')
    if (!adminRole) throw new Error('Admin role not found')

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: data.ownerId,
        roleId: adminRole.id
      }
    })

    return workspace
  }

  // Get workspace by ID
  static async getWorkspace(id: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
            role: true
          }
        },
        analytics: true,
        projects: true
      }
    })
  }

  // Update workspace
  static async updateWorkspace(
    id: string,
    data: Partial<{
      name: string
      description: string
      settings: Prisma.JsonValue
      theme: Prisma.JsonValue
      logoUrl: string
      isArchived: boolean
    }>
  ): Promise<Workspace> {
    if (data.name) {
      data = { ...data, slug: await generateSlug(data.name) }
    }

    return prisma.workspace.update({
      where: { id },
      data
    })
  }

  // Delete workspace
  static async deleteWorkspace(id: string): Promise<void> {
    await prisma.workspace.delete({
      where: { id }
    })
  }

  // Invite member
  static async inviteMember(data: {
    workspaceId: string
    email: string
    roleId: string
  }): Promise<WorkspaceMember> {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return prisma.workspaceMember.create({
      data: {
        workspaceId: data.workspaceId,
        userId: user.id,
        roleId: data.roleId,
        status: 'invited',
        inviteToken: Math.random().toString(36).substring(2),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
  }

  // Accept invitation
  static async acceptInvitation(inviteToken: string): Promise<WorkspaceMember> {
    return prisma.workspaceMember.update({
      where: { inviteToken },
      data: {
        status: 'active',
        inviteToken: null,
        expiresAt: null
      }
    })
  }

  // Remove member
  static async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })
  }

  // Update member role
  static async updateMemberRole(
    workspaceId: string,
    userId: string,
    roleId: string
  ): Promise<WorkspaceMember> {
    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      },
      data: { roleId }
    })
  }

  // Get workspace roles
  static async getWorkspaceRoles(workspaceId: string): Promise<WorkspaceRole[]> {
    return prisma.workspaceRole.findMany({
      where: { workspaceId }
    })
  }

  // Create custom role
  static async createWorkspaceRole(data: {
    workspaceId: string
    name: string
    permissions: string[]
  }): Promise<WorkspaceRole> {
    return prisma.workspaceRole.create({
      data: {
        ...data,
        permissions: data.permissions
      }
    })
  }
}
