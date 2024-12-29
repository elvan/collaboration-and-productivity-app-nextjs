import { PrismaClient, CustomFieldType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateCustomFieldOptions {
  projectId?: string;
  workspaceId?: string;
  taskTypeId?: string;
}

export async function createCustomField(options: CreateCustomFieldOptions) {
  const { projectId, workspaceId, taskTypeId } = options;

  const fieldTypes = [
    {
      type: 'TEXT',
      config: {
        placeholder: 'Enter text here',
        minLength: 0,
        maxLength: 1000,
      },
    },
    {
      type: 'NUMBER',
      config: {
        min: 0,
        max: 1000,
        step: 1,
      },
    },
    {
      type: 'DATE',
      config: {
        includeTime: true,
        minDate: null,
        maxDate: null,
      },
    },
    {
      type: 'DROPDOWN',
      config: {
        options: ['Option 1', 'Option 2', 'Option 3'],
        allowMultiple: false,
      },
    },
    {
      type: 'CHECKBOX',
      config: {
        defaultValue: false,
      },
    },
    {
      type: 'URL',
      config: {
        validateUrl: true,
      },
    },
    {
      type: 'EMAIL',
      config: {
        validateEmail: true,
      },
    },
    {
      type: 'PROGRESS',
      config: {
        min: 0,
        max: 100,
        step: 5,
      },
    },
  ];

  const field = fieldTypes[faker.number.int({ min: 0, max: fieldTypes.length - 1 })];

  return prisma.customField.create({
    data: {
      name: faker.helpers.arrayElement([
        'Priority Level',
        'Due Date',
        'Assignee',
        'Status',
        'Progress',
        'Category',
        'Department',
        'Cost Center',
        'Risk Level',
        'Customer Impact',
      ]),
      description: faker.lorem.sentence(),
      type: field.type as CustomFieldType,
      required: faker.datatype.boolean(),
      options: field.config,
      defaultValue: null,
      placeholder: faker.lorem.words(3),
      validation: {},
      position: faker.number.int({ min: 0, max: 100 }),
      hidden: false,
      global: faker.datatype.boolean(),
      projectId,
      workspaceId,
      taskTypeId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createCustomFieldValue(taskId: string, fieldId: string) {
  const field = await prisma.customField.findUnique({
    where: { id: fieldId },
  });

  let value;
  switch (field?.type) {
    case 'TEXT':
      value = faker.lorem.sentence();
      break;
    case 'NUMBER':
      value = faker.number.int({ min: 0, max: 1000 });
      break;
    case 'DATE':
      value = faker.date.future();
      break;
    case 'DROPDOWN':
      value = faker.helpers.arrayElement(field.options?.options || []);
      break;
    case 'CHECKBOX':
      value = faker.datatype.boolean();
      break;
    case 'URL':
      value = faker.internet.url();
      break;
    case 'EMAIL':
      value = faker.internet.email();
      break;
    case 'PROGRESS':
      value = faker.number.int({ min: 0, max: 100 });
      break;
    default:
      value = null;
  }

  return prisma.customFieldValue.create({
    data: {
      taskId,
      fieldId,
      value: { value },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedCustomFields(options: CreateCustomFieldOptions) {
  // Create various types of custom fields
  const fields = await Promise.all([
    createCustomField(options),
    createCustomField(options),
    createCustomField(options),
    createCustomField(options),
  ]);

  return fields;
}

export async function seedCustomFieldValues(taskId: string, fields: any[]) {
  const values = await Promise.all(
    fields.map((field) => createCustomFieldValue(taskId, field.id))
  );

  return values;
}
