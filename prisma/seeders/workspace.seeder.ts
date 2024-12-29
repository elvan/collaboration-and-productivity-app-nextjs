import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

interface SeedWorkspaceOptions {
  ownerId: string;
  name?: string;
  description?: string;
}

export async function createWorkspace(options: SeedWorkspaceOptions) {
  const { ownerId, name, description } = options;
  const workspaceName = name ?? faker.company.name();

  // Create workspace with realistic data
  const workspace = await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug: slugify(workspaceName, { lower: true, strict: true }),
      description: description ?? faker.company.catchPhrase(),
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
      workspaceAnalytics: {
        create: {
          activeUsers: faker.number.int({ min: 5, max: 50 }),
          taskCount: faker.number.int({ min: 100, max: 1000 }),
          completedTasks: faker.number.int({ min: 50, max: 500 }),
          documentCount: faker.number.int({ min: 20, max: 200 }),
          commentCount: faker.number.int({ min: 200, max: 2000 }),
          storageUsed: BigInt(faker.number.int({ min: 1024 * 1024, max: 1024 * 1024 * 1024 })),
          memberCount: faker.number.int({ min: 5, max: 50 }),
          projectCount: faker.number.int({ min: 3, max: 20 }),
        },
      },
      workspaceRoles: {
        create: [
          {
            name: 'Admin',
            permissions: ['*'],
            isDefault: false,
          },
          {
            name: 'Member',
            permissions: ['read', 'write'],
            isDefault: true,
          },
          {
            name: 'Viewer',
            permissions: ['read'],
            isDefault: false,
          },
        ],
      },
    },
    include: {
      workspaceRoles: true,
    },
  });

  // Create a member record for the owner with admin role
  const adminRole = workspace.workspaceRoles.find(
    (role) => role.name === 'Admin'
  );
  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: ownerId,
      roleId: adminRole.id,
      status: 'active',
    },
  });

  return workspace;
}

export async function seedWorkspaceWithMembers(options: SeedWorkspaceOptions) {
  const workspace = await createWorkspace(options);

  // Get the default member role
  const memberRole = await prisma.workspaceRole.findFirst({
    where: {
      workspaceId: workspace.id,
      name: 'Member',
    },
  });

  if (!memberRole) {
    throw new Error('Default member role not found');
  }

  // Create some members
  const memberCount = faker.number.int({ min: 3, max: 10 });
  for (let i = 0; i < memberCount; i++) {
    const email = faker.internet.email().toLowerCase();
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email,
        password: await hash('password123', 12),
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        roleId: memberRole.id,
        status: 'active',
      },
    });
  }

  return workspace;
}

export async function seedDemoWorkspaces(ownerId: string) {
  // Create a few demo workspaces
  const workspaces = await Promise.all([
    seedWorkspaceWithMembers({
      ownerId,
      name: 'Design Team',
      description: 'Collaborative workspace for our design team',
    }),
    seedWorkspaceWithMembers({
      ownerId,
      name: 'Engineering',
      description: 'Software development and engineering projects',
    }),
    seedWorkspaceWithMembers({
      ownerId,
      name: 'Marketing',
      description: 'Marketing campaigns and content management',
    }),
  ]);

  return workspaces;
}
