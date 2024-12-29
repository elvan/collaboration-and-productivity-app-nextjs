import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateChecklistOptions {
  taskId: string;
}

export async function createChecklist(options: CreateChecklistOptions) {
  const { taskId } = options;

  const checklist = await prisma.checklist.create({
    data: {
      name: faker.helpers.arrayElement([
        'Implementation Steps',
        'Review Process',
        'Testing Checklist',
        'Deployment Steps',
        'Documentation Tasks',
        'Quality Checks',
        'Design Review',
        'Security Checks',
      ]),
      description: faker.lorem.sentence(),
      taskId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });

  // Create 3-7 checklist items
  const itemCount = faker.number.int({ min: 3, max: 7 });
  const items = [];

  for (let i = 0; i < itemCount; i++) {
    const item = await prisma.checklistItem.create({
      data: {
        content: faker.lorem.sentence(),
        completed: faker.datatype.boolean(),
        position: i,
        checklistId: checklist.id,
        assigneeId: null, // Optional: Add assignee if needed
        dueDate: faker.date.future(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
    items.push(item);
  }

  return {
    checklist,
    items,
  };
}

export async function createTemplateChecklist(name: string) {
  const templateItems = [
    // Development Template
    {
      template: 'Development',
      items: [
        'Review requirements and specifications',
        'Set up development environment',
        'Implement core functionality',
        'Write unit tests',
        'Perform code review',
        'Update documentation',
        'Deploy to staging',
      ],
    },
    // Testing Template
    {
      template: 'Testing',
      items: [
        'Create test plan',
        'Write test cases',
        'Perform unit testing',
        'Run integration tests',
        'Conduct user acceptance testing',
        'Document test results',
        'Report bugs and issues',
      ],
    },
    // Design Review Template
    {
      template: 'Design Review',
      items: [
        'Review design specifications',
        'Check responsive layouts',
        'Verify accessibility compliance',
        'Review color schemes',
        'Test user interactions',
        'Validate against style guide',
        'Collect feedback',
      ],
    },
  ];

  const template = templateItems.find((t) => t.template === name) || templateItems[0];
  const items = template.items.map((content, index) => ({
    content,
    completed: false,
    position: index,
  }));

  return items;
}

export async function seedTaskChecklists(taskId: string) {
  // Create 1-3 checklists per task
  const checklistCount = faker.number.int({ min: 1, max: 3 });
  const checklists = [];

  for (let i = 0; i < checklistCount; i++) {
    const checklist = await createChecklist({ taskId });
    checklists.push(checklist);
  }

  return checklists;
}

export async function seedTemplateChecklists(taskId: string) {
  const templates = ['Development', 'Testing', 'Design Review'];
  const selectedTemplate = faker.helpers.arrayElement(templates);
  
  const checklist = await prisma.checklist.create({
    data: {
      name: selectedTemplate + ' Checklist',
      description: 'Standard checklist for ' + selectedTemplate.toLowerCase(),
      taskId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });

  const templateItems = await createTemplateChecklist(selectedTemplate);
  const items = await Promise.all(
    templateItems.map((item, index) =>
      prisma.checklistItem.create({
        data: {
          ...item,
          checklistId: checklist.id,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      })
    )
  );

  return {
    checklist,
    items,
  };
}
