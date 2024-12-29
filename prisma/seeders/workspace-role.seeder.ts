import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateWorkspaceRoleOptions {
  workspaceId: string;
}

export async function createWorkspaceRole(options: CreateWorkspaceRoleOptions) {
  const { workspaceId } = options;

  const roleTypes = [
    {
      name: 'Admin',
      permissions: ['FULL_ACCESS'],
      description: 'Full access to all workspace features',
    },
    {
      name: 'Manager',
      permissions: ['MANAGE_PROJECTS', 'MANAGE_TEAMS', 'VIEW_ANALYTICS'],
      description: 'Can manage projects and teams',
    },
    {
      name: 'Member',
      permissions: ['CREATE_TASKS', 'EDIT_TASKS', 'COMMENT'],
      description: 'Standard member access',
    },
    {
      name: 'Guest',
      permissions: ['VIEW_ONLY'],
      description: 'View-only access to specific projects',
    },
  ];

  const role = roleTypes[faker.number.int({ min: 0, max: roleTypes.length - 1 })];

  return prisma.workspaceRole.create({
    data: {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      workspaceId,
      isCustom: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createCustomWorkspaceRole(options: CreateWorkspaceRoleOptions) {
  const { workspaceId } = options;

  const customRoles = [
    {
      name: 'Project Coordinator',
      permissions: ['MANAGE_PROJECTS', 'ASSIGN_TASKS', 'VIEW_ANALYTICS'],
      description: 'Coordinates project activities and resource allocation',
    },
    {
      name: 'Team Lead',
      permissions: ['MANAGE_TEAM', 'CREATE_TASKS', 'EDIT_TASKS', 'VIEW_ANALYTICS'],
      description: 'Leads team activities and manages team tasks',
    },
    {
      name: 'External Collaborator',
      permissions: ['CREATE_TASKS', 'COMMENT', 'VIEW_LIMITED'],
      description: 'External partner with limited access',
    },
  ];

  const role = customRoles[faker.number.int({ min: 0, max: customRoles.length - 1 })];

  return prisma.workspaceRole.create({
    data: {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      workspaceId,
      isCustom: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedWorkspaceRoles(workspaceId: string) {
  // Create default roles
  const defaultRoles = await Promise.all([
    createWorkspaceRole({ workspaceId }),
    createWorkspaceRole({ workspaceId }),
  ]);

  // Create some custom roles
  const customRoles = await Promise.all([
    createCustomWorkspaceRole({ workspaceId }),
    createCustomWorkspaceRole({ workspaceId }),
  ]);

  return {
    defaultRoles,
    customRoles,
  };
}
