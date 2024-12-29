import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedWorkspaceOptions {
  ownerId: string;
}

export async function createWorkspace(options: SeedWorkspaceOptions) {
  const { ownerId } = options;

  // Create workspace with realistic data
  const workspace = await prisma.workspace.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      ownerId,
      settings: {
        theme: {
          mode: 'light',
          primaryColor: '#3B82F6',
          accentColor: '#10B981',
        },
        notifications: {
          email: true,
          desktop: true,
          mobile: true,
        },
        security: {
          twoFactorRequired: false,
          passwordExpiration: 90,
          sessionTimeout: 24,
        },
        features: {
          timeTracking: true,
          sprints: true,
          customFields: true,
          automations: true,
        },
      },
    },
  });

  // Create workspace analytics
  await prisma.workspaceAnalytics.create({
    data: {
      workspaceId: workspace.id,
      activeUsers: faker.number.int({ min: 5, max: 50 }),
      taskCount: faker.number.int({ min: 100, max: 1000 }),
      completedTasks: faker.number.int({ min: 50, max: 500 }),
      documentCount: faker.number.int({ min: 20, max: 200 }),
      commentCount: faker.number.int({ min: 200, max: 2000 }),
      storageUsed: BigInt(faker.number.int({ min: 1000000, max: 10000000 })), // 1MB to 10MB
    },
  });

  return workspace;
}

export async function seedWorkspaceWithMembers(options: SeedWorkspaceOptions) {
  const workspace = await createWorkspace(options);

  // Create workspace roles
  const roles = await Promise.all([
    prisma.workspaceRole.create({
      data: {
        name: 'Admin',
        description: 'Full workspace access',
        workspaceId: workspace.id,
        permissions: ['MANAGE_WORKSPACE', 'MANAGE_MEMBERS', 'MANAGE_PROJECTS'],
      },
    }),
    prisma.workspaceRole.create({
      data: {
        name: 'Manager',
        description: 'Can manage projects and teams',
        workspaceId: workspace.id,
        permissions: ['MANAGE_PROJECTS', 'MANAGE_TEAMS'],
      },
    }),
    prisma.workspaceRole.create({
      data: {
        name: 'Member',
        description: 'Regular workspace member',
        workspaceId: workspace.id,
        permissions: ['VIEW_WORKSPACE', 'CREATE_PROJECTS'],
      },
    }),
  ]);

  // Create workspace members with different roles
  const members = await Promise.all(
    Array(5)
      .fill(0)
      .map(async (_, index) => {
        const role = roles[index % roles.length];
        return prisma.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: faker.string.uuid(), // Assuming we have users
            roleId: role.id,
          },
        });
      })
  );

  return {
    workspace,
    roles,
    members,
  };
}

export async function seedDemoWorkspaces(ownerId: string) {
  // Create main workspace
  const mainWorkspace = await seedWorkspaceWithMembers({
    ownerId,
  });

  // Create personal workspace
  const personalWorkspace = await createWorkspace({
    ownerId,
  });
  await prisma.workspace.update({
    where: { id: personalWorkspace.id },
    data: {
      name: 'Personal Workspace',
      description: 'Your personal workspace for individual projects',
      settings: {
        ...personalWorkspace.settings,
        features: {
          timeTracking: false,
          sprints: false,
          customFields: true,
          automations: false,
        },
      },
    },
  });

  return {
    mainWorkspace,
    personalWorkspace,
  };
}
