'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CalendarIcon, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TaskCardProps {
  task: Task
  index: number
}

export function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(task.dueDate), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              </div>
              {task.assignees?.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assignees.map((assignee) => (
                    <Avatar
                      key={assignee.id}
                      className="h-6 w-6 border-2 border-background"
                    >
                      <AvatarImage
                        src={assignee.user.image}
                        alt={assignee.user.name}
                      />
                      <AvatarFallback>
                        {assignee.user.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
}
