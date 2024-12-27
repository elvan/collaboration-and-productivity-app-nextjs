import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Test Workspace',
      description: 'A workspace for testing',
      members: {
        create: {
          userId: user.id,
          role: 'admin',
        },
      },
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

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'First Task',
      description: 'This is the first task',
      status: 'todo',
      priority: 'high',
      dueDate: new Date('2024-01-01'),
      projectId: project.id,
      createdById: user.id,
      assigneeId: user.id,
      statusId: todoStatus.id,
      priorityId: highPriority.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Second Task',
      description: 'This is the second task',
      status: 'in_progress',
      priority: 'medium',
      dueDate: new Date('2024-01-15'),
      projectId: project.id,
      createdById: user.id,
      assigneeId: user.id,
      statusId: inProgressStatus.id,
      priorityId: mediumPriority.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Third Task',
      description: 'This is the third task',
      status: 'done',
      priority: 'low',
      dueDate: new Date('2024-01-30'),
      projectId: project.id,
      createdById: user.id,
      assigneeId: user.id,
      statusId: doneStatus.id,
      priorityId: lowPriority.id,
    },
  });

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
