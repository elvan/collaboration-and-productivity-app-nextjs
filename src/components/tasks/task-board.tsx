import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TaskDialog } from "./task-dialog"
import { Plus } from "lucide-react"
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

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface TaskBoardProps {
  tasks: Task[]
  projectId: string
  projectMembers: Array<{ id: string; name: string }>
  onCreate: (data: any) => Promise<void>
  onUpdate: (taskId: string, data: any) => Promise<void>
}

export function TaskBoard({
  tasks,
  projectId,
  projectMembers,
  onCreate,
  onUpdate,
}: TaskBoardProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "To Do",
      tasks: tasks.filter((task) => task.status === "todo"),
    },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: tasks.filter((task) => task.status === "in_progress"),
    },
    {
      id: "done",
      title: "Done",
      tasks: tasks.filter((task) => task.status === "done"),
    },
  ])

  const priorityColors: Record<string, string> = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }

  async function handleCreate(data: any) {
    try {
      await onCreate(data)
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  async function handleDragEnd(result: any) {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    // Update task status if moved to a different column
    if (destination.droppableId !== source.droppableId) {
      try {
        await onUpdate(task.id, {
          status: destination.droppableId,
        })
        router.refresh()
      } catch (error) {
        console.error("Failed to update task status:", error)
      }
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">
                  {column.tasks.length}
                </Badge>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-3"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm font-medium">
                                {task.title}
                              </CardTitle>
                              {task.description && (
                                <CardDescription className="text-xs">
                                  {task.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {task.assignee ? (
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
                                  ) : (
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>?</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <Badge
                                    className={cn(
                                      "capitalize",
                                      priorityColors[task.priority]
                                    )}
                                  >
                                    {task.priority}
                                  </Badge>
                                </div>
                                {task.dueDate && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(task.dueDate), "MMM d")}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <TaskDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onSubmit={handleCreate}
        projectMembers={projectMembers}
        mode="create"
      />
    </>
  )
}
