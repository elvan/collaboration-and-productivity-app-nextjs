import { PrismaClient, PermissionAction, PermissionResource } from '@prisma/client';
import { hash } from 'bcryptjs';
import { SystemRole } from '../src/types/roles';

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
  // Clean up existing data in the correct order
  console.log('Cleaning up existing data...');
  await prisma.task.deleteMany();
  await prisma.taskPriority.deleteMany();
  await prisma.taskStatus.deleteMany();
  await prisma.taskList.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.workspaceRole.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating default roles...');
  // Create default roles first
  const { adminRole, userRole } = await createDefaultRoles();

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  // Create test user
  const hashedPassword = await hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      userRoles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Test Workspace',
      description: 'A workspace for testing',
      ownerId: user.id,
    },
  });

  // Create workspace role
  const workspaceRole = await prisma.workspaceRole.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  // Create workspace member with role
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      roleId: workspaceRole.id,
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'A project for testing',
      ownerId: user.id,
      workspaceId: workspace.id,
    },
  });

  // Create task statuses
  const todoStatus = await prisma.taskStatus.create({
    data: {
      name: 'To Do',
      color: '#ff0000',
      category: 'todo',
      position: 1,
      projectId: project.id,
    },
  });

  const inProgressStatus = await prisma.taskStatus.create({
    data: {
      name: 'In Progress',
      color: '#00ff00',
      category: 'in_progress',
      position: 2,
      projectId: project.id,
    },
  });

  const doneStatus = await prisma.taskStatus.create({
    data: {
      name: 'Done',
      color: '#0000ff',
      category: 'done',
      position: 3,
      projectId: project.id,
    },
  });

  // Create task priorities
  const highPriority = await prisma.taskPriority.create({
    data: {
      name: 'High',
      level: 1,
      color: '#ff0000',
      projectId: project.id,
    },
  });

  const mediumPriority = await prisma.taskPriority.create({
    data: {
      name: 'Medium',
      level: 2,
      color: '#ffff00',
      projectId: project.id,
    },
  });

  const lowPriority = await prisma.taskPriority.create({
    data: {
      name: 'Low',
      level: 3,
      color: '#00ff00',
      projectId: project.id,
    },
  });

  // Create task list for views
  const defaultTaskList = await prisma.taskList.create({
    data: {
      name: 'All Tasks',
      description: 'Default view for all tasks',
      viewType: 'list',
      projectId: project.id,
      filters: {},
      sortOrder: { field: 'createdAt', direction: 'desc' },
    },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'First Task',
      description: 'This is the first test task',
      status: 'todo',
      priority: 'high',
      projectId: project.id,
      createdById: user.id,
      statusId: todoStatus.id,
      priorityId: highPriority.id,
      listId: defaultTaskList.id,
      position: 1.0,
      assignees: {
        create: {
          userId: user.id,
        }
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Second Task',
      description: 'This is the second test task',
      status: 'in_progress',
      priority: 'medium',
      projectId: project.id,
      createdById: user.id,
      statusId: inProgressStatus.id,
      priorityId: mediumPriority.id,
      listId: defaultTaskList.id,
      position: 2.0,
      assignees: {
        create: {
          userId: user.id,
        }
      },
    },
  });

  console.log('Seed data created successfully!');
  console.log('Admin user credentials:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
  console.log('\nTest user credentials:');
  console.log('Email: test@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
