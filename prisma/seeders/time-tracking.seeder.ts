import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateTimeTrackingOptions {
  taskId: string;
  userId: string;
}

export async function createTimeTracking(options: CreateTimeTrackingOptions) {
  const { taskId, userId } = options;

  const startTime = faker.date.past();
  const duration = faker.number.int({ min: 15, max: 480 }); // 15 minutes to 8 hours
  const endTime = new Date(startTime.getTime() + duration * 60000);

  return prisma.timeTracking.create({
    data: {
      taskId,
      userId,
      startTime,
      endTime,
      duration, // in minutes
      description: faker.helpers.arrayElement([
        'Working on implementation',
        'Code review',
        'Testing',
        'Documentation',
        'Bug fixing',
        'Design work',
        'Meeting',
      ]),
      metadata: {
        category: faker.helpers.arrayElement([
          'Development',
          'Design',
          'Testing',
          'Documentation',
          'Meetings',
        ]),
        billable: faker.datatype.boolean(),
        tags: faker.helpers.arrayElements(
          ['frontend', 'backend', 'database', 'api', 'ui', 'ux'],
          { min: 1, max: 3 }
        ),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createTimeEntry(options: CreateTimeTrackingOptions) {
  const { taskId, userId } = options;

  const startTime = faker.date.past();
  const duration = faker.number.int({ min: 15, max: 480 }); // 15 minutes to 8 hours

  return prisma.timeEntry.create({
    data: {
      taskId,
      userId,
      startTime,
      endTime: new Date(startTime.getTime() + duration * 60000),
      duration,
      description: faker.lorem.sentence(),
      metadata: {
        source: faker.helpers.arrayElement(['manual', 'timer', 'calendar']),
        location: faker.helpers.arrayElement(['office', 'remote', 'client_site']),
        device: faker.helpers.arrayElement(['web', 'mobile', 'desktop']),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedTaskTimeTracking(taskId: string, userId: string) {
  // Create 3-7 time tracking entries
  const entryCount = faker.number.int({ min: 3, max: 7 });
  const timeTrackings = [];

  for (let i = 0; i < entryCount; i++) {
    const tracking = await createTimeTracking({ taskId, userId });
    timeTrackings.push(tracking);
  }

  // Create corresponding time entries
  const timeEntries = await Promise.all(
    timeTrackings.map(() => createTimeEntry({ taskId, userId }))
  );

  return {
    timeTrackings,
    timeEntries,
  };
}

export async function seedWeeklyTimeTracking(taskId: string, userId: string) {
  const timeTrackings = [];
  const timeEntries = [];

  // Create time tracking entries for the past week
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Create 1-3 entries per day
    const dailyEntries = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < dailyEntries; j++) {
      const startTime = new Date(date);
      startTime.setHours(faker.number.int({ min: 9, max: 17 }), 0, 0);
      
      const duration = faker.number.int({ min: 30, max: 240 }); // 30 minutes to 4 hours
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const tracking = await prisma.timeTracking.create({
        data: {
          taskId,
          userId,
          startTime,
          endTime,
          duration,
          description: faker.lorem.sentence(),
          metadata: {
            category: faker.helpers.arrayElement([
              'Development',
              'Design',
              'Testing',
              'Documentation',
              'Meetings',
            ]),
            billable: faker.datatype.boolean(),
          },
          createdAt: startTime,
          updatedAt: endTime,
        },
      });
      timeTrackings.push(tracking);

      const entry = await createTimeEntry({
        taskId,
        userId,
      });
      timeEntries.push(entry);
    }
  }

  return {
    timeTrackings,
    timeEntries,
  };
}
