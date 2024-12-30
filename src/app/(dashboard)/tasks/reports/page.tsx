import { Metadata } from "next"
import { TaskReportsClient } from "@/components/tasks/task-reports-client"

export const metadata: Metadata = {
  title: "Task Reports",
  description: "Generate and view detailed reports for tasks across all projects.",
}

export default async function TaskReportsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TaskReportsClient />
      </div>
    </div>
  )
}
