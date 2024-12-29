import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateAuditLogOptions {
  userId: string;
  entityType: string;
  entityId: string;
}

export async function createAuditLog(options: CreateAuditLogOptions) {
  const { userId, entityType, entityId } = options;

  const action = faker.helpers.arrayElement([
    'create',
    'update',
    'delete',
    'view',
    'export',
    'import',
    'archive',
    'restore',
  ]);

  const auditLog = await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      changes: generateChanges(action, entityType),
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        timestamp: faker.date.recent(),
        location: {
          city: faker.location.city(),
          country: faker.location.country(),
        },
      },
    },
  });

  return auditLog;
}

function generateChanges(action: string, entityType: string) {
  switch (action) {
    case 'create':
      return {
        action: 'created',
        newValues: generateEntityData(entityType),
      };
    case 'update':
      return {
        action: 'updated',
        previousValues: generateEntityData(entityType),
        newValues: generateEntityData(entityType),
        changedFields: ['name', 'status', 'priority'],
      };
    case 'delete':
      return {
        action: 'deleted',
        previousValues: generateEntityData(entityType),
      };
    default:
      return {};
  }
}

function generateEntityData(entityType: string) {
  switch (entityType) {
    case 'task':
      return {
        title: faker.company.catchPhrase(),
        status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        assignee: faker.person.fullName(),
      };
    case 'project':
      return {
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        status: faker.helpers.arrayElement(['ACTIVE', 'ARCHIVED', 'COMPLETED']),
      };
    default:
      return {};
  }
}

export async function seedAuditHistory(options: CreateAuditLogOptions) {
  // Create audit logs for the past 30 days
  const auditLogs = await Promise.all(
    Array(30)
      .fill(0)
      .map(async (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        
        return createAuditLog({
          ...options,
          createdAt: date,
        });
      })
  );

  return auditLogs;
}

export async function seedDemoAuditLogs(options: CreateAuditLogOptions) {
  // Create a sequence of related audit logs
  const projectCreation = await createAuditLog({
    ...options,
    action: 'create',
    entityType: 'project',
  });

  const taskCreation = await createAuditLog({
    ...options,
    action: 'create',
    entityType: 'task',
  });

  const taskUpdate = await createAuditLog({
    ...options,
    action: 'update',
    entityType: 'task',
  });

  const taskCompletion = await createAuditLog({
    ...options,
    action: 'update',
    entityType: 'task',
    changes: {
      action: 'updated',
      previousValues: { status: 'IN_PROGRESS' },
      newValues: { status: 'COMPLETED' },
      changedFields: ['status'],
    },
  });

  return {
    projectCreation,
    taskCreation,
    taskUpdate,
    taskCompletion,
  };
}
