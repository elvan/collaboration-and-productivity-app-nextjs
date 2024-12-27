import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, LineChart, PieChart } from '@/components/ui/charts'
import { getTaskStats } from '@/lib/tasks/task-service'
import { getProjectTimeStats } from '@/lib/tasks/time-tracking-service'
import { getProjectActivities } from '@/lib/tasks/activity-service'
import { formatDuration, formatDate } from '@/lib/utils'

interface TaskAnalyticsDashboardProps {
  projectId: string
  startDate?: Date
  endDate?: Date
}

export function TaskAnalyticsDashboard({
  projectId,
  startDate,
  endDate,
}: TaskAnalyticsDashboardProps) {
  const [taskStats, setTaskStats] = useState<any>(null)
  const [timeStats, setTimeStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [taskStatsData, timeStatsData, activitiesData] = await Promise.all([
          getTaskStats(projectId),
          getProjectTimeStats(projectId, { startDate, endDate }),
          getProjectActivities(projectId),
        ])

        setTaskStats(taskStatsData)
        setTimeStats(timeStatsData)
        setActivities(activitiesData)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, startDate, endDate])

  if (loading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.completedTasks} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(timeStats.totalTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeStats.totalEntries} entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.overdueTasks} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={taskStats.statusDistribution}
                  index="status"
                  category="count"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={taskStats.priorityDistribution}
                  index="priority"
                  category="count"
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={taskStats.completionTrend}
                index="date"
                categories={['completed', 'created']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Time by User</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={timeStats.timeByUser}
                  index="user"
                  categories={['hours']}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Time by Task Type</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={timeStats.timeByTaskType}
                  index="type"
                  category="hours"
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Daily Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={timeStats.dailyTracking}
                index="date"
                categories={['hours']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={activities.reduce((acc, curr) => {
                    acc[curr.type] = (acc[curr.type] || 0) + 1
                    return acc
                  }, {})}
                  index="type"
                  category="count"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={activities.reduce((acc, curr) => {
                    const date = formatDate(curr.createdAt, 'yyyy-MM-dd')
                    acc[date] = (acc[date] || 0) + 1
                    return acc
                  }, {})}
                  index="date"
                  categories={['count']}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
