"use client"

import { Project, User, Workspace } from "@prisma/client"
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

interface ExtendedProject extends Project {
  owner: {
    name: string | null
    email: string
    image: string | null
  }
  workspace: {
    name: string
  }
  tasks: {
    id: string
    status: string
  }[]
  members: {
    id: string
    name: string | null
    image: string | null
  }[]
}

interface ProjectTableProps {
  projects: ExtendedProject[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const totalTasks = project.tasks.length
          const completedTasks = project.tasks.filter(
            (task) => task.status === "completed"
          ).length
          const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100

          return (
            <TableRow key={project.id}>
              <TableCell>
                <div className="flex flex-col">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {project.workspace.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <div className="flex w-full max-w-[180px] items-center gap-2">
                  <Progress value={progress} className="h-2" />
                  <span className="w-10 text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(project.updatedAt), {
                  addSuffix: true,
                })}
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
