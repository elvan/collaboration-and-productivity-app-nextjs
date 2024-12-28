'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { useTeamUpdates } from '@/lib/realtime/team-updates';
import { ActivityType } from '@/lib/activity-logger';
import { ActivityFilters } from './activity-filters';

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
  users: Array<{ id: string; name: string }>;
}

export function ActivityFeed({
  teamId,
  workspaceId,
  initialActivities,
  users,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>(initialActivities);

  // Subscribe to real-time updates if teamId is provided
  useTeamUpdates(teamId || '', (update) => {
    if (update.type === 'activity-logged') {
      const newActivity = update.data;
      setActivities((prev) => [newActivity, ...prev]);
    }
  });

  const handleFiltersChange = (filters: any) => {
    let filtered = [...activities];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((activity) =>
        activity.metadata.description?.toLowerCase().includes(searchLower) ||
        activity.user.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }

    // Apply user filter
    if (filters.userId) {
      filtered = filtered.filter((activity) => activity.user.id === filters.userId);
    }

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.createdAt);
        if (filters.dateRange.from && activityDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && activityDate > filters.dateRange.to) {
          return false;
        }
        return true;
      });
    }

    setFilteredActivities(filtered);
  };

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
    <div className="space-y-4">
      <ActivityFilters users={users} onFiltersChange={handleFiltersChange} />
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activity.user.image} alt={activity.user.name} />
                  <AvatarFallback>
                    {activity.user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    {getActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-gray-500">
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
    </div>
  );
}
