"use client"

import * as React from "react"
import { Project, Task } from "@prisma/client"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, CheckCircle, Circle, PlusIcon } from "lucide-react"
import { CreateTask } from "./create-task"
import { TaskActions } from "./task-actions"

interface ExtendedTask extends Task {
  assignedTo: {
    id: string
    name: string | null
    image: string | null
  } | null
}

interface ExtendedProject extends Project {
  tasks: ExtendedTask[]
}

interface ProjectTaskListProps {
  project: ExtendedProject
}

export function ProjectTaskList({ project }: ProjectTaskListProps) {
  const [showCreateTask, setShowCreateTask] = React.useState<boolean>(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track project tasks
          </p>
        </div>
        <Button onClick={() => setShowCreateTask(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  {task.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  {task.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignedTo.image || undefined} />
                        <AvatarFallback>
                          {task.assignedTo.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {task.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No due date
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <TaskActions task={task} />
                </TableCell>
              </TableRow>
            ))}
            {project.tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="py-6">
                    <p className="text-muted-foreground">
                      No tasks found. Create your first task to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CreateTask
        project={project}
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
      />
    </div>
  )
}
