import { prisma } from "./prisma"
import { PermissionAction, PermissionResource } from "@prisma/client"

export async function hasPermission(
  userId: string,
  action: PermissionAction,
  resource: PermissionResource,
  contextId?: string
) {
  // Get user's roles (global, workspace, and team roles)
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })

  // If contextId is provided, also check workspace and team roles
  if (contextId) {
    const workspaceRoles = await prisma.workspaceRole.findMany({
      where: { userId, workspaceId: contextId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    const teamRoles = await prisma.teamRole.findMany({
      where: { userId, teamId: contextId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    userRoles.push(...workspaceRoles.map((wr) => ({ role: wr.role })))
    userRoles.push(...teamRoles.map((tr) => ({ role: tr.role })))
  }

  // Check if any role has the required permission
  return userRoles.some((userRole) =>
    userRole.role.permissions.some(
      (permission) =>
        permission.action === action && permission.resource === resource
    )
  )
}

export async function getUserPermissions(userId: string, contextId?: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })

  if (contextId) {
    const workspaceRoles = await prisma.workspaceRole.findMany({
      where: { userId, workspaceId: contextId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    const teamRoles = await prisma.teamRole.findMany({
      where: { userId, teamId: contextId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    userRoles.push(...workspaceRoles.map((wr) => ({ role: wr.role })))
    userRoles.push(...teamRoles.map((tr) => ({ role: tr.role })))
  }

  // Combine and deduplicate permissions
  const permissions = new Set<string>()
  userRoles.forEach((userRole) => {
    userRole.role.permissions.forEach((permission) => {
      permissions.add(`${permission.action}_${permission.resource}`)
    })
  })

  return Array.from(permissions)
}

export function createDefaultRoles() {
  return prisma.$transaction([
    // Create Admin Role
    prisma.role.create({
      data: {
        name: "Admin",
        description: "Full system access",
        isSystem: true,
        permissions: {
          create: Object.values(PermissionResource).flatMap((resource) =>
            Object.values(PermissionAction).map((action) => ({
              action,
              resource,
            }))
          ),
        },
      },
    }),

    // Create User Role
    prisma.role.create({
      data: {
        name: "User",
        description: "Standard user access",
        isSystem: true,
        permissions: {
          create: [
            { action: "READ", resource: "PROJECTS" },
            { action: "CREATE", resource: "TASKS" },
            { action: "READ", resource: "TASKS" },
            { action: "UPDATE", resource: "TASKS" },
            { action: "DELETE", resource: "TASKS" },
          ],
        },
      },
    }),

    // Create Guest Role
    prisma.role.create({
      data: {
        name: "Guest",
        description: "Limited access",
        isSystem: true,
        permissions: {
          create: [
            { action: "READ", resource: "PROJECTS" },
            { action: "READ", resource: "TASKS" },
          ],
        },
      },
    }),
  ])
}
