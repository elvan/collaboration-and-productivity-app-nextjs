import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateSprintOptions {
  projectId: string;
}

export async function createSprint(options: CreateSprintOptions) {
  const { projectId } = options;

  // Sprint duration is typically 2 weeks
  const startDate = faker.date.past();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 14);

  const sprintNumber = faker.number.int({ min: 1, max: 20 });

  return prisma.sprint.create({
    data: {
      name: `Sprint ${sprintNumber}`,
      startDate,
      endDate,
      status: faker.helpers.arrayElement(['PLANNED', 'ACTIVE', 'COMPLETED']),
      projectId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createSprintWithTasks(options: CreateSprintOptions) {
  const sprint = await createSprint(options);

  // Create 5-10 tasks for this sprint
  const taskCount = faker.number.int({ min: 5, max: 10 });
  const tasks = [];

  for (let i = 0; i < taskCount; i++) {
    const task = await prisma.task.create({
      data: {
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        projectId: options.projectId,
        sprintId: sprint.id,
        createdById: (await prisma.user.findFirst())?.id || '',
        position: i,
        points: faker.number.float({ min: 1, max: 13, precision: 0.5 }),
        timeEstimate: faker.number.int({ min: 60, max: 480 }), // 1-8 hours
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
    tasks.push(task);
  }

  return {
    sprint,
    tasks,
  };
}

export async function seedProjectSprints(projectId: string) {
  // Create past sprints (completed)
  const pastSprintCount = faker.number.int({ min: 3, max: 5 });
  const pastSprints = [];

  for (let i = 0; i < pastSprintCount; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - ((i + 1) * 14));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 14);

    const sprint = await prisma.sprint.create({
      data: {
        name: `Sprint ${i + 1}`,
        startDate,
        endDate,
        status: 'COMPLETED',
        projectId,
        createdAt: startDate,
        updatedAt: endDate,
      },
    });
    pastSprints.push(sprint);
  }

  // Create current sprint (active)
  const currentSprint = await prisma.sprint.create({
    data: {
      name: `Sprint ${pastSprintCount + 1}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      projectId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });

  // Create future sprints (planned)
  const futureSprints = [];
  const futureSprintCount = faker.number.int({ min: 2, max: 3 });

  for (let i = 0; i < futureSprintCount; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + ((i + 1) * 14));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 14);

    const sprint = await prisma.sprint.create({
      data: {
        name: `Sprint ${pastSprintCount + i + 2}`,
        startDate,
        endDate,
        status: 'PLANNED',
        projectId,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
    futureSprints.push(sprint);
  }

  return {
    pastSprints,
    currentSprint,
    futureSprints,
  };
}
