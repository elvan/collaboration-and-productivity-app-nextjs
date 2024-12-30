import { PrismaClient, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { seedDemoProjects } from './seeders/project.seeder';
import { seedWorkspaceWithMembers, seedDemoWorkspaces } from './seeders/workspace.seeder';
import { seedRoles } from './seeders/role.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in the correct order
  console.log('Cleaning up existing data...');

  // Clean up in correct order - delete dependent records first
  await prisma.channel.deleteMany();
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
  await prisma.workspaceAnalytics.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // Create all roles
  console.log('Creating roles...');
  const roles = await seedRoles();

  // Create demo admin user
  console.log('Creating demo admin user...');
  const adminPassword = await hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      status: UserStatus.ACTIVE,
      userRoles: {
        create: {
          roleId: roles.adminRole.id
        }
      }
    },
  });

  // Create demo Junior Programmer
  console.log('Creating demo Junior Programmer...');
  const juniorPassword = await hash('junior123', 12);
  const juniorUser = await prisma.user.upsert({
    where: { email: 'junior-programmer@example.com' },
    update: {},
    create: {
      name: 'Junior Programmer',
      email: 'junior-programmer@example.com',
      password: juniorPassword,
      status: UserStatus.ACTIVE,
      userRoles: {
        create: {
          roleId: roles.userRole.id,
        },
      },
    },
  });

  // Create demo workspaces using the workspace seeder
  console.log('Creating demo workspaces...');
  const mainWorkspace = await seedWorkspaceWithMembers({
    ownerId: adminUser.id,
    name: 'Main Workspace',
    description: 'Primary workspace for the organization',
  });

  // Create additional demo workspaces
  console.log('Creating additional demo workspaces...');
  const demoWorkspaces = await seedDemoWorkspaces(adminUser.id);

  // Create demo team in the main workspace
  console.log('Creating demo team...');
  const team = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Main engineering team',
      workspaceId: mainWorkspace.id,
      ownerId: adminUser.id,
    },
  });

  // Seed demo projects in the main workspace
  console.log('Creating demo projects...');
  const demoProjects = await seedDemoProjects(mainWorkspace.id, adminUser.id, team.id);

  console.log('✅ Database seeding completed!');

  return {
    roles,
    adminUser,
    mainWorkspace,
    demoWorkspaces,
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
