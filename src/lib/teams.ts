import { prisma } from "./prisma"
import { logActivity } from "./activity"

export interface TeamCreateInput {
  name: string
  description?: string
  workspaceId: string
  userId: string
  members?: Array<{
    userId: string
    role: "admin" | "member"
  }>
}

export interface TeamUpdateInput {
  name?: string
  description?: string
  members?: Array<{
    userId: string
    role: "admin" | "member"
  }>
}

export interface TeamMemberInput {
  userId: string
  role: "admin" | "member"
}

export async function createTeam(data: TeamCreateInput) {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description,
      workspaceId: data.workspaceId,
      createdById: data.userId,
      members: {
        create: [
          { userId: data.userId, role: "admin" as const },
          ...(data.members || []).map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
        ],
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "team.created",
    action: "created",
    entityType: "team",
    entityId: team.id,
    metadata: {
      teamName: team.name,
      memberCount: team.members.length,
    },
    userId: data.userId,
    workspaceId: data.workspaceId,
  })

  return team
}

export async function updateTeam(
  id: string,
  data: TeamUpdateInput,
  userId: string
) {
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      lastUpdatedById: userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (data.members) {
    // Update team members
    await prisma.teamMember.deleteMany({
      where: { teamId: id },
    })

    await prisma.teamMember.createMany({
      data: data.members.map((member) => ({
        teamId: id,
        userId: member.userId,
        role: member.role,
      })),
    })
  }

  // Log activity
  await logActivity({
    type: "team.updated",
    action: "updated",
    entityType: "team",
    entityId: team.id,
    metadata: {
      teamName: team.name,
      changes: data,
    },
    userId,
    workspaceId: team.workspaceId,
  })

  return team
}

export async function deleteTeam(id: string, userId: string) {
  const team = await prisma.team.delete({
    where: { id },
    include: {
      members: true,
    },
  })

  // Log activity
  await logActivity({
    type: "team.deleted",
    action: "deleted",
    entityType: "team",
    entityId: team.id,
    metadata: {
      teamName: team.name,
      memberCount: team.members.length,
    },
    userId,
    workspaceId: team.workspaceId,
  })

  return team
}

export async function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })
}

export async function getTeams(workspaceId: string, options?: {
  search?: string
  userId?: string
  role?: "admin" | "member"
}) {
  const where = {
    workspaceId,
    ...(options?.search && {
      OR: [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ],
    }),
    ...(options?.userId && {
      members: {
        some: {
          userId: options.userId,
          ...(options?.role && { role: options.role }),
        },
      },
    }),
  }

  const [total, teams] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return {
    total,
    teams,
  }
}

export async function addTeamMember(
  teamId: string,
  member: TeamMemberInput,
  addedById: string
) {
  const teamMember = await prisma.teamMember.create({
    data: {
      teamId,
      userId: member.userId,
      role: member.role,
    },
    include: {
      team: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "team.member_added",
    action: "added",
    entityType: "team",
    entityId: teamId,
    metadata: {
      teamName: teamMember.team.name,
      memberName: teamMember.user.name,
      memberRole: member.role,
    },
    userId: addedById,
    workspaceId: teamMember.team.workspaceId,
  })

  return teamMember
}

export async function updateTeamMember(
  teamId: string,
  userId: string,
  role: "admin" | "member",
  updatedById: string
) {
  const teamMember = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    data: { role },
    include: {
      team: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "team.member_updated",
    action: "updated",
    entityType: "team",
    entityId: teamId,
    metadata: {
      teamName: teamMember.team.name,
      memberName: teamMember.user.name,
      memberRole: role,
    },
    userId: updatedById,
    workspaceId: teamMember.team.workspaceId,
  })

  return teamMember
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
  removedById: string
) {
  const teamMember = await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    include: {
      team: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Log activity
  await logActivity({
    type: "team.member_removed",
    action: "removed",
    entityType: "team",
    entityId: teamId,
    metadata: {
      teamName: teamMember.team.name,
      memberName: teamMember.user.name,
    },
    userId: removedById,
    workspaceId: teamMember.team.workspaceId,
  })

  return teamMember
}

export async function getTeamMembers(teamId: string) {
  return prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

export async function isTeamMember(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  })

  return !!member
}

export async function isTeamAdmin(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
      role: "admin",
    },
  })

  return !!member
}
