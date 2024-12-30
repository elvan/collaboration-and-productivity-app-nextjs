"use client"

import { useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface TimelineItem {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  dependencies: any[]
  milestones: any[]
}

interface TimelineProps {
  items: TimelineItem[]
  loading?: boolean
}

export function Timeline({ items = [], loading = false }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || loading || !items.length) return

    const container = containerRef.current
    const allDates = items.flatMap(item => [item.startDate, item.endDate])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Draw timeline
    const canvas = document.createElement("canvas")
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawTimeline = () => {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
      
      ctx.strokeStyle = "rgb(var(--foreground))"
      ctx.lineWidth = 2

      // Draw dependency lines
      items.forEach(item => {
        if (!item.dependencies?.length) return

        const startX = ((item.startDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * canvas.width
        const startY = items.indexOf(item) * 100 + 50

        item.dependencies.forEach(dep => {
          const depItem = items.find(i => i.id === dep.id)
          if (!depItem) return

          const endX = ((depItem.endDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * canvas.width
          const endY = items.indexOf(depItem) * 100 + 50

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        })
      })
    }

    drawTimeline()
    window.addEventListener("resize", drawTimeline)

    return () => {
      window.removeEventListener("resize", drawTimeline)
      container.removeChild(canvas)
    }
  }, [items, loading])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative space-y-4 pb-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="w-[100px] text-sm font-medium">
            {item.startDate.toLocaleDateString()}
          </div>
          <Card className="flex-1 p-4">
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.milestones?.length > 0 && (
              <div className="mt-2">
                <h5 className="text-sm font-medium">Milestones</h5>
                <ul className="mt-1 space-y-1">
                  {item.milestones.map((milestone: any) => (
                    <li key={milestone.id} className="text-sm">
                      • {milestone.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  )
}
