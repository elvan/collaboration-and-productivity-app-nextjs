import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedTaskOptions {
  projectId: string;
  typeId: string;
  statusId: string;
  priorityId: string;
  createdById: string;
  assigneeId?: string;
  customData?: {
    title?: string;
    description?: string;
    dueDate?: Date;
    labels?: string[];
    customFields?: Record<string, any>;
  };
}

async function createTask(options: SeedTaskOptions) {
  const { projectId, typeId, statusId, priorityId, createdById, assigneeId, customData } = options;

  // Calculate realistic dates
  const now = new Date();
  const startDate = faker.date.between({ from: now, to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) });
  const endDate = faker.date.between({ from: startDate, to: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) });

  // Create task with realistic data
  const task = await prisma.task.create({
    data: {
      title: customData?.title || faker.company.catchPhrase(),
      description: customData?.description || faker.lorem.paragraphs(2),
      projectId,
      typeId,
      statusId,
      priorityId,
      createdById,
      ...(assigneeId ? { assigneeId } : {}),
      startDate,
      dueDate: customData?.dueDate || endDate,
      timeEstimate: faker.number.int({ min: 30, max: 480 }), // 30min to 8h
      timeSpent: faker.number.int({ min: 0, max: 480 }),
      points: faker.number.int({ min: 1, max: 13 }),
      position: faker.number.float({ min: 0, max: 1000 }),
    },
  });

  // Add labels if provided
  if (customData?.labels?.length) {
    await Promise.all(
      customData.labels.map((labelId) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            labels: {
              connect: { id: labelId },
            },
          },
        })
      )
    );
  }

  // Add custom field values if provided
  if (customData?.customFields) {
    await Promise.all(
      Object.entries(customData.customFields).map(([fieldId, value]) =>
        prisma.customFieldValue.create({
          data: {
            taskId: task.id,
            fieldId,
            value: JSON.stringify(value),
          },
        })
      )
    );
  }

  // Create checklist
  const checklist = await prisma.checklist.create({
    data: {
      title: 'Implementation Steps',
      taskId: task.id,
      items: {
        create: Array(faker.number.int({ min: 2, max: 5 }))
          .fill(0)
          .map(() => ({
            content: faker.hacker.phrase(),
            completed: faker.datatype.boolean(),
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
            userId: createdById,
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
            userId: createdById,
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
    checklist,
    comments,
    timeEntries,
  };
}

export async function seedProjectTasks(
  projectId: string,
  projectData: {
    taskTypes: any[];
    taskStatuses: any[];
    taskPriorities: any[];
    labels: any[];
    customFields: any[];
  },
  assignees: { id: string }[]
) {
  const tasks = await Promise.all(
    Array(faker.number.int({ min: 10, max: 25 }))
      .fill(0)
      .map(async () => {
        // Select random configurations
        const taskType = faker.helpers.arrayElement(projectData.taskTypes);
        const status = faker.helpers.arrayElement(projectData.taskStatuses);
        const priority = faker.helpers.arrayElement(projectData.taskPriorities);
        const assignee = faker.helpers.arrayElement(assignees);
        const creator = faker.helpers.arrayElement(assignees);
        
        // Randomly select 1-3 labels
        const labels = faker.helpers.arrayElements(
          projectData.labels.map((l) => l.id),
          faker.number.int({ min: 1, max: 3 })
        );

        // Generate random custom field values
        const customFields = Object.fromEntries(
          projectData.customFields.map((field) => [
            field.id,
            field.type === 'NUMBER'
              ? faker.number.int({ min: 1, max: 13 })
              : field.type === 'DROPDOWN'
              ? faker.helpers.arrayElement(field.options)
              : null,
          ])
        );

        return createTask({
          projectId,
          typeId: taskType.id,
          statusId: status.id,
          priorityId: priority.id,
          createdById: creator.id,
          assigneeId: assignee?.id,
          customData: {
            labels,
            customFields,
          },
        });
      })
  );

  return tasks;
}
