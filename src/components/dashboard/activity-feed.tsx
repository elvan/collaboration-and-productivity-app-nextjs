import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.user?.image || ""} alt={activity.user?.name || ""} />
                <AvatarFallback>
                  {activity.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">
                  {activity.user?.name}
                  <span className="text-muted-foreground"> {activity.action}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.details}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
