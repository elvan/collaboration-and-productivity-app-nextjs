import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateTeamRoleOptions {
  teamId: string;
}

export async function createTeamRole(options: CreateTeamRoleOptions) {
  const { teamId } = options;

  const roleTypes = [
    {
      name: 'Team Lead',
      permissions: ['MANAGE_TEAM', 'ASSIGN_TASKS', 'VIEW_ANALYTICS'],
      description: 'Team leadership role with full team management capabilities',
    },
    {
      name: 'Senior Member',
      permissions: ['CREATE_TASKS', 'EDIT_TASKS', 'VIEW_ANALYTICS'],
      description: 'Experienced team member with extended privileges',
    },
    {
      name: 'Member',
      permissions: ['CREATE_TASKS', 'EDIT_OWN_TASKS', 'COMMENT'],
      description: 'Regular team member',
    },
    {
      name: 'Observer',
      permissions: ['VIEW_ONLY'],
      description: 'View-only access to team activities',
    },
  ];

  const role = roleTypes[faker.number.int({ min: 0, max: roleTypes.length - 1 })];

  return prisma.teamRole.create({
    data: {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      teamId,
      isCustom: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createCustomTeamRole(options: CreateTeamRoleOptions) {
  const { teamId } = options;

  const customRoles = [
    {
      name: 'Technical Lead',
      permissions: ['MANAGE_TECHNICAL_TASKS', 'CODE_REVIEW', 'VIEW_ANALYTICS'],
      description: 'Technical leadership role',
    },
    {
      name: 'Product Owner',
      permissions: ['MANAGE_BACKLOG', 'PRIORITIZE_TASKS', 'VIEW_ANALYTICS'],
      description: 'Product ownership and backlog management',
    },
    {
      name: 'Scrum Master',
      permissions: ['MANAGE_SPRINTS', 'FACILITATE_MEETINGS', 'VIEW_ANALYTICS'],
      description: 'Agile process facilitator',
    },
  ];

  const role = customRoles[faker.number.int({ min: 0, max: customRoles.length - 1 })];

  return prisma.teamRole.create({
    data: {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      teamId,
      isCustom: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedTeamRoles(teamId: string) {
  // Create default roles
  const defaultRoles = await Promise.all([
    createTeamRole({ teamId }),
    createTeamRole({ teamId }),
  ]);

  // Create some custom roles
  const customRoles = await Promise.all([
    createCustomTeamRole({ teamId }),
    createCustomTeamRole({ teamId }),
  ]);

  return {
    defaultRoles,
    customRoles,
  };
}
