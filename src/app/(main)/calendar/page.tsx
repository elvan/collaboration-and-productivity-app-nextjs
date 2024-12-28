"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"

export default function CalendarPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Calendar"
        text="View and manage your schedule"
      />
      <div className="grid gap-4">
        <Card className="p-6">
          <Calendar
            mode="single"
            className="rounded-md border"
          />
        </Card>
      </div>
    </DashboardShell>
  )
}
