import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: string;
  userId: string;
  metadata: any;
  createdAt: Date;
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

interface ActivityLogProps {
  activities: Activity[];
}

function getActivityMessage(activity: Activity) {
  const { type, metadata, user } = activity;
  const userName = user?.name || "A user";

  switch (type) {
    case "task_created":
      return `${userName} created task "${metadata.taskTitle}"`;
    case "task_updated":
      return `${userName} updated task "${metadata.taskTitle}"`;
    case "task_deleted":
      return `${userName} deleted task "${metadata.taskTitle}"`;
    case "task_assigned":
      return `${userName} assigned task "${metadata.taskTitle}" to ${metadata.assigneeName}`;
    case "comment_added":
      return `${userName} commented on task "${metadata.taskTitle}"`;
    case "task_completed":
      return `${userName} completed task "${metadata.taskTitle}"`;
    default:
      return `${userName} performed an action`;
  }
}

function getActivityIcon(type: string) {
  // You can customize this based on your activity types
  return null;
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user?.image || ""} />
              <AvatarFallback>
                {activity.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {getActivityMessage(activity)}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(activity.createdAt), "PPp")}
              </p>
            </div>
            {getActivityIcon(activity.type)}
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No activity to show
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
