import { Project } from "@prisma/client"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ProjectWithTasks extends Project {
  tasks: {
    id: string
    status: string
  }[]
}

interface ProjectCardProps {
  project: ProjectWithTasks
}

export function ProjectCard({ project }: ProjectCardProps) {
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(
    (task) => task.status === "completed"
  ).length
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </p>
          </div>
          <Badge
            variant={
              project.priority === "high"
                ? "destructive"
                : project.priority === "medium"
                ? "default"
                : "secondary"
            }
          >
            {project.priority}
          </Badge>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Progress</p>
            <p>{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {completedTasks} of {totalTasks} tasks completed
          </p>
          {project.dueDate && (
            <p className="text-muted-foreground">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
