'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Task } from '@prisma/client'
import { TaskCard } from './task-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface BoardColumnProps {
  column: {
    id: string
    title: string
    taskIds: string[]
  }
  tasks: Task[]
}

export function BoardColumn({ column, tasks }: BoardColumnProps) {
  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{column.title}</span>
          <span className="text-sm text-muted-foreground">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <CardContent
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`min-h-[500px] ${
              snapshot.isDraggingOver ? 'bg-muted/50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </CardContent>
        )}
      </Droppable>
    </Card>
  )
}
