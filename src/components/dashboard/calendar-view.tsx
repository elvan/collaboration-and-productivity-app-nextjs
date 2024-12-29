"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Task } from "@prisma/client"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"

interface CalendarViewProps {
  tasks: Task[]
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            booked: datesWithTasks,
          }}
          modifiersStyles={{
            booked: {
              fontWeight: "bold",
              backgroundColor: "hsl(var(--primary) / 0.1)",
              color: "hsl(var(--primary))",
            },
          }}
        />
        {date && tasksByDate[format(date, "yyyy-MM-dd")] && (
          <div className="mt-4">
            <h4 className="text-sm font-medium">Tasks for {format(date, "MMMM d, yyyy")}</h4>
            <ul className="mt-2 space-y-2">
              {tasksByDate[format(date, "yyyy-MM-dd")].map((task) => (
                <li key={task.id} className="text-sm">
                  • {task.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
