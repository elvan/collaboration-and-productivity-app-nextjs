import { prisma } from '@/lib/prisma';
import { emitTeamUpdate } from '../realtime/team-updates';

export type NotificationType =
  | 'team_invitation'
  | 'team_update'
  | 'member_joined'
  | 'member_left'
  | 'role_updated'
  | 'mention'
  | 'task_assigned'
  | 'task_completed'
  | 'comment_added';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  teamId?: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  teamId,
  workspaceId,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        teamId,
        workspaceId,
        metadata: metadata || {},
        read: false,
      },
    });

    // Emit real-time update if it's a team notification
    if (teamId) {
      emitTeamUpdate(teamId, 'notification-created', notification);
    }

    return notification;
  } catch (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);
    throw error;
  }
}

export async function getUserNotifications(userId: string, options?: {
  unreadOnly?: boolean;
  limit?: number;
  before?: Date;
}) {
  try {
    const where: any = { userId };

    if (options?.unreadOnly) {
      where.read = false;
    }

    if (options?.before) {
      where.createdAt = {
        lt: options.before,
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 50,
    });

    return notifications;
  } catch (error) {
    console.error('[GET_USER_NOTIFICATIONS_ERROR]', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return notification;
  } catch (error) {
    console.error('[MARK_NOTIFICATION_READ_ERROR]', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[MARK_ALL_NOTIFICATIONS_READ_ERROR]', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
  } catch (error) {
    console.error('[DELETE_NOTIFICATION_ERROR]', error);
    throw error;
  }
}

export async function deleteAllNotifications(userId: string) {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  } catch (error) {
    console.error('[DELETE_ALL_NOTIFICATIONS_ERROR]', error);
    throw error;
  }
}

export function getNotificationMessage(type: NotificationType, metadata?: Record<string, any>): string {
  switch (type) {
    case 'team_invitation':
      return `You've been invited to join ${metadata?.teamName}`;
    case 'team_update':
      return `Team ${metadata?.teamName} has been updated`;
    case 'member_joined':
      return `${metadata?.userName} joined the team`;
    case 'member_left':
      return `${metadata?.userName} left the team`;
    case 'role_updated':
      return `Your role has been updated to ${metadata?.newRole}`;
    case 'mention':
      return `${metadata?.userName} mentioned you in ${metadata?.context}`;
    case 'task_assigned':
      return `You've been assigned to "${metadata?.taskName}"`;
    case 'task_completed':
      return `Task "${metadata?.taskName}" has been completed`;
    case 'comment_added':
      return `${metadata?.userName} commented on ${metadata?.context}`;
    default:
      return 'New notification';
  }
}
