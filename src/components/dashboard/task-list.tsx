import { Task, Project } from "@prisma/client"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "lucide-react"

interface TaskWithProject extends Task {
  project: Project
}

interface TaskListProps {
  tasks: TaskWithProject[]
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/dashboard/projects/${task.projectId}?task=${task.id}`}
        >
          <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {task.description}
                </p>
              </div>
              <Badge
                variant={
                  task.priority === "high"
                    ? "destructive"
                    : task.priority === "medium"
                    ? "default"
                    : "secondary"
                }
              >
                {task.priority}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">{task.project.name}</p>
              {task.dueDate && (
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  <p>{new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
