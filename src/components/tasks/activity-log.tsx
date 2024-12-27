import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  FileText,
  Link,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Workflow,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
  id: string
  type: string
  taskId: string
  userId: string
  metadata: any
  createdAt: Date
  user: {
    name: string
    image: string
  }
}

interface ActivityLogProps {
  taskId?: string
}

const activityIcons: Record<string, any> = {
  task_created: FileText,
  task_updated: FileText,
  comment_added: MessageSquare,
  attachment_added: Link,
  member_added: UserPlus,
  task_blocked: AlertTriangle,
  task_completed: CheckCircle2,
  due_date_changed: Clock,
  priority_increased: ArrowUpCircle,
  priority_decreased: ArrowDownCircle,
  workflow_triggered: Workflow,
}

export function ActivityLog({ taskId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (taskId) {
      loadActivities()
    }
  }, [taskId])

  async function loadActivities() {
    try {
      const response = await fetch(`/api/tasks/${taskId}/activities`)
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error("Failed to load activities:", error)
    } finally {
      setLoading(false)
    }
  }

  function getActivityMessage(activity: Activity): string {
    const metadata = activity.metadata || {}
    
    switch (activity.type) {
      case "task_created":
        return "created this task"
      case "task_updated":
        return `updated ${Object.keys(metadata.changes || {})
          .map((field) => field.replace("_", " "))
          .join(", ")}`
      case "comment_added":
        return "commented"
      case "attachment_added":
        return `added ${metadata.fileName}`
      case "member_added":
        return `added ${metadata.memberName}`
      case "task_blocked":
        return `marked this task as blocked by "${metadata.blockedBy}"`
      case "task_completed":
        return "marked this task as complete"
      case "due_date_changed":
        return `changed due date to ${new Date(
          metadata.newDate
        ).toLocaleDateString()}`
      case "priority_increased":
        return `increased priority to ${metadata.newPriority}`
      case "priority_decreased":
        return `decreased priority to ${metadata.newPriority}`
      case "workflow_triggered":
        return `triggered workflow "${metadata.workflowName}"`
      default:
        return "performed an action"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-4 p-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type] || FileText
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 text-sm"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.image} />
                <AvatarFallback>
                  {activity.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.user.name}</span>
                  <span className="text-muted-foreground">
                    {getActivityMessage(activity)}
                  </span>
                </div>
                {activity.type === "comment_added" && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    {activity.metadata.content}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <time dateTime={activity.createdAt.toISOString()}>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
