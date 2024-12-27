import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: string
  createdAt: Date
  user: {
    id: string
    name: string
    image?: string | null
  }
  task: {
    id: string
    title: string
  }
  metadata?: {
    previousValue?: any
    newValue?: any
    commentId?: string
    attachmentId?: string
    dependencyId?: string
    customFieldId?: string
    workflowId?: string
    automationId?: string
    description?: string
  }
}

interface ActivityStats {
  totalCount: number
  byType: Record<string, number>
  byDate: Record<string, number>
}

interface ActivityFeedProps {
  activities: Activity[]
  stats?: ActivityStats
  filter?: string
  onFilterChange?: (filter: string) => void
}

export function ActivityFeed({
  activities,
  stats,
  filter,
  onFilterChange,
}: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <Icons.plus className="h-4 w-4" />
      case "task_updated":
        return <Icons.edit className="h-4 w-4" />
      case "task_deleted":
        return <Icons.trash className="h-4 w-4" />
      case "status_changed":
        return <Icons.refresh className="h-4 w-4" />
      case "priority_changed":
        return <Icons.flag className="h-4 w-4" />
      case "assignee_changed":
        return <Icons.user className="h-4 w-4" />
      case "due_date_changed":
        return <Icons.calendar className="h-4 w-4" />
      case "progress_updated":
        return <Icons.barChart className="h-4 w-4" />
      case "comment_created":
        return <Icons.messageSquare className="h-4 w-4" />
      case "comment_edited":
        return <Icons.edit2 className="h-4 w-4" />
      case "comment_deleted":
        return <Icons.trash2 className="h-4 w-4" />
      case "attachment_added":
        return <Icons.paperclip className="h-4 w-4" />
      case "attachment_removed":
        return <Icons.xCircle className="h-4 w-4" />
      case "dependency_added":
        return <Icons.link className="h-4 w-4" />
      case "dependency_removed":
        return <Icons.unlink className="h-4 w-4" />
      default:
        return <Icons.activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_created":
        return "text-green-500"
      case "task_deleted":
        return "text-red-500"
      case "priority_changed":
        return "text-orange-500"
      case "status_changed":
        return "text-blue-500"
      case "comment_created":
      case "comment_edited":
        return "text-purple-500"
      case "attachment_added":
      case "attachment_removed":
        return "text-cyan-500"
      default:
        return "text-gray-500"
    }
  }

  const formatActivityMessage = (activity: Activity) => {
    const metadata = activity.metadata || {}
    const userName = activity.user.name
    const taskTitle = activity.task.title

    switch (activity.type) {
      case "task_created":
        return `created task "${taskTitle}"`

      case "task_updated":
        return `updated task "${taskTitle}"`

      case "task_deleted":
        return `deleted task "${taskTitle}"`

      case "status_changed":
        return `changed status of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

      case "priority_changed":
        return `changed priority of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

      case "assignee_changed":
        return `changed assignee of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

      case "due_date_changed":
        return `changed due date of "${taskTitle}" from ${metadata.previousValue} to ${metadata.newValue}`

      case "progress_updated":
        return `updated progress of "${taskTitle}" to ${metadata.newValue}%`

      case "comment_created":
        return `commented on "${taskTitle}"`

      case "comment_edited":
        return `edited a comment on "${taskTitle}"`

      case "comment_deleted":
        return `deleted a comment from "${taskTitle}"`

      case "attachment_added":
        return `added an attachment to "${taskTitle}"`

      case "attachment_removed":
        return `removed an attachment from "${taskTitle}"`

      default:
        return `performed an action on "${taskTitle}"`
    }
  }

  const filteredActivities = useMemo(() => {
    if (!filter || filter === "all") return activities

    return activities.filter((activity) => activity.type === filter)
  }, [activities, filter])

  const activityTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.type))
    return Array.from(types)
  }, [activities])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
        {onFilterChange && (
          <Select
            value={filter}
            onValueChange={onFilterChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.split("_").join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {stats && (
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium">Total Activities</h4>
              <p className="text-2xl font-bold">{stats.totalCount}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Most Common Type</h4>
              <p className="text-2xl font-bold">
                {Object.entries(stats.byType).reduce((a, b) =>
                  a[1] > b[1] ? a : b
                )[0]}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Today's Activities</h4>
              <p className="text-2xl font-bold">
                {
                  stats.byDate[
                    new Date().toISOString().split("T")[0]
                  ] || 0
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="relative">
        <div className="absolute left-6 top-0 h-full w-px bg-border" />
        <AnimatePresence>
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mb-4 flex items-start space-x-4"
            >
              <div
                className={cn(
                  "relative z-10 rounded-full border bg-background p-2",
                  getActivityColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.image || ""} />
                    <AvatarFallback>
                      {activity.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {activity.user.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatActivityMessage(activity)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
