import { PrismaClient, TaskStatuEnum, TaskPriorityLevel } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedTaskOptions {
  projectId: string;
  createdById: string;
  statusId: string;
  priorityId: string;
  listId: string;
}

export async function createTask(options: SeedTaskOptions) {
  const { projectId, createdById, statusId, priorityId, listId } = options;

  // Create task with realistic data
  const task = await prisma.task.create({
    data: {
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraphs(2),
      status: faker.helpers.enumValue(TaskStatuEnum),
      priority: faker.helpers.enumValue(TaskPriorityLevel),
      dueDate: faker.date.future(),
      startDate: faker.date.past(),
      timeEstimate: faker.number.int({ min: 30, max: 480 }), // 30min to 8h
      timeSpent: faker.number.int({ min: 0, max: 480 }),
      points: faker.number.float({ min: 1, max: 13, precision: 0.5 }),
      position: faker.number.float({ min: 0, max: 1000 }),
      projectId,
      createdById,
      statusId,
      priorityId,
      listId,
    },
  });

  return task;
}

export async function seedTaskWithDetails(options: SeedTaskOptions) {
  const task = await createTask(options);

  // Create task assignees
  const assignees = await Promise.all(
    Array(faker.number.int({ min: 1, max: 3 }))
      .fill(0)
      .map(() =>
        prisma.taskAssignee.create({
          data: {
            taskId: task.id,
            userId: faker.string.uuid(), // Assuming we have users
            role: faker.helpers.arrayElement(['owner', 'reviewer', 'assignee']),
          },
        })
      )
  );

  // Create checklist
  const checklist = await prisma.checklist.create({
    data: {
      title: 'Implementation Steps',
      taskId: task.id,
      items: {
        create: Array(faker.number.int({ min: 2, max: 5 }))
          .fill(0)
          .map(() => ({
            text: faker.hacker.phrase(),
            checked: faker.datatype.boolean(),
          })),
      },
    },
  });

  // Create task comments
  const comments = await Promise.all(
    Array(faker.number.int({ min: 1, max: 5 }))
      .fill(0)
      .map(() =>
        prisma.taskComment.create({
          data: {
            content: faker.lorem.paragraph(),
            taskId: task.id,
            userId: faker.string.uuid(), // Assuming we have users
          },
        })
      )
  );

  // Create time entries
  const timeEntries = await Promise.all(
    Array(faker.number.int({ min: 1, max: 3 }))
      .fill(0)
      .map(() =>
        prisma.timeEntry.create({
          data: {
            taskId: task.id,
            userId: faker.string.uuid(), // Assuming we have users
            startTime: faker.date.past(),
            endTime: faker.date.recent(),
            duration: faker.number.int({ min: 15, max: 240 }), // 15min to 4h
            description: faker.hacker.phrase(),
          },
        })
      )
  );

  return {
    task,
    assignees,
    checklist,
    comments,
    timeEntries,
  };
}

export async function seedDemoTasks(options: SeedTaskOptions) {
  // Create feature tasks
  const featureTask = await seedTaskWithDetails({
    ...options,
    statusId: options.statusId,
  });
  await prisma.task.update({
    where: { id: featureTask.task.id },
    data: {
      title: 'Implement user authentication',
      description: 'Add OAuth2 and email/password authentication',
    },
  });

  // Create bug task
  const bugTask = await seedTaskWithDetails({
    ...options,
    statusId: options.statusId,
  });
  await prisma.task.update({
    where: { id: bugTask.task.id },
    data: {
      title: 'Fix login page responsiveness',
      description: 'Login form breaks on mobile devices',
      priority: TaskPriorityLevel.HIGH,
    },
  });

  // Create documentation task
  const docTask = await createTask({
    ...options,
    statusId: options.statusId,
  });
  await prisma.task.update({
    where: { id: docTask.id },
    data: {
      title: 'Update API documentation',
      description: 'Add new endpoints and update examples',
      priority: TaskPriorityLevel.LOW,
    },
  });

  return {
    featureTask,
    bugTask,
    docTask,
  };
}
