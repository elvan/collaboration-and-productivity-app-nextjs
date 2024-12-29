import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedTeamOptions {
  workspaceId: string;
  ownerId: string;
}

export async function createTeam(options: SeedTeamOptions) {
  const { workspaceId, ownerId } = options;

  // Create team with realistic data
  const team = await prisma.team.create({
    data: {
      name: faker.company.catchPhrase(),
      description: faker.company.buzzPhrase(),
      workspaceId,
      ownerId,
    },
  });

  return team;
}

export async function seedTeamWithMembers(options: SeedTeamOptions) {
  const team = await createTeam(options);

  // Create team roles
  const roles = await Promise.all([
    prisma.teamRole.create({
      data: {
        name: 'Team Lead',
        description: 'Team leadership role',
        teamId: team.id,
        permissions: ['MANAGE_TEAM', 'MANAGE_MEMBERS', 'MANAGE_PROJECTS'],
      },
    }),
    prisma.teamRole.create({
      data: {
        name: 'Senior Member',
        description: 'Experienced team member',
        teamId: team.id,
        permissions: ['MANAGE_PROJECTS', 'REVIEW_WORK'],
      },
    }),
    prisma.teamRole.create({
      data: {
        name: 'Member',
        description: 'Regular team member',
        teamId: team.id,
        permissions: ['VIEW_TEAM', 'CREATE_TASKS'],
      },
    }),
  ]);

  // Create team members with different roles
  const members = await Promise.all(
    Array(4)
      .fill(0)
      .map(async (_, index) => {
        const role = roles[index % roles.length];
        return prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: faker.string.uuid(), // Assuming we have users
            roleId: role.id,
          },
        });
      })
  );

  return {
    team,
    roles,
    members,
  };
}

export async function seedDemoTeams(workspaceId: string, ownerId: string) {
  // Create engineering team
  const engineeringTeam = await seedTeamWithMembers({
    workspaceId,
    ownerId,
  });
  await prisma.team.update({
    where: { id: engineeringTeam.team.id },
    data: {
      name: 'Engineering Team',
      description: 'Core development and engineering team',
    },
  });

  // Create design team
  const designTeam = await seedTeamWithMembers({
    workspaceId,
    ownerId,
  });
  await prisma.team.update({
    where: { id: designTeam.team.id },
    data: {
      name: 'Design Team',
      description: 'UI/UX and product design team',
    },
  });

  // Create marketing team
  const marketingTeam = await createTeam({
    workspaceId,
    ownerId,
  });
  await prisma.team.update({
    where: { id: marketingTeam.id },
    data: {
      name: 'Marketing Team',
      description: 'Marketing and growth team',
    },
  });

  return {
    engineeringTeam,
    designTeam,
    marketingTeam,
  };
}
