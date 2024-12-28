'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useTeamUpdates } from '@/lib/realtime/team-updates';
import { ActivityType } from '@/lib/activity-logger';

interface Activity {
  id: string;
  type: ActivityType;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  metadata: Record<string, any>;
  createdAt: string;
}

interface ActivityFeedProps {
  teamId?: string;
  workspaceId?: string;
  initialActivities: Activity[];
}

export function ActivityFeed({
  teamId,
  workspaceId,
  initialActivities,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  // Subscribe to real-time updates if teamId is provided
  useTeamUpdates(teamId || '', (update) => {
    if (update.type === 'activity-logged') {
      setActivities((prev) => [update.data, ...prev]);
    }
  });

  const getActivityMessage = (activity: Activity) => {
    const { type, metadata, user } = activity;

    switch (type) {
      case 'member_invited':
        return `invited ${metadata.invitedEmail} to join the team`;
      case 'member_joined':
        return 'joined the team';
      case 'member_left':
        return 'left the team';
      case 'role_updated':
        return `updated ${metadata.targetUser}'s role to ${metadata.newRole}`;
      case 'settings_updated':
        return 'updated team settings';
      case 'workspace_created':
        return 'created a new workspace';
      case 'workspace_archived':
        return 'archived the workspace';
      case 'team_created':
        return 'created a new team';
      case 'team_archived':
        return 'archived the team';
      default:
        return 'performed an action';
    }
  };

  return (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Activity Feed</h3>
      <ScrollArea className='h-[400px]'>
        <div className='space-y-4'>
          {activities.map((activity) => (
            <div key={activity.id} className='flex items-start gap-4'>
              <Avatar className='w-8 h-8'>
                <AvatarImage
                  src={activity.user.image}
                  alt={activity.user.name}
                />
                <AvatarFallback>
                  {activity.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-1'>
                <p className='text-sm'>
                  <span className='font-medium'>{activity.user.name}</span>{' '}
                  {getActivityMessage(activity)}
                </p>
                <p className='text-xs text-gray-500'>
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
