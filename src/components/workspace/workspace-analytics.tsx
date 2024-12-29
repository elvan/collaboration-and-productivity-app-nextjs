"use client"

import { WorkspaceAnalytics } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"

interface WorkspaceAnalyticsProps {
  analytics: WorkspaceAnalytics | null
}

export function WorkspaceAnalyticsComponent({
  analytics,
}: WorkspaceAnalyticsProps) {
  if (!analytics) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.memberCount} total members
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.taskCount}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.completedTasks} completed
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.documentCount}</div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(analytics.storageUsed)} used
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.projectCount}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.commentCount} comments
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
