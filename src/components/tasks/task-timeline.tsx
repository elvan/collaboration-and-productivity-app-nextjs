import { useMemo } from "react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  startDate?: Date | null
  labels?: string[]
  assignee?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  dependencies?: Task[]
  dependents?: Task[]
}

interface TaskTimelineProps {
  tasks: Task[]
  startDate: Date
  endDate: Date
  onTaskClick: (task: Task) => void
}

const DAYS_TO_SHOW = 14
const HOURS_IN_DAY = 24
const HOUR_WIDTH = 60 // pixels
const TIMELINE_HEIGHT = 600 // pixels

export function TaskTimeline({
  tasks,
  startDate,
  endDate,
  onTaskClick,
}: TaskTimelineProps) {
  const timelineStart = startOfDay(startDate)
  const timelineEnd = endOfDay(endDate)

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by start date, then due date, then priority
      if (a.startDate && b.startDate) {
        return a.startDate.getTime() - b.startDate.getTime()
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [tasks])

  const taskRows = useMemo(() => {
    const rows: Task[][] = []
    sortedTasks.forEach((task) => {
      // Find the first row where the task can fit without overlapping
      const rowIndex = rows.findIndex((row) => {
        return !row.some((existingTask) => {
          const taskStart = task.startDate || task.dueDate
          const taskEnd = task.dueDate || task.startDate
          const existingStart = existingTask.startDate || existingTask.dueDate
          const existingEnd = existingTask.dueDate || existingTask.startDate

          if (!taskStart || !taskEnd || !existingStart || !existingEnd) {
            return false
          }

          return (
            isWithinInterval(taskStart, {
              start: existingStart,
              end: existingEnd,
            }) ||
            isWithinInterval(taskEnd, {
              start: existingStart,
              end: existingEnd,
            })
          )
        })
      })

      if (rowIndex === -1) {
        rows.push([task])
      } else {
        rows[rowIndex].push(task)
      }
    })
    return rows
  }, [sortedTasks])

  const getTaskPosition = (task: Task) => {
    const taskStart = task.startDate || task.dueDate
    const taskEnd = task.dueDate || task.startDate

    if (!taskStart || !taskEnd) {
      return null
    }

    const start = startOfDay(taskStart)
    const end = endOfDay(taskEnd)

    const startOffset =
      ((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60)) *
      HOUR_WIDTH
    const duration =
      ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * HOUR_WIDTH

    return {
      left: startOffset,
      width: duration,
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Task timeline from {format(timelineStart, "MMM d, yyyy")} to{" "}
          {format(timelineEnd, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)] w-full">
          <div
            className="relative"
            style={{
              width: DAYS_TO_SHOW * HOURS_IN_DAY * HOUR_WIDTH,
              height: TIMELINE_HEIGHT,
            }}
          >
            {/* Time grid */}
            <div className="absolute inset-0 grid grid-cols-24 gap-0">
              {Array.from({ length: DAYS_TO_SHOW * HOURS_IN_DAY }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="border-l border-gray-200 dark:border-gray-800"
                    style={{ height: TIMELINE_HEIGHT }}
                  >
                    {index % HOURS_IN_DAY === 0 && (
                      <div className="sticky top-0 bg-background px-2 py-1 text-sm font-medium">
                        {format(
                          new Date(
                            timelineStart.getTime() + index * 60 * 60 * 1000
                          ),
                          "MMM d"
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Tasks */}
            {taskRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="relative"
                style={{ height: 80, marginTop: rowIndex * 90 }}
              >
                {row.map((task) => {
                  const position = getTaskPosition(task)
                  if (!position) return null

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "absolute rounded-md p-2 shadow-sm transition-shadow hover:shadow-md",
                        getPriorityColor(task.priority)
                      )}
                      style={{
                        left: position.left,
                        width: position.width,
                        top: 0,
                        height: 70,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex h-full flex-col justify-between overflow-hidden">
                        <div>
                          <h4 className="font-medium text-white line-clamp-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-white/80 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {task.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignee.image || ""}
                                alt={task.assignee.name}
                              />
                              <AvatarFallback>
                                {task.assignee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <Badge
                            variant="secondary"
                            className="bg-white/20 text-white"
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
