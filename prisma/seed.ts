import { PrismaClient, PermissionAction, PermissionResource, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { SystemRole } from '../src/types/roles';
import { seedDemoProjects } from './seeders/project.seeder';

const prisma = new PrismaClient();

async function createDefaultRoles() {
  // Create Admin Role
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

  // Create User Role
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

  // Create Guest Role
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

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in the correct order
  console.log('Cleaning up existing data...');

  // Clean up in correct order - delete dependent records first
  await prisma.customFieldValue.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.taskPriority.deleteMany();
  await prisma.taskStatus.deleteMany();
  await prisma.taskList.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.workspaceRole.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating default roles...');
  // Create default roles first
  const { adminRole, userRole, guestRole } = await createDefaultRoles();

  // Create demo admin user
  console.log('Creating demo admin user...');
  const adminPassword = await hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      status: UserStatus.ACTIVE,
      userRoles: {
        create: {
          roleId: adminRole.id
        }
      }
    },
  });

  // Create demo workspace
  console.log('Creating demo workspace...');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Demo Workspace',
      description: 'Demo workspace for testing',
      ownerId: adminUser.id,
      settings: {
        theme: 'light',
        features: {
          tasks: true,
          calendar: true,
          files: true
        }
      }
    },
  });

  // Create demo team
  console.log('Creating demo team...');
  const team = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Main engineering team',
      workspaceId: workspace.id,
      ownerId: adminUser.id,
    },
  });

  // Seed demo projects
  console.log('Creating demo projects...');
  const demoProjects = await seedDemoProjects(workspace.id, adminUser.id, team.id);

  console.log('✅ Database seeding completed!');

  return {
    adminUser,
    workspace,
    team,
    demoProjects,
  };
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
