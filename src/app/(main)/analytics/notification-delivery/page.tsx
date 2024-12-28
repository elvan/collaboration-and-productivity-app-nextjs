"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format, subDays } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDeliveryAnalytics, getDeliveryTimeline } from "@/lib/notification-delivery"

const timeRanges = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Custom", value: "custom" },
]

const intervals = [
  { label: "Hourly", value: "hour" },
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
]

export default function NotificationDeliveryAnalytics() {
  const { data: session } = useSession()
  const [timeRange, setTimeRange] = React.useState("7d")
  const [interval, setInterval] = React.useState("day")
  const [dateRange, setDateRange] = React.useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [analytics, setAnalytics] = React.useState<any>(null)
  const [timeline, setTimeline] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchAnalytics = React.useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const [analyticsData, timelineData] = await Promise.all([
        getDeliveryAnalytics(
          session.user.id,
          dateRange.from,
          dateRange.to
        ),
        getDeliveryTimeline(
          session.user.id,
          dateRange.from,
          dateRange.to,
          interval as any
        ),
      ])

      setAnalytics(analyticsData)
      setTimeline(timelineData)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, dateRange, interval])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    if (value !== "custom") {
      const to = new Date()
      const from = new Date()
      switch (value) {
        case "24h":
          from.setHours(from.getHours() - 24)
          setInterval("hour")
          break
        case "7d":
          from.setDate(from.getDate() - 7)
          setInterval("day")
          break
        case "30d":
          from.setDate(from.getDate() - 30)
          setInterval("day")
          break
      }
      setDateRange({ from, to })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification Delivery Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze notification delivery performance across channels
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {timeRange === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: any) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((int) => (
                  <SelectItem key={int.value} value={int.value}>
                    {int.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  ((analytics?.byStatus?.delivered || 0) / analytics?.total) *
                  100
                ).toFixed(1)}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Click Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  ((analytics?.byStatus?.clicked || 0) / analytics?.total) *
                  100
                ).toFixed(1)}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Average Delivery Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  Object.values(analytics?.averageDeliveryTimes || {}).reduce(
                    (acc: number, val: any) => acc + val.avg_delivery_time,
                    0
                  ) / Object.keys(analytics?.averageDeliveryTimes || {}).length ||
                  0
                ).toFixed(1)}
                s
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Delivery by Channel</CardTitle>
              <CardDescription>
                Distribution of notifications across different channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics?.byChannel || {})}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="0"
                      label={{
                        value: "Channel",
                        position: "insideBottom",
                        offset: -10,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="1" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
              <CardDescription>
                Notification delivery trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time_period"
                      label={{
                        value: "Time",
                        position: "insideBottom",
                        offset: -10,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    {["app", "email", "push"].map((channel, index) => (
                      <Line
                        key={channel}
                        type="monotone"
                        dataKey={`${channel}_count`}
                        name={channel}
                        stroke={["#8884d8", "#82ca9d", "#ffc658"][index]}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                Success and failure rates by channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics?.byChannel || {}).map(
                  ([channel, count]) => (
                    <div key={channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {channel}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {((count as number) / (analytics?.total || 1)) * 100}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              ((count as number) / (analytics?.total || 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>
                Breakdown of notification statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics?.byStatus || {}).map(
                  ([status, count]) => (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {((count as number) / (analytics?.total || 1)) * 100}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              ((count as number) / (analytics?.total || 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
