import { useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentList } from "./comment-list"
import { ActivityFeed } from "./activity-feed"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  startDate?: Date
  endDate?: Date
  progress: number
  assignee?: {
    id: string
    name: string
    image?: string | null
  }
}

interface TaskDetailsProps {
  task: Task
  comments: any[]
  activities: any[]
  activityStats?: any
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onEditComment: (id: string, content: string) => Promise<void>
  onDeleteComment: (id: string) => Promise<void>
  onAddReaction: (id: string, emoji: string) => Promise<void>
  onRemoveReaction: (id: string, emoji: string) => Promise<void>
}

export function TaskDetails({
  task,
  comments,
  activities,
  activityStats,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  onRemoveReaction,
}: TaskDetailsProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("comments")
  const [activityFilter, setActivityFilter] = useState("all")

  return (
    <Card className="p-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="comments" className="space-x-2">
              <Icons.messageSquare className="h-4 w-4" />
              <span>Comments</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="space-x-2">
              <Icons.activity className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="comments" className="space-y-4">
          <CommentList
            comments={comments}
            taskId={task.id}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed
            activities={activities}
            stats={activityStats}
            filter={activityFilter}
            onFilterChange={setActivityFilter}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
