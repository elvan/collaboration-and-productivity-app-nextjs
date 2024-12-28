"use client"

import { useState, useEffect } from "react"
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  Download,
  MoveRight,
  Users,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { getTasks, taskService } from "@/lib/tasks/task-service"
import toast from "@/lib/toast"

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
  children?: Task[]
}

interface TaskListProps {
  projectId: string
  projectMembers: Array<{ id: string; name: string }>
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, data: any) => Promise<void>
  selectedTasks: string[]
  onSelectTask: (taskId: string) => void
  showHierarchy: boolean
}

export function TaskList({
  projectId,
  projectMembers,
  onDelete,
  onUpdate,
  selectedTasks,
  onSelectTask,
  showHierarchy,
}: TaskListProps) {
  const router = useRouter()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const fetchedTasks = await getTasks(projectId);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

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
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      toast.success("Task deleted successfully");
      router.refresh()
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast.error("Failed to delete task");
    }
  }

  async function handleUpdate(data: any) {
    if (!editingTask) return

    try {
      const updatedTask = await taskService.updateTask(projectId, editingTask.id, data);
      const updatedTasks = tasks.map(task =>
        task.id === editingTask.id ? updatedTask : task
      );
      setTasks(updatedTasks);
      setEditingTask(null);
      toast.success("Task updated successfully");
      router.refresh()
    } catch (error) {
      console.error("Failed to update task:", error)
      toast.error("Failed to update task");
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          taskIds: selectedTasks,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to perform bulk action")
      }

      router.refresh()
    } catch (error) {
      console.error("Error performing bulk action:", error)
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true)
      const response = await fetch("/api/tasks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format,
          taskIds: selectedTasks.length > 0 ? selectedTasks : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to export tasks")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tasks-${format === "csv" ? "csv" : "json"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting tasks:", error)
    } finally {
      setIsExporting(false)
    }
  }

  function renderTaskRow(task: Task, level: number = 0) {
    return (
      <>
        <TableRow key={task.id}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTasks.includes(task.id)}
                onCheckedChange={() => onSelectTask(task.id)}
              />
              <div className="flex flex-col" style={{ marginLeft: level * 24 }}>
                <div className="flex items-center gap-2">
                  {showHierarchy && task.children && task.children.length > 0 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{task.title}</span>
                </div>
                {task.description && (
                  <span className="text-sm text-muted-foreground">
                    {task.description}
                  </span>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={cn("capitalize", statusColors[task.status])}>
              {task.status.replace("_", " ")}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge className={cn("capitalize", priorityColors[task.priority])}>
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
              <span className="text-sm text-muted-foreground">Unassigned</span>
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
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingTask(task)}>
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
        {showHierarchy &&
          task.children?.map((child) => renderTaskRow(child, level + 1))}
      </>
    )
  }

  return (
    <div className="space-y-4">
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedTasks.length} tasks selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Assign To
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {projectMembers.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() =>
                    handleBulkAction("update", { assigneeId: member.id })
                  }
                >
                  {member.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("delete")}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoveRight className="h-4 w-4 mr-2" />
                Move To
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction("update", { status: "todo" })}>
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction("update", { status: "in_progress" })}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction("update", { status: "done" })}>
                Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-center p-4">
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => renderTaskRow(task))
            )}
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
    </div>
  )
}
