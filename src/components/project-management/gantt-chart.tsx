import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"

interface Task {
  id: string
  title: string
  startDate: Date
  endDate: Date
  progress: number
  dependencies?: string[]
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Project Planning",
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 15),
    progress: 100,
  },
  {
    id: "2",
    title: "Design Phase",
    startDate: new Date(2024, 0, 16),
    endDate: new Date(2024, 1, 15),
    progress: 70,
    dependencies: ["1"],
  },
  {
    id: "3",
    title: "Development",
    startDate: new Date(2024, 1, 16),
    endDate: new Date(2024, 3, 15),
    progress: 30,
    dependencies: ["2"],
  },
]

export function GanttChart() {
  const [tasks] = useState(initialTasks)
  const [viewStartDate, setViewStartDate] = useState(new Date(2024, 0, 1))

  // Calculate the number of days to display (e.g., 30 days)
  const daysToShow = 30
  const dayWidth = 40 // pixels per day

  // Generate array of dates for the header
  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(viewStartDate)
    date.setDate(date.getDate() + i)
    return date
  })

  // Helper function to calculate task position and width
  const getTaskStyle = (task: Task) => {
    const startDiff = Math.max(
      0,
      (task.startDate.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = Math.ceil(
      (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      left: `${startDiff * dayWidth}px`,
      width: `${duration * dayWidth}px`,
    }
  }

  const moveTimelineLeft = () => {
    const newDate = new Date(viewStartDate)
    newDate.setDate(newDate.getDate() - 7)
    setViewStartDate(newDate)
  }

  const moveTimelineRight = () => {
    const newDate = new Date(viewStartDate)
    newDate.setDate(newDate.getDate() + 7)
    setViewStartDate(newDate)
  }

  return (
    <div className="h-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gantt Chart</h2>
        <div className="flex gap-2">
          <Button onClick={moveTimelineLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={moveTimelineRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="flex border-b">
            <div className="w-48 flex-shrink-0 border-r p-2 font-medium">
              Task
            </div>
            <div className="flex-1">
              <div className="flex">
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 text-center border-r"
                    style={{ width: \`\${dayWidth}px\` }}
                  >
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString("en-US", { day: "numeric" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="relative">
            {tasks.map((task) => (
              <div key={task.id} className="flex border-b">
                <div className="w-48 flex-shrink-0 border-r p-2">
                  {task.title}
                </div>
                <div className="flex-1 relative h-12">
                  <div
                    className="absolute top-2 h-8 bg-primary/20 rounded"
                    style={getTaskStyle(task)}
                  >
                    <div
                      className="h-full bg-primary rounded"
                      style={{ width: \`\${task.progress}%\` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
