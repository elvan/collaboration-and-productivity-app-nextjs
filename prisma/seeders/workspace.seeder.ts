import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedWorkspaceOptions {
  ownerId: string;
  name?: string;
  description?: string;
}

export async function createWorkspace(options: SeedWorkspaceOptions) {
  const { ownerId, name, description } = options;

  // Create workspace with realistic data
  const workspace = await prisma.workspace.create({
    data: {
      name: name ?? faker.company.name(),
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
      analytics: {
        create: {
          activeUsers: faker.number.int({ min: 5, max: 50 }),
          taskCount: faker.number.int({ min: 100, max: 1000 }),
          completedTasks: faker.number.int({ min: 50, max: 500 }),
          documentCount: faker.number.int({ min: 20, max: 200 }),
          commentCount: faker.number.int({ min: 200, max: 2000 }),
          storageUsed: BigInt(faker.number.int({ min: 1000000, max: 10000000 })), // 1MB to 10MB
        }
      }
    },
    include: {
      analytics: true,
    }
  });

  // Get existing base roles
  const baseRoles = await Promise.all([
    prisma.role.findFirstOrThrow({ where: { name: 'WorkspaceAdmin' } }),
    prisma.role.findFirstOrThrow({ where: { name: 'WorkspaceManager' } }),
    prisma.role.findFirstOrThrow({ where: { name: 'WorkspaceMember' } }),
  ]);

  // Create workspace roles linking to base roles
  const workspaceRoles = await Promise.all(
    baseRoles.map(role =>
      prisma.workspaceRole.create({
        data: {
          workspaceId: workspace.id,
          roleId: role.id,
          userId: options.ownerId, // Initially assign to workspace owner
        }
      })
    )
  );

  return {
    workspace,
    workspaceRoles,
  };
}

export async function seedWorkspaceWithMembers(options: SeedWorkspaceOptions) {
  const { workspace, workspaceRoles } = await createWorkspace(options);

  // Create workspace members with different roles
  const demoUsers = await Promise.all(
    Array(5).fill(0).map(async () => {
      const password = await hash('password123', 12);
      return prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: password,
          status: 'ACTIVE',
        },
      });
    })
  );

  // Create workspace members with different roles
  const members = await Promise.all(
    demoUsers.map((user, index) => {
      // Assign roles in a round-robin fashion
      const workspaceRole = workspaceRoles[index % workspaceRoles.length];
      
      return prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          roleId: workspaceRole.id,
        },
      });
    })
  );

  return {
    workspace,
    workspaceRoles,
    members,
  };
}

export async function seedDemoWorkspaces(ownerId: string) {
  // Create personal workspace
  const personalWorkspace = await createWorkspace({
    ownerId,
    name: 'Personal Workspace',
    description: 'Your personal workspace for individual projects',
  });

  // Create additional workspaces
  const additionalWorkspaces = await Promise.all(
    Array(3).fill(0).map(async () => {
      const workspace = await createWorkspace({
        ownerId,
      });
      return workspace;
    })
  );

  return {
    personalWorkspace,
    additionalWorkspaces,
  };
}
