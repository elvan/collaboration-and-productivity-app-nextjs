"use client"

import { Project, User, Workspace } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectActions } from "./project-actions"
import { CalendarIcon } from "lucide-react"

interface ExtendedProject extends Project {
  owner: {
    name: string | null
    email: string
    image: string | null
  }
  workspace: {
    name: string
  }
  members: {
    id: string
    name: string | null
    image: string | null
  }[]
}

interface ProjectHeaderProps {
  project: ExtendedProject
  progress: number
}

export function ProjectHeader({ project, progress }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-sm text-muted-foreground">
            {project.workspace.name}
          </p>
        </div>
        <ProjectActions project={project} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                project.status === "completed"
                  ? "secondary"
                  : project.status === "active"
                  ? "default"
                  : "destructive"
              }
            >
              {project.status}
            </Badge>
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
          <p className="text-sm text-muted-foreground">
            {project.description || "No description provided"}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {project.members.slice(0, 4).map((member) => (
                <Avatar
                  key={member.id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage src={member.image || undefined} />
                  <AvatarFallback>
                    {member.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-sm">
                  +{project.members.length - 4}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {project.members.length} member{project.members.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {new Date(project.startDate).toLocaleDateString()} -{" "}
              {new Date(project.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  )
}
