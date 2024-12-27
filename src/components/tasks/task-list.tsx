import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskDialog } from "./task-dialog"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  assignee?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
}

interface TaskListProps {
  tasks: Task[]
  projectId: string
  projectMembers: Array<{ id: string; name: string }>
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, data: any) => Promise<void>
}

export function TaskList({
  tasks,
  projectId,
  projectMembers,
  onDelete,
  onUpdate,
}: TaskListProps) {
  const router = useRouter()
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const statusColors: Record<string, string> = {
    todo: "bg-slate-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
  }

  const priorityColors: Record<string, string> = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }

  async function handleDelete(taskId: string) {
    try {
      await onDelete(taskId)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  async function handleUpdate(data: any) {
    if (!editingTask) return

    try {
      await onUpdate(editingTask.id, data)
      setEditingTask(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{task.title}</span>
                    {task.description && (
                      <span className="text-sm text-muted-foreground">
                        {task.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("capitalize", statusColors[task.status])}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("capitalize", priorityColors[task.priority])}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={task.assignee.image || ""}
                          alt={task.assignee.name}
                        />
                        <AvatarFallback>
                          {task.assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <span className="text-sm">
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No date</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TaskDialog
        open={!!editingTask}
        onOpenChange={() => setEditingTask(null)}
        onSubmit={handleUpdate}
        defaultValues={editingTask || undefined}
        projectMembers={projectMembers}
        mode="edit"
      />
    </>
  )
}
