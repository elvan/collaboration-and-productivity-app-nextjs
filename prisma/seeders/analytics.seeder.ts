import { PrismaClient, AnalyticsType, AnalyticsMetric, AnalyticsPeriod } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateAnalyticsOptions {
  type: AnalyticsType;
  entityId: string;
  startDate?: Date;
  endDate?: Date;
}

export async function createAnalytics(options: CreateAnalyticsOptions) {
  const { type, entityId, startDate = faker.date.past(), endDate = faker.date.recent() } = options;

  const analytics = await prisma.analytics.create({
    data: {
      type,
      entityId,
      metric: faker.helpers.enumValue(AnalyticsMetric),
      value: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
      period: faker.helpers.enumValue(AnalyticsPeriod),
      startDate,
      endDate,
      metadata: generateMetadata(type),
    },
  });

  return analytics;
}

function generateMetadata(type: AnalyticsType) {
  switch (type) {
    case 'TASK':
      return {
        taskType: faker.helpers.arrayElement(['feature', 'bug', 'improvement']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        assigneeCount: faker.number.int({ min: 1, max: 5 }),
        averageTimeToComplete: faker.number.int({ min: 1, max: 72 }) + ' hours',
      };
    case 'PROJECT':
      return {
        totalTasks: faker.number.int({ min: 10, max: 100 }),
        completedTasks: faker.number.int({ min: 5, max: 50 }),
        activeMembers: faker.number.int({ min: 3, max: 15 }),
        healthScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
      };
    case 'USER':
      return {
        tasksCompleted: faker.number.int({ min: 0, max: 50 }),
        averageResponseTime: faker.number.int({ min: 1, max: 24 }) + ' hours',
        collaborationScore: faker.number.float({ min: 0, max: 10, precision: 0.1 }),
        activeProjects: faker.number.int({ min: 1, max: 5 }),
      };
    default:
      return {};
  }
}

export async function seedAnalytics(options: CreateAnalyticsOptions) {
  // Create daily analytics for the past 30 days
  const dailyAnalytics = await Promise.all(
    Array(30)
      .fill(0)
      .map(async (_, index) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - index);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59);

        return createAnalytics({
          ...options,
          startDate,
          endDate,
        });
      })
  );

  // Create weekly analytics for the past 12 weeks
  const weeklyAnalytics = await Promise.all(
    Array(12)
      .fill(0)
      .map(async (_, index) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - index * 7);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        return createAnalytics({
          ...options,
          startDate,
          endDate,
        });
      })
  );

  // Create monthly analytics for the past 6 months
  const monthlyAnalytics = await Promise.all(
    Array(6)
      .fill(0)
      .map(async (_, index) => {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - index);
        startDate.setDate(1);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        return createAnalytics({
          ...options,
          startDate,
          endDate,
        });
      })
  );

  return {
    dailyAnalytics,
    weeklyAnalytics,
    monthlyAnalytics,
  };
}
