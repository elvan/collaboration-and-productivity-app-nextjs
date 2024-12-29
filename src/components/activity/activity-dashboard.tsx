"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, User } from "@prisma/client"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity as ActivityIcon,
  BarChart2,
  Calendar,
  Clock,
  User as UserIcon,
} from "lucide-react"

interface ActivityWithUser extends Activity {
  user: Pick<User, "id" | "name" | "email" | "image">
}

interface ActivityStats {
  activityByType: {
    type: string
    entityType: string
    _count: number
  }[]
  dailyActivity: {
    createdAt: string
    _count: number
  }[]
  topUsers: {
    userId: string
    _count: number
    user?: Pick<User, "id" | "name" | "email" | "image">
  }[]
}

interface ActivityDashboardProps {
  workspaceId: string
  initialActivities: ActivityWithUser[]
  initialStats: ActivityStats
}

export function ActivityDashboard({
  workspaceId,
  initialActivities,
  initialStats,
}: ActivityDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState("30")
  const [activities, setActivities] = useState(initialActivities)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/activity/stats?days=${timeRange}`
      )
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch activity stats",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function formatActivityType(type: string) {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case "create":
        return <ActivityIcon className="h-4 w-4" />
      case "update":
        return <Clock className="h-4 w-4" />
      case "delete":
        return <X className="h-4 w-4" />
      default:
        return <ActivityIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Activity Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activityByType.reduce((acc, curr) => acc + curr._count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                stats.dailyActivity.reduce((acc, curr) => acc + curr._count, 0) /
                  stats.dailyActivity.length
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeRange} days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="createdAt"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="_count"
                    stroke="#8884d8"
                    name="Activities"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Activity by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="_count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest activities in the workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <Avatar>
                    <AvatarImage src={activity.user.image || ""} />
                    <AvatarFallback>
                      {activity.user.name?.[0] || activity.user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      <span className="font-semibold">{activity.user.name}</span>{" "}
                      {formatActivityType(activity.type)}{" "}
                      <span className="font-medium">{activity.entityName}</span>
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {formatActivityType(activity.entityType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {getActivityIcon(activity.type)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
