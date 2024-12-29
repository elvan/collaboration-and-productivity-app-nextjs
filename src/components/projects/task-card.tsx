'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CalendarIcon, Clock, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TaskCardProps {
  task: Task & {
    assignees?: {
      user: {
        id: string
        name: string | null
        image: string | null
      }
    }[]
    taskPriority?: {
      name: string
      color: string
    }
    labels?: {
      name: string
      color: string
    }[]
  }
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
          className={`mb-2 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
        >
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>{task.title}</span>
              {task.taskPriority && (
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: task.taskPriority.color + '20',
                    color: task.taskPriority.color,
                  }}
                >
                  {task.taskPriority.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <Badge
                    key={label.name}
                    variant="outline"
                    style={{
                      backgroundColor: label.color + '20',
                      color: label.color,
                    }}
                    className="text-xs"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {label.name}
                  </Badge>
                ))}
              </div>
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
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assignees.map((assignee) => (
                    <Avatar
                      key={assignee.user.id}
                      className="h-6 w-6 border-2 border-background"
                    >
                      <AvatarImage
                        src={assignee.user.image || ''}
                        alt={assignee.user.name || ''}
                      />
                      <AvatarFallback>
                        {assignee.user.name?.[0] || '?'}
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
