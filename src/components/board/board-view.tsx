'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { BoardColumn } from './board-column'
import { Task } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

interface BoardViewProps {
  projectId: string
  initialTasks: Task[]
}

const defaultColumns = {
  todo: { id: 'todo', title: 'To Do', taskIds: [] },
  inProgress: { id: 'inProgress', title: 'In Progress', taskIds: [] },
  review: { id: 'review', title: 'Review', taskIds: [] },
  done: { id: 'done', title: 'Done', taskIds: [] },
}

export function BoardView({ projectId, initialTasks }: BoardViewProps) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns, setColumns] = useState(defaultColumns)

  useEffect(() => {
    // Organize tasks into columns based on their status
    const newColumns = { ...defaultColumns }
    tasks.forEach((task) => {
      const status = task.status.toLowerCase()
      const columnId = status === 'in_progress' ? 'inProgress' : status
      if (newColumns[columnId]) {
        newColumns[columnId].taskIds.push(task.id)
      }
    })
    setColumns(newColumns)
  }, [tasks])

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Update columns
    const startColumn = columns[source.droppableId]
    const endColumn = columns[destination.droppableId]

    if (startColumn === endColumn) {
      const newTaskIds = Array.from(startColumn.taskIds)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      }

      setColumns({
        ...columns,
        [newColumn.id]: newColumn,
      })
    } else {
      // Moving from one column to another
      const startTaskIds = Array.from(startColumn.taskIds)
      startTaskIds.splice(source.index, 1)
      const newStart = {
        ...startColumn,
        taskIds: startTaskIds,
      }

      const endTaskIds = Array.from(endColumn.taskIds)
      endTaskIds.splice(destination.index, 0, draggableId)
      const newEnd = {
        ...endColumn,
        taskIds: endTaskIds,
      }

      setColumns({
        ...columns,
        [newStart.id]: newStart,
        [newEnd.id]: newEnd,
      })

      // Update task status in the database
      try {
        const response = await fetch(`/api/tasks/${draggableId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: destination.droppableId === 'inProgress' ? 'in_progress' : destination.droppableId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task status')
        }

        toast({
          title: 'Task updated',
          description: 'Task status has been updated successfully.',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update task status. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {Object.values(columns).map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => column.taskIds.includes(task.id))}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
