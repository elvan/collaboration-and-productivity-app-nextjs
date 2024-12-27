import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskDialog } from "./task-dialog"
import { format } from "date-fns"
import {
  Clock,
  ListChecks,
  Link as LinkIcon,
  MoreHorizontal,
  Tag,
} from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  labels?: string[]
  customFields?: Record<string, any>
  assignee?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  _count?: {
    subtasks: number
    dependencies: number
    dependents: number
  }
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface TaskBoardProps {
  tasks: Task[]
  onTaskMove: (taskId: string, sourceStatus: string, targetStatus: string) => Promise<void>
  onTaskUpdate: (taskId: string, data: any) => Promise<void>
  currentUserId: string
}

export function TaskBoard({
  tasks,
  onTaskMove,
  onTaskUpdate,
  currentUserId,
}: TaskBoardProps) {
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
      id: "review",
      title: "Review",
      tasks: tasks.filter((task) => task.status === "review"),
    },
    {
      id: "done",
      title: "Done",
      tasks: tasks.filter((task) => task.status === "done"),
    },
  ])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const sourceColumn = columns.find(
      (column) => column.id === result.source.droppableId
    )
    const destColumn = columns.find(
      (column) => column.id === result.destination.droppableId
    )

    if (!sourceColumn || !destColumn) return

    const taskToMove = sourceColumn.tasks[result.source.index]

    // Update columns state
    const newColumns = columns.map((column) => {
      if (column.id === sourceColumn.id) {
        return {
          ...column,
          tasks: column.tasks.filter((_, index) => index !== result.source.index),
        }
      }
      if (column.id === destColumn.id) {
        const newTasks = Array.from(column.tasks)
        newTasks.splice(result.destination.index, 0, {
          ...taskToMove,
          status: destColumn.id,
        })
        return {
          ...column,
          tasks: newTasks,
        }
      }
      return column
    })

    setColumns(newColumns)

    // Call API to update task status
    await onTaskMove(taskToMove.id, sourceColumn.id, destColumn.id)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">{column.tasks.length}</Badge>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-2 min-h-[500px]"
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
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedTask(task)}
                          >
                            <CardHeader className="p-4">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium">
                                  {task.title}
                                </CardTitle>
                                <Badge
                                  className={`${getPriorityColor(
                                    task.priority
                                  )} text-white`}
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.description && (
                                <CardDescription className="text-sm">
                                  {task.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex flex-col gap-2">
                                {task.dueDate && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                                  </div>
                                )}
                                {task._count && task._count.subtasks > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ListChecks className="h-4 w-4" />
                                    {task._count.subtasks} subtasks
                                  </div>
                                )}
                                {task._count && task._count.dependencies > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <LinkIcon className="h-4 w-4" />
                                    {task._count.dependencies} dependencies
                                  </div>
                                )}
                                {task.labels && task.labels.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex gap-1">
                                      {task.labels.map((label) => (
                                        <Badge
                                          key={label}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {label}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {task.assignee && (
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
                                    <span className="text-sm text-muted-foreground">
                                      {task.assignee.name}
                                    </span>
                                  </div>
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

      {selectedTask && (
        <TaskDialog
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
          task={selectedTask}
          onUpdate={onTaskUpdate}
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
