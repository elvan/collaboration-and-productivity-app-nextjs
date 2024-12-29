import { PrismaClient, ActivityType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateActivityOptions {
  projectId?: string;
  taskId?: string;
  userId: string;
}

export async function createActivity(options: CreateActivityOptions) {
  const { projectId, taskId, userId } = options;

  const activityType = faker.helpers.enumValue(ActivityType);
  const entityType = taskId ? 'Task' : 'Project';
  const entityId = taskId || projectId;

  const activity = await prisma.activity.create({
    data: {
      type: activityType,
      projectId,
      taskId,
      userId,
      entityType,
      entityId: entityId!,
      metadata: {
        browser: faker.internet.userAgent(),
        ip: faker.internet.ip(),
        location: faker.location.city(),
        details: getActivityDetails(activityType),
      },
    },
  });

  return activity;
}

function getActivityDetails(type: ActivityType) {
  switch (type) {
    case 'CREATED':
      return { action: 'created', description: 'Created new item' };
    case 'UPDATED':
      return {
        action: 'updated',
        fields: ['status', 'priority', 'assignee'],
        changes: {
          status: { from: 'TODO', to: 'IN_PROGRESS' },
          priority: { from: 'LOW', to: 'HIGH' },
        },
      };
    case 'DELETED':
      return { action: 'deleted', reason: 'No longer needed' };
    case 'COMMENTED':
      return {
        action: 'commented',
        commentId: faker.string.uuid(),
        content: faker.lorem.sentence(),
      };
    case 'ASSIGNED':
      return {
        action: 'assigned',
        assigneeId: faker.string.uuid(),
        assigneeName: faker.person.fullName(),
      };
    case 'COMPLETED':
      return {
        action: 'completed',
        completedAt: faker.date.recent(),
        timeSpent: faker.number.int({ min: 1, max: 8 }) + ' hours',
      };
    default:
      return {};
  }
}

export async function seedActivityHistory(options: CreateActivityOptions, count = 10) {
  const activities = [];
  for (let i = 0; i < count; i++) {
    const activity = await createActivity({
      ...options,
      userId: options.userId,
    });
    activities.push(activity);
  }
  return activities;
}
