import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function createNotificationPreference(userId: string) {
  return prisma.notificationPreference.create({
    data: {
      userId,
      type: faker.helpers.arrayElement([
        'TASK_ASSIGNED', 'MENTION', 'COMMENT', 'DUE_DATE',
        'PROJECT_UPDATE', 'TEAM_UPDATE'
      ]),
      channel: faker.helpers.arrayElement(['EMAIL', 'PUSH', 'IN_APP']),
      enabled: faker.datatype.boolean(),
      frequency: faker.helpers.arrayElement(['IMMEDIATE', 'DAILY', 'WEEKLY']),
      quietHours: {
        enabled: faker.datatype.boolean(),
        start: '22:00',
        end: '08:00',
        timezone: faker.location.timeZone(),
      },
    },
  });
}

export async function createNotificationTemplate(userId: string) {
  const template = await prisma.notificationTemplate.create({
    data: {
      name: faker.helpers.arrayElement([
        'Task Assignment', 'Due Date Reminder', 'Mention Alert',
        'Project Update', 'Team Announcement'
      ]),
      description: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(['EMAIL', 'PUSH', 'IN_APP']),
      subject: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      variables: ['user', 'task', 'project', 'team'],
      createdById: userId,
      updatedById: userId,
      isActive: true,
      metadata: {
        category: faker.helpers.arrayElement(['TASK', 'PROJECT', 'TEAM']),
        priority: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
      },
    },
  });

  // Create template version
  await prisma.notificationTemplateVersion.create({
    data: {
      templateId: template.id,
      version: '1.0',
      content: template.content,
      changes: ['Initial version'],
      createdById: userId,
      isActive: true,
    },
  });

  return template;
}

export async function createNotification(userId: string) {
  return prisma.notification.create({
    data: {
      userId,
      type: faker.helpers.arrayElement([
        'TASK_ASSIGNED', 'MENTION', 'COMMENT', 'DUE_DATE',
        'PROJECT_UPDATE', 'TEAM_UPDATE'
      ]),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      priority: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
      status: faker.helpers.arrayElement(['UNREAD', 'READ', 'ARCHIVED']),
      metadata: {
        sourceType: faker.helpers.arrayElement(['TASK', 'PROJECT', 'COMMENT']),
        sourceId: faker.string.uuid(),
        actionUrl: faker.internet.url(),
      },
      createdAt: faker.date.past(),
      readAt: faker.datatype.boolean() ? faker.date.recent() : null,
    },
  });
}

export async function createNotificationBatch(userId: string) {
  return prisma.notificationBatch.create({
    data: {
      userId,
      type: faker.helpers.arrayElement(['DAILY_DIGEST', 'WEEKLY_SUMMARY']),
      status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SENT', 'FAILED']),
      metadata: {
        notificationCount: faker.number.int({ min: 1, max: 10 }),
        timeRange: {
          start: faker.date.past(),
          end: faker.date.recent(),
        },
      },
      scheduledFor: faker.date.future(),
      sentAt: faker.datatype.boolean() ? faker.date.recent() : null,
    },
  });
}

export async function seedUserNotifications(userId: string) {
  // Create notification preferences
  const preferences = await Promise.all(
    Array(3).fill(null).map(() => createNotificationPreference(userId))
  );

  // Create notification templates
  const templates = await Promise.all(
    Array(2).fill(null).map(() => createNotificationTemplate(userId))
  );

  // Create notifications
  const notifications = await Promise.all(
    Array(5).fill(null).map(() => createNotification(userId))
  );

  // Create notification batches
  const batches = await Promise.all(
    Array(2).fill(null).map(() => createNotificationBatch(userId))
  );

  // Create notification stats
  const stats = await prisma.notificationStats.create({
    data: {
      userId,
      totalReceived: faker.number.int({ min: 10, max: 100 }),
      totalRead: faker.number.int({ min: 5, max: 50 }),
      averageResponseTime: faker.number.int({ min: 60, max: 3600 }), // in seconds
      channelBreakdown: {
        email: faker.number.int({ min: 5, max: 50 }),
        push: faker.number.int({ min: 5, max: 50 }),
        inApp: faker.number.int({ min: 5, max: 50 }),
      },
      periodStart: faker.date.past(),
      periodEnd: faker.date.recent(),
    },
  });

  return {
    preferences,
    templates,
    notifications,
    batches,
    stats,
  };
}
