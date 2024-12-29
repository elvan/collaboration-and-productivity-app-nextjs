import { PrismaClient, PermissionAction, PermissionResource } from '@prisma/client';
import { SystemRole } from '../../src/types/roles';

const prisma = new PrismaClient();

export async function createSystemRoles() {
  // Create Admin Role with full system access
  const adminRole = await prisma.role.create({
    data: {
      name: SystemRole.ADMIN,
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
  });

  // Create User Role with standard access
  const userRole = await prisma.role.create({
    data: {
      name: SystemRole.USER,
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
  });

  // Create Guest Role with limited access
  const guestRole = await prisma.role.create({
    data: {
      name: SystemRole.GUEST,
      description: "Limited access",
      isSystem: true,
      permissions: {
        create: [
          { action: "READ", resource: "PROJECTS" },
          { action: "READ", resource: "TASKS" },
        ],
      },
    },
  });

  return { adminRole, userRole, guestRole };
}

export async function createWorkspaceRoles() {
  // Create Workspace Admin Role
  const workspaceAdminRole = await prisma.role.create({
    data: {
      name: 'WorkspaceAdmin',
      description: 'Full workspace access',
      isSystem: false,
      permissions: {
        create: [
          { action: 'MANAGE', resource: 'WORKSPACES' },
          { action: 'MANAGE', resource: 'USERS' },
          { action: 'MANAGE', resource: 'PROJECTS' },
          { action: 'MANAGE', resource: 'TEAMS' },
        ],
      },
    },
  });

  // Create Workspace Manager Role
  const workspaceManagerRole = await prisma.role.create({
    data: {
      name: 'WorkspaceManager',
      description: 'Can manage projects and teams',
      isSystem: false,
      permissions: {
        create: [
          { action: 'READ', resource: 'WORKSPACES' },
          { action: 'MANAGE', resource: 'PROJECTS' },
          { action: 'MANAGE', resource: 'TEAMS' },
          { action: 'MANAGE', resource: 'TASKS' },
        ],
      },
    },
  });

  // Create Workspace Member Role
  const workspaceMemberRole = await prisma.role.create({
    data: {
      name: 'WorkspaceMember',
      description: 'Regular workspace member',
      isSystem: false,
      permissions: {
        create: [
          { action: 'READ', resource: 'WORKSPACES' },
          { action: 'CREATE', resource: 'PROJECTS' },
          { action: 'READ', resource: 'PROJECTS' },
          { action: 'CREATE', resource: 'TASKS' },
          { action: 'UPDATE', resource: 'TASKS' },
        ],
      },
    },
  });

  return { workspaceAdminRole, workspaceManagerRole, workspaceMemberRole };
}

export async function seedRoles() {
  console.log('Creating system roles...');
  const systemRoles = await createSystemRoles();

  console.log('Creating workspace roles...');
  const workspaceRoles = await createWorkspaceRoles();

  return {
    ...systemRoles,
    ...workspaceRoles,
  };
}
