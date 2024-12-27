"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TemplatePerformance {
  id: string
  templateId: string
  period: string
  startDate: string
  endDate: string
  sentCount: number
  deliveredCount: number
  readCount: number
  clickCount: number
  conversionCount: number
  deliveryRate: number
  readRate: number
  clickRate: number
  conversionRate: number
  averageReadTime: number | null
  template?: {
    name: string
    type: string
  }
}

interface TemplateTrend {
  change: number
  trend: "up" | "down" | "stable"
}

interface TemplateInsights {
  performance: {
    daily: TemplatePerformance
    weekly: TemplatePerformance
    monthly: TemplatePerformance
  }
  trends: {
    daily: Record<string, TemplateTrend>
    weekly: Record<string, TemplateTrend>
    monthly: Record<string, TemplateTrend>
  }
  history: {
    daily: TemplatePerformance[]
    weekly: TemplatePerformance[]
    monthly: TemplatePerformance[]
  }
}

export default function TemplateAnalytics() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>()
  const [period, setPeriod] = React.useState("daily")
  const [insights, setInsights] = React.useState<TemplateInsights>()
  const [topTemplates, setTopTemplates] = React.useState<TemplatePerformance[]>([])
  const [templates, setTemplates] = React.useState<
    Array<{ id: string; name: string }>
  >([])

  // Load templates
  React.useEffect(() => {
    if (session?.user?.id) {
      loadTemplates()
    }
  }, [session?.user?.id])

  // Load insights when template or period changes
  React.useEffect(() => {
    if (selectedTemplate) {
      loadInsights(selectedTemplate)
    }
  }, [selectedTemplate, period])

  // Load top templates
  React.useEffect(() => {
    if (session?.user?.id) {
      loadTopTemplates()
    }
  }, [session?.user?.id, period])

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/notifications/templates")
      if (!res.ok) {
        throw new Error("Failed to load templates")
      }
      const data = await res.json()
      setTemplates(data)
      if (data.length > 0) {
        setSelectedTemplate(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    }
  }

  const loadInsights = async (templateId: string) => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/notifications/templates/analytics?templateId=${templateId}&type=insights`
      )
      if (!res.ok) {
        throw new Error("Failed to load insights")
      }
      const data = await res.json()
      setInsights(data)
    } catch (error) {
      console.error("Failed to load insights:", error)
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTopTemplates = async () => {
    try {
      const res = await fetch(
        `/api/notifications/templates/analytics?type=top&period=${period}`
      )
      if (!res.ok) {
        throw new Error("Failed to load top templates")
      }
      const data = await res.json()
      setTopTemplates(data)
    } catch (error) {
      console.error("Failed to load top templates:", error)
      toast({
        title: "Error",
        description: "Failed to load top templates",
        variant: "destructive",
      })
    }
  }

  const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${(seconds / 60).toFixed(1)}m`
  }

  const renderTrendIcon = (trend: TemplateTrend) => {
    if (trend.trend === "up")
      return <ArrowUp className="text-green-500 h-4 w-4" />
    if (trend.trend === "down")
      return <ArrowDown className="text-red-500 h-4 w-4" />
    return <Minus className="text-gray-500 h-4 w-4" />
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Template Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze template performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {templates.length > 0 && (
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {insights && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Delivery Rate
                </CardTitle>
                {renderTrendIcon(insights.trends[period].deliveryRate)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRate(insights.performance[period].deliveryRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insights.trends[period].deliveryRate.change > 0 ? "+" : ""}
                  {formatRate(insights.trends[period].deliveryRate.change)}{" "}
                  from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Read Rate
                </CardTitle>
                {renderTrendIcon(insights.trends[period].readRate)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRate(insights.performance[period].readRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insights.trends[period].readRate.change > 0 ? "+" : ""}
                  {formatRate(insights.trends[period].readRate.change)}{" "}
                  from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Click Rate
                </CardTitle>
                {renderTrendIcon(insights.trends[period].clickRate)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRate(insights.performance[period].clickRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insights.trends[period].clickRate.change > 0 ? "+" : ""}
                  {formatRate(insights.trends[period].clickRate.change)}{" "}
                  from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                {renderTrendIcon(insights.trends[period].conversionRate)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRate(insights.performance[period].conversionRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insights.trends[period].conversionRate.change > 0 ? "+" : ""}
                  {formatRate(insights.trends[period].conversionRate.change)}{" "}
                  from last period
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="top">Top Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            {insights && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rates Over Time</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={insights.history[period]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="startDate"
                          tickFormatter={(date) =>
                            format(new Date(date), "MMM d")
                          }
                        />
                        <YAxis tickFormatter={(value) => `${value * 100}%`} />
                        <Tooltip
                          formatter={(value: number) => formatRate(value)}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="deliveryRate"
                          name="Delivery Rate"
                          stroke="#8884d8"
                        />
                        <Line
                          type="monotone"
                          dataKey="readRate"
                          name="Read Rate"
                          stroke="#82ca9d"
                        />
                        <Line
                          type="monotone"
                          dataKey="clickRate"
                          name="Click Rate"
                          stroke="#ffc658"
                        />
                        <Line
                          type="monotone"
                          dataKey="conversionRate"
                          name="Conversion Rate"
                          stroke="#ff7300"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Counts</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={insights.history[period]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="startDate"
                          tickFormatter={(date) =>
                            format(new Date(date), "MMM d")
                          }
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="sentCount"
                          name="Sent"
                          fill="#8884d8"
                        />
                        <Bar
                          dataKey="deliveredCount"
                          name="Delivered"
                          fill="#82ca9d"
                        />
                        <Bar
                          dataKey="readCount"
                          name="Read"
                          fill="#ffc658"
                        />
                        <Bar
                          dataKey="clickCount"
                          name="Clicked"
                          fill="#ff7300"
                        />
                        <Bar
                          dataKey="conversionCount"
                          name="Converted"
                          fill="#a4de6c"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="top">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {topTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {template.template?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {template.template?.type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium">
                            {formatRate(template.conversionRate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Conversion Rate
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium">
                            {formatRate(template.clickRate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click Rate
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium">
                            {template.sentCount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
