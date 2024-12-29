import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedTaskOptions {
  projectId: string;
  createdById: string;
}

async function createTask(options: SeedTaskOptions) {
  const { projectId, createdById } = options;

  // Generate random dates for the task
  const startDate = faker.date.future();
  const endDate = faker.date.between({ from: startDate, to: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) });

  // Create task with realistic data
  const task = await prisma.task.create({
    data: {
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraphs(2),
      projectId,
      createdById,
      startDate,
      dueDate: endDate,
      timeEstimate: faker.number.int({ min: 60, max: 480 }),
      timeSpent: faker.number.int({ min: 0, max: 480 }),
      points: faker.number.int({ min: 1, max: 13 }),
      position: faker.number.float({ min: 0, max: 1000 }),
      status: 'active',
      priority: 'medium',
      assignees: {
        create: {
          userId: createdById,
        },
      },
    },
  });

  return task;
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
          createdById: creator.id,
        });
      })
  );

  return tasks;
}
