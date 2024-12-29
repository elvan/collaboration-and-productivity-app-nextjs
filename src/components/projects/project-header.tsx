"use client"

import { Project } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProjectActions } from "./project-actions"
import { 
  CalendarIcon, 
  Clock, 
  Star,
  Share2,
  Bell,
  MoreVertical 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  progress?: number
}

export function ProjectHeader({ project, progress = 0 }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Star className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {project.workspace.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
          <ProjectActions project={project} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                project.status === 'completed'
                  ? 'secondary'
                  : project.status === 'active'
                  ? 'default'
                  : 'destructive'
              }
            >
              {project.status}
            </Badge>
            <Badge
              variant={
                project.priority === 'high'
                  ? 'destructive'
                  : project.priority === 'medium'
                  ? 'default'
                  : 'secondary'
              }
            >
              {project.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.description || 'No description provided'}
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
                    {member.name?.charAt(0) || 'U'}
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
              {project.members.length} member{project.members.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {new Date(project.startDate).toLocaleDateString()} -{' '}
                {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
            {project.estimatedHours && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{project.estimatedHours}h estimated</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progress === 100
              ? 'Project completed'
              : progress > 0
              ? `${100 - progress}% remaining`
              : 'Not started'}
          </p>
        </div>
      </div>
    </div>
  )
}
