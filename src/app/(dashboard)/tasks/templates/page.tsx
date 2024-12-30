import { Metadata } from "next"
import { TaskTemplatesClient } from "@/components/tasks/task-templates-client"

export const metadata: Metadata = {
  title: "Task Templates",
  description: "Create and manage reusable task templates for your projects.",
}

export default async function TaskTemplatesPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TaskTemplatesClient />
      </div>
    </div>
  )
}
