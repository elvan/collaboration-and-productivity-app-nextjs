import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateWorkflowOptions {
  projectId: string;
  workspaceId: string;
}

export async function createWorkflow(options: CreateWorkflowOptions) {
  const { projectId, workspaceId } = options;

  const workflowTemplates = [
    {
      name: 'Bug Resolution',
      description: 'Standard workflow for bug fixes',
      steps: [
        { name: 'Reported', color: '#FF4444' },
        { name: 'Investigating', color: '#FFB74D' },
        { name: 'In Progress', color: '#4CAF50' },
        { name: 'Testing', color: '#42A5F5' },
        { name: 'Resolved', color: '#66BB6A' },
      ],
    },
    {
      name: 'Feature Development',
      description: 'Workflow for new feature implementation',
      steps: [
        { name: 'Backlog', color: '#9E9E9E' },
        { name: 'Design', color: '#7E57C2' },
        { name: 'Implementation', color: '#26A69A' },
        { name: 'Review', color: '#FF7043' },
        { name: 'Testing', color: '#42A5F5' },
        { name: 'Done', color: '#66BB6A' },
      ],
    },
    {
      name: 'Code Review',
      description: 'Code review and approval process',
      steps: [
        { name: 'Ready for Review', color: '#26C6DA' },
        { name: 'Under Review', color: '#FFA726' },
        { name: 'Changes Requested', color: '#EF5350' },
        { name: 'Approved', color: '#66BB6A' },
        { name: 'Merged', color: '#8D6E63' },
      ],
    },
  ];

  const template = faker.helpers.arrayElement(workflowTemplates);

  return prisma.workflow.create({
    data: {
      name: template.name,
      description: template.description,
      projectId,
      workspaceId,
      isActive: true,
      metadata: {
        steps: template.steps,
        transitions: template.steps.map((step, index) => ({
          from: index > 0 ? template.steps[index - 1].name : null,
          to: step.name,
          conditions: [],
        })),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function createWorkflowAutomation(workflowId: string, projectId: string) {
  const automationTemplates = [
    {
      name: 'Auto Assign Reviewer',
      description: 'Automatically assign a reviewer when task moves to review',
      trigger: {
        type: 'STATUS_CHANGE',
        condition: 'status === "REVIEW"',
      },
      action: {
        type: 'ASSIGN_REVIEWER',
        params: {
          role: 'REVIEWER',
        },
      },
    },
    {
      name: 'Notify on High Priority',
      description: 'Send notification when high priority task is created',
      trigger: {
        type: 'TASK_CREATED',
        condition: 'priority === "HIGH"',
      },
      action: {
        type: 'SEND_NOTIFICATION',
        params: {
          template: 'HIGH_PRIORITY_TASK',
        },
      },
    },
    {
      name: 'Update Due Date',
      description: 'Update due date when task is blocked',
      trigger: {
        type: 'TASK_BLOCKED',
        condition: 'true',
      },
      action: {
        type: 'UPDATE_DUE_DATE',
        params: {
          adjustment: '+2 days',
        },
      },
    },
  ];

  const template = faker.helpers.arrayElement(automationTemplates);

  return prisma.workflowAutomation.create({
    data: {
      name: template.name,
      description: template.description,
      workflowId,
      projectId,
      trigger: template.trigger,
      action: template.action,
      isActive: true,
      metadata: {
        lastRun: faker.date.recent(),
        runCount: faker.number.int({ min: 0, max: 100 }),
        successRate: faker.number.float({ min: 0.8, max: 1, precision: 0.01 }),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });
}

export async function seedProjectWorkflows(options: CreateWorkflowOptions) {
  // Create 2-3 workflows
  const workflowCount = faker.number.int({ min: 2, max: 3 });
  const workflows = [];

  for (let i = 0; i < workflowCount; i++) {
    const workflow = await createWorkflow(options);
    
    // Create 1-2 automations per workflow
    const automationCount = faker.number.int({ min: 1, max: 2 });
    const automations = [];
    
    for (let j = 0; j < automationCount; j++) {
      const automation = await createWorkflowAutomation(workflow.id, options.projectId);
      automations.push(automation);
    }

    workflows.push({
      workflow,
      automations,
    });
  }

  return workflows;
}
