"use client"

import { Project } from "@/types/project"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ProjectActions } from "./project-actions"
import { AvatarGroup } from "@/components/ui/avatar-group"

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const getProjectProgress = (project: Project) => {
    if (!project.tasks.length) return 0
    const completedTasks = project.tasks.filter(task => task.taskStatus?.name === "Completed").length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Tasks</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const progress = getProjectProgress(project)
          return (
            <TableRow key={project.id}>
              <TableCell>
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium hover:underline"
                >
                  {project.name}
                </Link>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    project.status === "ACTIVE"
                      ? "default"
                      : project.status === "COMPLETED"
                      ? "success"
                      : "secondary"
                  }
                >
                  {project.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-[60px]" />
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <AvatarGroup>
                  {project.members.map((member) => (
                    <Avatar key={member.id}>
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {project.tasks.length}
                  </span>
                  {project.tasks.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {project.tasks.filter(task => task.taskStatus?.name === "Completed").length} completed
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <ProjectActions project={project} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
