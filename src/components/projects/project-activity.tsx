"use client"

import * as React from "react"
import { Activity, Project, User } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ExtendedActivity extends Activity {
  user: {
    name: string | null
    email: string
    image: string | null
  }
}

interface ProjectActivityProps {
  project: Project & {
    activities: ExtendedActivity[]
  }
}

function getActivityMessage(activity: ExtendedActivity) {
  const data = activity.data as any
  switch (activity.type) {
    case "member_added":
      return (
        <span>
          added <strong>{data.memberName}</strong> to the project
        </span>
      )
    case "member_removed":
      return (
        <span>
          removed <strong>{data.memberName}</strong> from the project
        </span>
      )
    case "task_created":
      return (
        <span>
          created task <strong>{data.taskTitle}</strong>
        </span>
      )
    case "task_completed":
      return (
        <span>
          completed task <strong>{data.taskTitle}</strong>
        </span>
      )
    case "task_assigned":
      return (
        <span>
          assigned task <strong>{data.taskTitle}</strong> to{" "}
          <strong>{data.assigneeName}</strong>
        </span>
      )
    case "project_updated":
      return (
        <span>
          updated project {data.field && <strong>{data.field}</strong>}
        </span>
      )
    default:
      return <span>{activity.type}</span>
  }
}

export function ProjectActivity({ project }: ProjectActivityProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  async function refreshActivities() {
    setIsLoading(true)
    router.refresh()
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Activity</h3>
          <p className="text-sm text-muted-foreground">
            Recent activity in this project
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshActivities}
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
      <div className="space-y-4">
        {project.activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 rounded-lg border p-4"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.image || undefined} />
              <AvatarFallback>
                {activity.user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{" "}
                {getActivityMessage(activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
        {project.activities.length === 0 && (
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No activity found
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
