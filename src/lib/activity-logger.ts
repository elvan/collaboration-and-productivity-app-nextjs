import { prisma } from './prisma';
import { emitTeamUpdate } from './realtime/team-updates';

export type ActivityType =
  | 'member_invited'
  | 'member_joined'
  | 'member_left'
  | 'role_updated'
  | 'settings_updated'
  | 'workspace_created'
  | 'workspace_archived'
  | 'team_created'
  | 'team_archived';

interface ActivityLogParams {
  type: ActivityType;
  userId: string;
  teamId?: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
}

export async function logActivity({
  type,
  userId,
  teamId,
  workspaceId,
  metadata,
}: ActivityLogParams) {
  try {
    const activity = await prisma.activity.create({
      data: {
        type,
        userId,
        teamId,
        workspaceId,
        metadata: metadata || {},
      },
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
    });

    // Emit real-time update if it's a team activity
    if (teamId) {
      emitTeamUpdate(teamId, 'activity-logged', activity);
    }

    return activity;
  } catch (error) {
    console.error('[ACTIVITY_LOG_ERROR]', error);
    throw error;
  }
}

export async function getTeamActivities(teamId: string, limit = 50) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        teamId,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities;
  } catch (error) {
    console.error('[GET_TEAM_ACTIVITIES_ERROR]', error);
    throw error;
  }
}

export async function getWorkspaceActivities(workspaceId: string, limit = 50) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        workspaceId,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities;
  } catch (error) {
    console.error('[GET_WORKSPACE_ACTIVITIES_ERROR]', error);
    throw error;
  }
}
