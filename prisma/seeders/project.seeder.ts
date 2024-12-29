import { faker } from '@faker-js/faker';
import { PrismaClient, ProjectStatus, TaskStatusEnum } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

interface SeedProjectOptions {
  workspaceId: string;
  ownerId: string;
  teamId?: string;
}

export async function createProject(options: SeedProjectOptions) {
  const { workspaceId, ownerId, teamId } = options;

  // Create project with realistic data
  const project = await prisma.project.create({
    data: {
      name: faker.company.catchPhrase(),
      description: faker.company.buzzPhrase(),
      workspaceId,
      ownerId,
      status: faker.helpers.arrayElement(Object.values(ProjectStatus)),
      ...(teamId ? { teamId } : {}), // Only include teamId if provided
    },
  });

  // Create task statuses
  const taskStatuses = await Promise.all([
    prisma.taskStatus.create({
      data: {
        name: 'To Do',
        color: '#E2E8F0',
        description: 'Tasks that need to be started',
        position: 1,
        category: TaskStatusEnum.TODO,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'In Progress',
        color: '#3B82F6',
        description: 'Tasks currently being worked on',
        position: 2,
        category: TaskStatusEnum.IN_PROGRESS,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'Review',
        color: '#A855F7',
        description: 'Tasks ready for review',
        position: 3,
        category: TaskStatusEnum.IN_PROGRESS,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'Done',
        color: '#22C55E',
        description: 'Completed tasks',
        position: 4,
        category: TaskStatusEnum.DONE,
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

  // Create task types
  const taskTypes = await Promise.all([
    prisma.taskType.create({
      data: {
        name: 'Feature',
        color: '#3B82F6',
        icon: 'Star',
        projectId: project.id,
      },
    }),
    prisma.taskType.create({
      data: {
        name: 'Bug',
        color: '#EF4444',
        icon: 'Bug',
        projectId: project.id,
      },
    }),
    prisma.taskType.create({
      data: {
        name: 'Documentation',
        color: '#A855F7',
        icon: 'FileText',
        projectId: project.id,
      },
    }),
  ]);

  // Create labels
  const labels = await Promise.all([
    prisma.label.create({
      data: {
        name: 'Frontend',
        color: '#60A5FA',
        projectId: project.id,
      },
    }),
    prisma.label.create({
      data: {
        name: 'Backend',
        color: '#34D399',
        projectId: project.id,
      },
    }),
    prisma.label.create({
      data: {
        name: 'UI/UX',
        color: '#F472B6',
        projectId: project.id,
      },
    }),
  ]);

  // Create custom fields
  const customFields = await Promise.all([
    prisma.customField.create({
      data: {
        name: 'Story Points',
        type: 'NUMBER',
        description: 'Estimated effort in story points',
        required: false,
        position: 1,
        projectId: project.id,
      },
    }),
    prisma.customField.create({
      data: {
        name: 'Target Release',
        type: 'TEXT',
        description: 'Target release version',
        required: false,
        position: 2,
        projectId: project.id,
      },
    }),
  ]);

  // Create priority rules
  await prisma.priorityRule.create({
    data: {
      name: 'High Priority for Urgent Bugs',
      description:
        'Automatically set high priority for bug reports marked as urgent',
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
    taskStatuses,
    taskPriorities,
    taskTypes,
    labels,
    customFields,
  };
}

export async function seedProjectWithMembers(options: SeedProjectOptions) {
  const projectData = await createProject(options);

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
  const memberRoles = ['admin', 'member', 'member', 'member'];
  const members = await Promise.all(
    memberRoles.map((role, index) =>
      prisma.projectMember.create({
        data: {
          projectId: projectData.project.id,
          userId: demoUsers[index].id,
          role,
        },
      })
    )
  );

  return {
    ...projectData,
    members,
  };
}

export async function seedDemoProjects(workspaceId: string, ownerId: string, teamId?: string) {
  // Create multiple demo projects
  const projects = await Promise.all([
    seedProjectWithMembers({
      workspaceId,
      ownerId,
      teamId,
    }),
    seedProjectWithMembers({
      workspaceId,
      ownerId,
      teamId,
    }),
  ]);

  return projects;
}
