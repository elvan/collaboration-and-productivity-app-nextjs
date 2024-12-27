import { useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentList } from "./comment-list"
import { ActivityFeed } from "./activity-feed"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useTaskDetails } from "@/hooks/use-task-details"
import { Skeleton } from "@/components/ui/skeleton"

interface TaskDetailsProps {
  taskId: string
}

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("comments")
  const [activityFilter, setActivityFilter] = useState("all")

  const {
    task,
    comments,
    activities,
    activityStats,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
  } = useTaskDetails(taskId)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Icons.alertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Task not found</p>
        </div>
      </Card>
    )
  }

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
            comments={comments || []}
            taskId={taskId}
            onAddComment={createComment}
            onEditComment={updateComment}
            onDeleteComment={deleteComment}
            onAddReaction={addReaction}
            onRemoveReaction={removeReaction}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed
            activities={activities || []}
            stats={activityStats}
            filter={activityFilter}
            onFilterChange={setActivityFilter}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
