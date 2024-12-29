"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Task } from "@prisma/client"
import { format, isSameMonth, isSameDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarViewProps {
  tasks: Task[]
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const dateKey = format(task.dueDate, "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(task)
    }
    return acc
  }, {} as Record<string, Task[]>)

  // Create an array of dates that have tasks
  const datesWithTasks = Object.keys(tasksByDate).map(date => new Date(date))

  const selectedTasks = date ? tasksByDate[format(date, "yyyy-MM-dd")] || [] : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Task Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            components={{
              DayContent: ({ date: dayDate }) => (
                <div className="relative">
                  <time dateTime={format(dayDate, "yyyy-MM-dd")}>
                    {format(dayDate, "d")}
                  </time>
                  {datesWithTasks.some(d => isSameDay(d, dayDate)) && (
                    <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </div>
              ),
            }}
          />
          {selectedTasks.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Tasks for {format(date!, "MMMM d, yyyy")}
                </h4>
                <Badge variant="secondary">
                  {selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}
                </Badge>
              </div>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center space-x-2 rounded-md border p-2",
                        task.status === "completed" && "bg-muted line-through"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
