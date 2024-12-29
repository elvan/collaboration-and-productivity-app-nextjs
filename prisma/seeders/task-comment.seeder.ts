import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateTaskCommentOptions {
  taskId: string;
  userId: string;
  parentId?: string;
}

export async function createTaskComment(options: CreateTaskCommentOptions) {
  const { taskId, userId, parentId } = options;

  const commentTypes = [
    {
      type: 'general',
      templates: [
        'Here's an update on this task:',
        'I've made some progress:',
        'Quick update:',
        'FYI:',
      ],
    },
    {
      type: 'question',
      templates: [
        'Could someone clarify',
        'I need help with',
        'Has anyone encountered',
        'What's the best way to',
      ],
    },
    {
      type: 'feedback',
      templates: [
        'I reviewed this and',
        'Here's my feedback:',
        'Suggestions for improvement:',
        'Looking good, but',
      ],
    },
    {
      type: 'blocker',
      templates: [
        'I'm blocked by',
        'There's an issue with',
        'We need to resolve',
        'Blocker identified:',
      ],
    },
  ];

  const selectedType = faker.helpers.arrayElement(commentTypes);
  const template = faker.helpers.arrayElement(selectedType.templates);
  const content = template + ' ' + faker.lorem.paragraph();

  return prisma.taskComment.create({
    data: {
      content,
      taskId,
      userId,
      parentId,
      metadata: {
        type: selectedType.type,
        edited: faker.datatype.boolean(),
        mentions: [],
        attachments: [],
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createCommentThread(options: CreateTaskCommentOptions) {
  // Create parent comment
  const parentComment = await createTaskComment(options);

  // Create 1-3 replies
  const replyCount = faker.number.int({ min: 1, max: 3 });
  const replies = [];

  for (let i = 0; i < replyCount; i++) {
    const reply = await createTaskComment({
      ...options,
      parentId: parentComment.id,
    });
    replies.push(reply);
  }

  return {
    parentComment,
    replies,
  };
}

export async function seedTaskComments(taskId: string, userId: string) {
  // Create 2-5 comment threads
  const threadCount = faker.number.int({ min: 2, max: 5 });
  const threads = [];

  for (let i = 0; i < threadCount; i++) {
    const thread = await createCommentThread({ taskId, userId });
    threads.push(thread);
  }

  return threads;
}

export async function seedTemplateComments(taskId: string, userId: string) {
  const templates = [
    {
      type: 'requirements',
      comments: [
        'Please review the requirements carefully before starting.',
        'Make sure to follow the coding standards.',
        'Don't forget to update the documentation.',
      ],
    },
    {
      type: 'review',
      comments: [
        'Code review checklist:',
        '1. Check for edge cases',
        '2. Verify error handling',
        '3. Review performance implications',
      ],
    },
    {
      type: 'deployment',
      comments: [
        'Deployment steps:',
        '1. Run all tests',
        '2. Update version number',
        '3. Create deployment package',
        '4. Deploy to staging',
      ],
    },
  ];

  const selectedTemplate = faker.helpers.arrayElement(templates);
  const comments = [];

  for (const content of selectedTemplate.comments) {
    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId,
        userId,
        metadata: {
          type: selectedTemplate.type,
          edited: false,
          mentions: [],
          attachments: [],
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
    comments.push(comment);
  }

  return comments;
}
