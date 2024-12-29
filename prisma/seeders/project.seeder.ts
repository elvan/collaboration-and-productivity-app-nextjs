import { PrismaClient, ProjectStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

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
      teamId,
      ownerId,
      status: faker.helpers.arrayElement(Object.values(ProjectStatus)),
    },
  });

  // Create task statuses
  const taskStatuses = await Promise.all([
    prisma.taskStatus.create({
      data: {
        name: 'To Do',
        color: '#E2E8F0',
        description: 'Tasks that need to be started',
        order: 1,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'In Progress',
        color: '#3B82F6',
        description: 'Tasks currently being worked on',
        order: 2,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'Review',
        color: '#A855F7',
        description: 'Tasks ready for review',
        order: 3,
        projectId: project.id,
      },
    }),
    prisma.taskStatus.create({
      data: {
        name: 'Done',
        color: '#22C55E',
        description: 'Completed tasks',
        order: 4,
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
        order: 1,
        projectId: project.id,
      },
    }),
    prisma.taskPriority.create({
      data: {
        name: 'Medium',
        color: '#F59E0B',
        description: 'Normal priority tasks',
        order: 2,
        projectId: project.id,
      },
    }),
    prisma.taskPriority.create({
      data: {
        name: 'High',
        color: '#EF4444',
        description: 'Urgent tasks',
        order: 3,
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
        projectId: project.id,
      },
    }),
    prisma.customField.create({
      data: {
        name: 'Target Release',
        type: 'TEXT',
        description: 'Target release version',
        required: false,
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

  // Create workflow automation
  await prisma.workflowAutomation.create({
    data: {
      name: 'Auto-assign Code Review',
      description: 'Automatically assign code review tasks to team leads',
      projectId: project.id,
      trigger: 'task.status.changed',
      conditions: {
        newStatus: 'Review',
        type: 'Feature',
      },
      actions: {
        assignRole: 'team_lead',
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
  const { project } = projectData;

  // Create some project members
  const memberRoles = ['admin', 'member', 'member', 'member'];
  const members = await Promise.all(
    memberRoles.map((role) =>
      prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: faker.string.uuid(), // Assuming we have users
          role,
        },
      })
    )
  );

  // Create some pending invitations
  const invitations = await Promise.all(
    Array(2)
      .fill(0)
      .map(() =>
        prisma.projectInvitation.create({
          data: {
            projectId: project.id,
            invitedById: options.ownerId,
            invitedUserId: faker.string.uuid(), // Assuming we have users
            status: 'pending',
          },
        })
      )
  );

  return {
    ...projectData,
    members,
    invitations,
  };
}

export async function seedDemoProjects(workspaceId: string, ownerId: string) {
  // Create a software development project
  const softwareProject = await seedProjectWithMembers({
    workspaceId,
    ownerId,
    teamId: faker.string.uuid(), // Assuming we have teams
  });

  // Create a marketing campaign project
  const marketingProject = await seedProjectWithMembers({
    workspaceId,
    ownerId,
  });

  // Create an archived project
  const archivedProject = await createProject({
    workspaceId,
    ownerId,
  });
  await prisma.project.update({
    where: { id: archivedProject.project.id },
    data: { status: 'ARCHIVED' },
  });

  return {
    softwareProject,
    marketingProject,
    archivedProject,
  };
}
