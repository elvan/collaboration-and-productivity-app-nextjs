"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  Clock,
  MousePointerClick,
  Eye,
  XCircle,
  BarChart,
} from "lucide-react"
import { getNotificationMetrics } from "@/lib/analytics"

interface AnalyticsDashboardProps {
  metrics: {
    totalNotifications: number
    readRate: number
    clickRate: number
    dismissRate: number
    avgResponseTime: number
  }
  userId: string
}

export function AnalyticsDashboard({
  metrics: initialMetrics,
  userId,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = React.useState("30")
  const [metrics, setMetrics] = React.useState(initialMetrics)
  const [isLoading, setIsLoading] = React.useState(false)

  async function updateMetrics(days: string) {
    setIsLoading(true)
    try {
      const data = await getNotificationMetrics(userId, parseInt(days))
      // Process metrics data...
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onValueChange={(value) => {
            setTimeRange(value)
            updateMetrics(value)
          }}
        >
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalNotifications}
            </div>
            <p className="text-xs text-muted-foreground">
              Notifications sent in the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.readRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of notifications were read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.clickRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of notifications were clicked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dismiss Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.dismissRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of notifications were dismissed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgResponseTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to read notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Score
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                ((metrics.readRate + metrics.clickRate) / 2 -
                  metrics.dismissRate / 2) /
                100
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall engagement score (0-1)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
