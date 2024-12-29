"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, subDays } from "date-fns"
import {
  Project,
  ProjectAnalytics,
  Task,
  TaskStatus,
  User,
} from "@prisma/client"
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProjectWithDetails extends Project {
  taskStatuses: TaskStatus[]
  tasks: (Task & {
    assignee: User | null
  })[]
  analytics: ProjectAnalytics
}

interface ProjectAnalyticsProps {
  project: ProjectWithDetails
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7")
  const router = useRouter()

  // Calculate task statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(
    (task) =>
      project.taskStatuses.find((status) => status.id === task.statusId)?.name ===
      "Done"
  ).length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Calculate task distribution by status
  const tasksByStatus = project.taskStatuses.map((status) => ({
    name: status.name,
    value: project.tasks.filter((task) => task.statusId === status.id).length,
    color: status.color,
  }))

  // Calculate task progress over time
  const days = parseInt(timeRange)
  const progressData = Array.from({ length: days }).map((_, index) => {
    const date = subDays(new Date(), days - 1 - index)
    const completedOnDate = project.tasks.filter(
      (task) =>
        task.completedAt &&
        format(new Date(task.completedAt), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd")
    ).length
    return {
      date: format(date, "MMM dd"),
      completed: completedOnDate,
    }
  })

  // Calculate top contributors
  const contributors = project.tasks
    .reduce((acc, task) => {
      if (task.assignee) {
        const existing = acc.find((c) => c.id === task.assignee!.id)
        if (existing) {
          existing.tasks += 1
          if (task.completedAt) existing.completed += 1
        } else {
          acc.push({
            id: task.assignee.id,
            name: task.assignee.name || "",
            image: task.assignee.image || "",
            tasks: 1,
            completed: task.completedAt ? 1 : 0,
          })
        }
      }
      return acc
    }, [] as { id: string; name: string; image: string; tasks: number; completed: number }[])
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Project Analytics</h2>
        <Select
          value={timeRange}
          onValueChange={(value) => {
            setTimeRange(value)
            router.refresh()
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              across all statuses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              of total tasks completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Time to Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.analytics.averageCompletionTime
                ? `${Math.round(project.analytics.averageCompletionTime)} days`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">per task</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
            <CardDescription>
              Number of completed tasks over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Tasks by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index,
                  }) => {
                    const RADIAN = Math.PI / 180
                    const radius = 25 + innerRadius + (outerRadius - innerRadius)
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={tasksByStatus[index].color}
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                      >
                        {tasksByStatus[index].name} ({value})
                      </text>
                    )
                  }}
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={entry.color}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
          <CardDescription>Most active team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contributors.map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={contributor.image} />
                    <AvatarFallback>
                      {contributor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contributor.tasks} tasks assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {contributor.completed} completed
                  </Badge>
                  <Progress
                    value={(contributor.completed / contributor.tasks) * 100}
                    className="w-[100px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
