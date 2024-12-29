import { useEffect, useState } from 'react'
import { Task } from '@prisma/client'
import { Chart } from 'frappe-gantt'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

interface GanttChartProps {
  tasks: Task[]
  onTaskUpdate?: (task: Task) => void
}

interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies: string[]
  custom_class?: string
}

const VIEW_MODES = {
  Quarter: 'Quarter Day',
  Half: 'Half Day',
  Day: 'Day',
  Week: 'Week',
  Month: 'Month',
}

export function GanttChart({ tasks, onTaskUpdate }: GanttChartProps) {
  const [gantt, setGantt] = useState<any>(null)
  const [viewMode, setViewMode] = useState(VIEW_MODES.Week)
  const containerRef = useRef<HTMLDivElement>(null)

  const transformTasks = (tasks: Task[]): GanttTask[] => {
    return tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: new Date(task.startDate || Date.now()),
      end: new Date(task.dueDate || Date.now()),
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      custom_class: `priority-${task.priority?.toLowerCase()}`
    }))
  }

  useEffect(() => {
    if (containerRef.current && tasks.length > 0) {
      const ganttTasks = transformTasks(tasks)
      
      const chart = new Chart(containerRef.current, ganttTasks, {
        view_modes: Object.values(VIEW_MODES),
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: null,
        on_click: (task: GanttTask) => {
          // Handle task click
        },
        on_date_change: (task: GanttTask, start: Date, end: Date) => {
          if (onTaskUpdate) {
            onTaskUpdate({
              ...tasks.find(t => t.id === task.id)!,
              startDate: start,
              dueDate: end,
            })
          }
        },
        on_progress_change: (task: GanttTask, progress: number) => {
          if (onTaskUpdate) {
            onTaskUpdate({
              ...tasks.find(t => t.id === task.id)!,
              progress,
            })
          }
        },
        on_view_change: (mode: string) => {
          setViewMode(mode)
        },
      })

      setGantt(chart)

      return () => {
        chart.destroy()
      }
    }
  }, [tasks, viewMode])

  const handleZoomIn = () => {
    const modes = Object.values(VIEW_MODES)
    const currentIndex = modes.indexOf(viewMode)
    if (currentIndex > 0) {
      setViewMode(modes[currentIndex - 1])
    }
  }

  const handleZoomOut = () => {
    const modes = Object.values(VIEW_MODES)
    const currentIndex = modes.indexOf(viewMode)
    if (currentIndex < modes.length - 1) {
      setViewMode(modes[currentIndex + 1])
    }
  }

  const handleToday = () => {
    if (gantt) {
      gantt.change_view_mode(viewMode)
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => gantt?.change_view_mode(viewMode)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => gantt?.change_view_mode(viewMode)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VIEW_MODES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {key} View
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="gantt-container" />

      <style jsx global>{`
        .gantt .bar-wrapper {
          cursor: pointer;
        }
        .gantt .bar {
          transition: fill 0.3s ease;
        }
        .gantt .bar.priority-high {
          fill: #ef4444;
        }
        .gantt .bar.priority-medium {
          fill: #f59e0b;
        }
        .gantt .bar.priority-low {
          fill: #10b981;
        }
        .gantt .bar:hover {
          fill-opacity: 0.9;
        }
        .gantt .bar-label {
          font-size: 12px;
          font-weight: 500;
        }
        .gantt .handle {
          visibility: hidden;
        }
        .gantt .bar-wrapper:hover .handle {
          visibility: visible;
        }
      `}</style>
    </Card>
  )
}
