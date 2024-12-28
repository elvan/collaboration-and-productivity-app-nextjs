// System-wide roles
export enum SystemRole {
  ADMIN = "Admin",
  USER = "User",
  GUEST = "Guest"
}

// Role contexts
export enum RoleContext {
  SYSTEM = "system",
  WORKSPACE = "workspace",
  TEAM = "team",
  PROJECT = "project"
}

// Role permissions (matching Prisma schema)
export { PermissionAction, PermissionResource } from "@prisma/client"

// Type for role with context
export interface RoleWithContext {
  role: {
    id: string
    name: string
    description?: string | null
    isSystem: boolean
  }
  context?: {
    type: RoleContext
    id: string
  }
}

// Helper functions
export function isSystemRole(roleName: string): roleName is SystemRole {
  return Object.values(SystemRole).includes(roleName as SystemRole)
}

export function getSystemRoleDisplayName(role: SystemRole): string {
  return {
    [SystemRole.ADMIN]: "Administrator",
    [SystemRole.USER]: "Standard User",
    [SystemRole.GUEST]: "Guest User"
  }[role]
}

// Type guard for checking specific roles
export function isAdminRole(role?: string): boolean {
  return role === SystemRole.ADMIN
}

export function isUserRole(role?: string): boolean {
  return role === SystemRole.USER
}

export function isGuestRole(role?: string): boolean {
  return role === SystemRole.GUEST
}
