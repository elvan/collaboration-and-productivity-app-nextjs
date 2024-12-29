'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useUpdateTask } from '@/hooks/use-update-task'
import { Task, TaskStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'
import { TaskCard } from './task-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BoardViewProps {
  projectId: string
  initialTasks: Task[]
}

interface Column {
  id: TaskStatus
  title: string
  color: string
  tasks: Task[]
}

const defaultColumns: Column[] = [
  {
    id: 'TODO',
    title: 'To Do',
    color: 'bg-gray-100',
    tasks: [],
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'bg-blue-100',
    tasks: [],
  },
  {
    id: 'IN_REVIEW',
    title: 'In Review',
    color: 'bg-yellow-100',
    tasks: [],
  },
  {
    id: 'DONE',
    title: 'Done',
    color: 'bg-green-100',
    tasks: [],
  },
]

export function BoardView({ projectId, initialTasks }: BoardViewProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [columns, setColumns] = useState(defaultColumns)
  const updateTask = useUpdateTask()

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const boardColumns = columns.map(column => ({
    ...column,
    tasks: filteredTasks.filter(task => task.status === column.id),
  }))

  const onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result

    if (!destination) return

    // Same column move
    if (source.droppableId === destination.droppableId) {
      const column = boardColumns.find(col => col.id === source.droppableId)
      if (!column) return

      const newTasks = Array.from(column.tasks)
      const [removed] = newTasks.splice(source.index, 1)
      newTasks.splice(destination.index, 0, removed)

      const newColumns = boardColumns.map(col =>
        col.id === source.droppableId ? { ...col, tasks: newTasks } : col
      )

      setColumns(newColumns)
    } else {
      // Cross column move
      const sourceColumn = boardColumns.find(col => col.id === source.droppableId)
      const destColumn = boardColumns.find(col => col.id === destination.droppableId)
      if (!sourceColumn || !destColumn) return

      const sourceTasks = Array.from(sourceColumn.tasks)
      const destTasks = Array.from(destColumn.tasks)
      const [removed] = sourceTasks.splice(source.index, 1)
      destTasks.splice(destination.index, 0, removed)

      const newColumns = boardColumns.map(col => {
        if (col.id === source.droppableId) return { ...col, tasks: sourceTasks }
        if (col.id === destination.droppableId) return { ...col, tasks: destTasks }
        return col
      })

      setColumns(newColumns)

      // Update task status in the backend
      updateTask.mutate({
        projectId,
        taskId: draggableId,
        data: {
          status: destination.droppableId as TaskStatus,
        },
      })
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-64"
            leftIcon={<Search className="h-4 w-4 text-gray-400" />}
          />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full space-x-4 overflow-x-auto pb-4">
          {boardColumns.map(column => (
            <div
              key={column.id}
              className="flex h-full w-80 flex-none flex-col rounded-lg border bg-card"
            >
              <div className={`flex items-center justify-between rounded-t-lg border-b p-3 ${column.color}`}>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="rounded bg-white/50 px-2 py-0.5 text-xs">
                    {column.tasks.length}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Column</DropdownMenuItem>
                    <DropdownMenuItem>Clear Column</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 overflow-y-auto p-2 ${
                      snapshot.isDraggingOver ? 'bg-accent/50' : ''
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <TaskCard task={task} index={index} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
