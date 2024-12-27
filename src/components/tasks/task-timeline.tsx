import { useEffect, useRef, useState } from "react"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { motion } from "framer-motion"
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import "chartjs-adapter-date-fns"
import { Line } from "react-chartjs-2"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Task {
  id: string
  title: string
  status: string
  priority: string
  startDate?: Date
  endDate?: Date
  progress: number
  dependencies: Array<{
    id: string
    type: string
    targetTaskId: string
    metadata?: {
      delay?: number
    }
  }>
}

interface TaskTimelineProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
  showCriticalPath?: boolean
  criticalPath?: string[]
}

export function TaskTimeline({
  tasks,
  onTaskClick,
  showCriticalPath = false,
  criticalPath = [],
}: TaskTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(addDays(new Date(), 30)),
  })
  const [zoom, setZoom] = useState(1)

  const chartData = {
    datasets: tasks.map((task) => ({
      label: task.title,
      data: [
        {
          x: task.startDate || new Date(),
          y: task.progress,
        },
        {
          x: task.endDate || addDays(new Date(), 1),
          y: task.progress,
        },
      ],
      borderColor: showCriticalPath && criticalPath.includes(task.id)
        ? "rgb(239, 68, 68)"
        : task.priority === "high"
        ? "rgb(234, 179, 8)"
        : "rgb(59, 130, 246)",
      backgroundColor: showCriticalPath && criticalPath.includes(task.id)
        ? "rgba(239, 68, 68, 0.5)"
        : task.priority === "high"
        ? "rgba(234, 179, 8, 0.5)"
        : "rgba(59, 130, 246, 0.5)",
      borderWidth: showCriticalPath && criticalPath.includes(task.id) ? 2 : 1,
      tension: 0.4,
      fill: true,
    })),
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onTaskClick) {
        const datasetIndex = elements[0].datasetIndex
        const taskId = tasks[datasetIndex].id
        onTaskClick(taskId)
      }
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day",
          displayFormats: {
            day: "MMM d",
          },
        },
        min: timeRange.start,
        max: timeRange.end,
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Progress (%)",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const task = tasks[context.datasetIndex]
            return [
              `Task: ${task.title}`,
              `Progress: ${task.progress}%`,
              `Status: ${task.status}`,
              `Priority: ${task.priority}`,
            ]
          },
        },
      },
    },
  }

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current
      scrollRef.current.scrollLeft = (scrollWidth - clientWidth) / 2
    }
  }, [])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3))
    setTimeRange((prev) => ({
      start: addDays(prev.start, 2),
      end: addDays(prev.end, -2),
    }))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5))
    setTimeRange((prev) => ({
      start: addDays(prev.start, -2),
      end: addDays(prev.end, 2),
    }))
  }

  const handlePanLeft = () => {
    setTimeRange((prev) => ({
      start: addDays(prev.start, -7),
      end: addDays(prev.end, -7),
    }))
  }

  const handlePanRight = () => {
    setTimeRange((prev) => ({
      start: addDays(prev.start, 7),
      end: addDays(prev.end, 7),
    }))
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePanLeft}
          >
            <Icons.arrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
          >
            <Icons.zoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
          >
            <Icons.zoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePanRight}
          >
            <Icons.arrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-sm">High Priority</span>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm">Critical Path</span>
            </div>
          )}
        </div>
      </div>
      <ScrollArea
        ref={scrollRef}
        className="h-[400px]"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center",
        }}
      >
        <Line data={chartData} options={chartOptions} />
      </ScrollArea>
    </Card>
  )
}
