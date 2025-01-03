import { faker } from '@faker-js/faker';
import { PrismaClient, ProjectStatus, TaskStatusEnum, TaskPriorityLevel, TaskViewType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedProjectOptions {
  workspaceId: string;
  ownerId: string;
  teamId?: string;
  projectType?: string;
  customData?: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    taskTypes?: string[];
    labels?: string[];
  };
}

export async function createProject(options: SeedProjectOptions) {
  const { workspaceId, ownerId, teamId, customData } = options;

  // Create project with realistic data
  const project = await prisma.project.create({
    data: {
      name: customData?.name || faker.company.catchPhrase(),
      description: customData?.description || faker.company.buzzPhrase(),
      workspaceId,
      ownerId,
      status: (customData?.status as ProjectStatus) || faker.helpers.arrayElement(Object.values(ProjectStatus)),
      ...(teamId ? { teamId } : {}),
    },
  });

  // Create task types specific to project type
  const taskTypes = await Promise.all(
    (customData?.taskTypes || ['Feature', 'Bug', 'Task']).map((name) =>
      prisma.taskType.create({
        data: {
          name,
          description: `${name} type tasks`,
          icon: faker.helpers.arrayElement(['Star', 'Bug', 'File', 'Task', 'Folder']),
          color: faker.internet.color(),
          projectId: project.id,
        },
      })
    )
  );

  // Create task statuses with workflow configuration
  const taskStatuses = await Promise.all([
    prisma.taskStatus.create({
      data: {
        name: 'To Do',
        description: 'Tasks that need to be started',
        color: '#E2E8F0',
        category: TaskStatusEnum.TODO,
        position: 1,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'In Progress',
        description: 'Tasks currently being worked on',
        color: '#3B82F6',
        category: TaskStatusEnum.IN_PROGRESS,
        position: 2,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'Done',
        description: 'Completed tasks',
        color: '#22C55E',
        category: TaskStatusEnum.DONE,
        position: 3,
        projectId: project.id,
      },
    }),
  ]);

  // Create task priorities
  const taskPriorities = await Promise.all([
    prisma.taskPriority.create({
      data: {
        name: 'Low',
        color: '#94A3B8',
        description: 'Non-urgent tasks',
        level: 1,
        projectId: project.id,
      },
    }),
    prisma.taskPriority.create({
      data: {
        name: 'Medium',
        color: '#F59E0B',
        description: 'Normal priority tasks',
        level: 2,
        projectId: project.id,
      },
    }),
    prisma.taskPriority.create({
      data: {
        name: 'High',
        color: '#EF4444',
        description: 'Urgent tasks',
        level: 3,
        projectId: project.id,
      },
    }),
  ]);

  // Create labels specific to project type
  const labels = await Promise.all(
    (customData?.labels || ['Frontend', 'Backend', 'Documentation']).map((name) =>
      prisma.label.create({
        data: {
          name,
          color: faker.internet.color(),
          projectId: project.id,
        },
      })
    )
  );

  // Create custom fields
  const customFields = await Promise.all([
    prisma.customField.create({
      data: {
        name: 'Story Points',
        type: 'NUMBER',
        description: 'Estimated effort in story points',
        required: false,
        position: 1,
        options: {
          min: 1,
          max: 13,
          step: 0.5,
        },
        defaultValue: 1,
        projectId: project.id,
      },
    }),
    prisma.customField.create({
      data: {
        name: 'Target Release',
        type: 'DROPDOWN',
        description: 'Target release version',
        required: false,
        position: 2,
        options: ['v1.0', 'v1.1', 'v2.0'],
        defaultValue: 'v1.0',
        projectId: project.id,
      },
    }),
  ]);

  // Create priority rules
  await prisma.priorityRule.create({
    data: {
      name: 'High Priority for Urgent Bugs',
      description: 'Automatically set high priority for bug reports marked as urgent',
      projectId: project.id,
      conditions: {
        type: 'Bug',
        labels: ['urgent'],
      },
      actions: {
        setPriority: 'High',
        notify: ['project_owner', 'assignee'],
      },
      isActive: true,
    },
  });

  // Create workflow first
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Code Review Process',
      description: 'Standard code review workflow',
      projectId: project.id,
      isActive: true,
      steps: [
        {
          id: 'step1',
          name: 'Submit for Review',
          type: 'STATUS_CHANGE',
          config: {
            fromStatus: 'IN_PROGRESS',
            toStatus: 'REVIEW',
          },
        },
        {
          id: 'step2',
          name: 'Review Process',
          type: 'APPROVAL',
          config: {
            approvers: ['TEAM_LEAD'],
            minApprovals: 1,
          },
        },
        {
          id: 'step3',
          name: 'Complete Review',
          type: 'STATUS_CHANGE',
          config: {
            fromStatus: 'REVIEW',
            toStatus: 'DONE',
          },
        },
      ],
    },
  });

  // Create workflow automation
  await prisma.workflowAutomation.create({
    data: {
      name: 'Auto-assign Code Review',
      description: 'Automatically assign code review tasks to team leads',
      projectId: project.id,
      workflowId: workflow.id,
      triggerType: 'TASK_STATUS_CHANGED',
      conditions: {
        newStatus: 'Review',
        type: 'Feature',
      },
      actions: {
        assignTo: ['team_leads'],
        notify: ['assignee'],
      },
      isActive: true,
    },
  });

  return {
    project,
    taskTypes,
    taskStatuses,
    taskPriorities,
    labels,
    customFields,
  };
}

export async function seedProjectWithMembers(options: SeedProjectOptions) {
  const projectData = await createProject(options);
  const { project } = projectData;

  // Create demo users for project members
  const demoUsers = await Promise.all(
    Array(4).fill(0).map(async () => {
      const password = await hash('password123', 12);
      return prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: password,
          status: 'ACTIVE',
        },
      });
    })
  );

  // Create project members with different roles
  const members = await Promise.all(
    demoUsers.map((user, index) => {
      // Assign roles in a round-robin fashion
      const role = index === 0 ? 'admin' : 'member';

      return prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role,
        },
      });
    })
  );

  // Import task seeder
  const { seedProjectTasks } = await import('./task.seeder');

  // Create tasks for the project
  const tasks = await seedProjectTasks(
    project.id,
    {
      taskTypes: projectData.taskTypes,
      taskStatuses: projectData.taskStatuses,
      taskPriorities: projectData.taskPriorities,
      labels: projectData.labels,
      customFields: projectData.customFields,
    },
    demoUsers
  );

  return {
    ...projectData,
    members,
    tasks,
  };
}

export async function seedDemoProjects(workspaceId: string, ownerId: string, teamId?: string) {
  // Project types with their associated task types and labels
  const projectTypes = [
    {
      category: 'Software Development',
      taskTypes: ['Feature', 'Bug', 'Documentation', 'Technical Debt'],
      labels: ['Frontend', 'Backend', 'API', 'Database', 'UI/UX', 'Testing'],
      prefixes: ['Web App', 'Mobile App', 'API', 'Platform', 'Dashboard'],
    },
    {
      category: 'Marketing',
      taskTypes: ['Campaign', 'Content', 'Design', 'Analytics', 'Social Media'],
      labels: ['Branding', 'Social', 'Email', 'SEO', 'Content Marketing'],
      prefixes: ['Campaign', 'Launch', 'Brand', 'Marketing'],
    },
    {
      category: 'Design',
      taskTypes: ['UI Design', 'UX Research', 'Prototyping', 'Visual Design'],
      labels: ['Web Design', 'Mobile Design', 'Branding', 'Illustration'],
      prefixes: ['Design System', 'Website', 'Product'],
    },
    {
      category: 'Business',
      taskTypes: ['Research', 'Planning', 'Analysis', 'Strategy'],
      labels: ['Strategy', 'Operations', 'Finance', 'HR', 'Legal'],
      prefixes: ['Strategy', 'Initiative', 'Program'],
    },
  ];

  // Create 10 projects
  const projects = await Promise.all(
    Array(10).fill(0).map(async (_, index) => {
      // Select random project type
      const projectType = faker.helpers.arrayElement(projectTypes);

      // Generate project name
      const prefix = faker.helpers.arrayElement(projectType.prefixes);
      const name = index < 5
        ? `${prefix} ${faker.company.buzzNoun()}` // More generic names for first 5
        : `${prefix} - ${faker.company.catchPhrase()}`; // More specific names for rest

      // Create project with members
      const project = await seedProjectWithMembers({
        workspaceId,
        ownerId,
        teamId: index % 3 === 0 ? teamId : undefined, // Assign team to every 3rd project
        projectType: projectType.category,
        customData: {
          name,
          description: faker.company.catchPhrase() + '. ' + faker.lorem.paragraph(),
          status: index < 20 ? 'ACTIVE' : 'ARCHIVED', // Make last 5 projects archived
          taskTypes: projectType.taskTypes,
          labels: projectType.labels,
        }
      });

      return project;
    })
  );

  return projects;
}
