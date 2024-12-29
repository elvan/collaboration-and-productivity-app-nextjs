import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateIntegrationOptions {
  projectId: string;
}

export async function createIntegration(options: CreateIntegrationOptions) {
  const { projectId } = options;

  const integrationTypes = [
    {
      type: 'GITHUB',
      name: 'GitHub',
      description: 'GitHub repository integration',
      config: {
        repository: faker.internet.url(),
        branch: 'main',
        webhookUrl: faker.internet.url(),
        events: ['push', 'pull_request', 'issues'],
      },
    },
    {
      type: 'SLACK',
      name: 'Slack',
      description: 'Slack channel notifications',
      config: {
        channel: '#project-updates',
        webhookUrl: faker.internet.url(),
        events: ['task.created', 'task.completed', 'sprint.started'],
      },
    },
    {
      type: 'JIRA',
      name: 'Jira',
      description: 'Jira issue tracking',
      config: {
        projectKey: 'PROJ',
        domain: faker.internet.domainName(),
        issueTypes: ['Story', 'Bug', 'Task'],
      },
    },
    {
      type: 'GITLAB',
      name: 'GitLab',
      description: 'GitLab repository integration',
      config: {
        projectId: faker.string.numeric(6),
        branch: 'main',
        webhookUrl: faker.internet.url(),
        events: ['push', 'merge_request', 'issue'],
      },
    },
  ];

  const integration = faker.helpers.arrayElement(integrationTypes);

  return prisma.integration.create({
    data: {
      type: integration.type,
      name: integration.name,
      description: integration.description,
      config: integration.config,
      projectId,
      isActive: true,
      metadata: {
        lastSync: faker.date.recent(),
        syncStatus: 'SUCCESS',
        errorCount: faker.number.int({ min: 0, max: 5 }),
        successCount: faker.number.int({ min: 10, max: 100 }),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createWebhook(projectId: string, integrationType: string) {
  const webhookTemplates = [
    {
      type: 'TASK_UPDATED',
      url: faker.internet.url(),
      events: ['task.created', 'task.updated', 'task.deleted'],
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': faker.string.alphanumeric(32),
      },
    },
    {
      type: 'SPRINT_STATUS',
      url: faker.internet.url(),
      events: ['sprint.started', 'sprint.completed'],
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': faker.string.alphanumeric(32),
      },
    },
    {
      type: 'COMMENT_NOTIFICATION',
      url: faker.internet.url(),
      events: ['comment.created', 'comment.updated'],
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': faker.string.alphanumeric(32),
      },
    },
  ];

  const template = faker.helpers.arrayElement(webhookTemplates);

  return prisma.webhook.create({
    data: {
      name: `${integrationType} ${template.type} Webhook`,
      url: template.url,
      events: template.events,
      headers: template.headers,
      projectId,
      isActive: true,
      metadata: {
        lastTriggered: faker.date.recent(),
        successCount: faker.number.int({ min: 10, max: 100 }),
        failureCount: faker.number.int({ min: 0, max: 5 }),
        averageResponseTime: faker.number.int({ min: 100, max: 1000 }),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedProjectIntegrations(projectId: string) {
  // Create 2-3 integrations
  const integrationCount = faker.number.int({ min: 2, max: 3 });
  const integrations = [];

  for (let i = 0; i < integrationCount; i++) {
    const integration = await createIntegration({ projectId });
    
    // Create 1-2 webhooks per integration
    const webhooks = await Promise.all([
      createWebhook(projectId, integration.type),
      faker.datatype.boolean() && createWebhook(projectId, integration.type),
    ].filter(Boolean));

    integrations.push({
      integration,
      webhooks,
    });
  }

  return integrations;
}
