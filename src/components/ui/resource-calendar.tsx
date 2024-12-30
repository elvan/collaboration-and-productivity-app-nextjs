"use client"

import { useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { addDays, format, eachDayOfInterval } from "date-fns"

interface Resource {
  id: string
  user: {
    name: string
  }
  role: string
  availability: number
}

interface Allocation {
  id: string
  resourceId: string
  taskId: string
  allocation: number
  startDate: Date
  endDate: Date
  task: {
    title: string
  }
}

interface ResourceCalendarProps {
  resources: Resource[]
  allocations: Allocation[]
  startDate: Date
  endDate: Date
}

export function ResourceCalendar({
  resources,
  allocations,
  startDate,
  endDate,
}: ResourceCalendarProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(40px,1fr))]">
          {/* Header */}
          <div className="sticky left-0 bg-background p-2 font-medium">
            Resource
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-l p-2 text-center text-sm"
            >
              {format(day, "dd")}
            </div>
          ))}

          {/* Resource rows */}
          {resources.map((resource) => (
            <React.Fragment key={resource.id}>
              <div className="sticky left-0 bg-background border-t p-2">
                <div className="font-medium">{resource.user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {resource.role}
                </div>
              </div>
              {days.map((day) => {
                const dayAllocations = allocations.filter(
                  (a) =>
                    a.resourceId === resource.id &&
                    day >= new Date(a.startDate) &&
                    day <= new Date(a.endDate)
                )
                const totalAllocation = dayAllocations.reduce(
                  (sum, a) => sum + a.allocation,
                  0
                )

                return (
                  <div
                    key={day.toISOString()}
                    className="border-l border-t p-2"
                  >
                    {totalAllocation > 0 && (
                      <div
                        className="h-full w-full rounded bg-primary/20"
                        style={{
                          opacity: totalAllocation / 100,
                        }}
                        title={dayAllocations
                          .map(
                            (a) =>
                              `${a.task.title}: ${a.allocation}%`
                          )
                          .join("\n")}
                      />
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
