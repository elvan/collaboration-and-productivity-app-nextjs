"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Bell, Clock, Target, Zap } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  getNotificationStats,
  getNotificationTrends,
  getPopularNotifications,
} from "@/lib/notification-analytics"

export default function NotificationAnalytics() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [period, setPeriod] = React.useState("daily")
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<any[]>([])
  const [trends, setTrends] = React.useState<any>(null)
  const [popular, setPopular] = React.useState<any[]>([])

  // Load data
  React.useEffect(() => {
    if (session?.user?.id) {
      loadData()
    }
  }, [session?.user?.id, period])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, trendsData, popularData] = await Promise.all([
        getNotificationStats(session!.user!.id, period as any),
        getNotificationTrends(session!.user!.id),
        getPopularNotifications(session!.user!.id),
      ])

      setStats(statsData)
      setTrends(trendsData)
      setPopular(popularData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your notification engagement
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trends?.eventCounts.find((c: any) => c.event === "sent")?._count.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trends?.engagementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Read rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Click Rate
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trends?.clickThroughRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Of read notifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Peak Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trends?.hourlyDistribution?.[0]?.hour}:00
              </div>
              <p className="text-xs text-muted-foreground">
                Most active hour
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Volume</CardTitle>
                <Select
                  value={period}
                  onValueChange={setPeriod}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      format(new Date(value), "MMM d, yyyy")
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Channel Distribution</CardTitle>
              <CardDescription>
                Notifications by channel
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends?.channelDistribution}>
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="_count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Popular Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Most Engaged Notifications</CardTitle>
            <CardDescription>
              Top notifications by engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {popular.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {notification._count.analytics} engagements
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
