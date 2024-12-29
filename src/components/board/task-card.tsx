'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MessageSquare, Paperclip } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  index: number
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
}

export function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          {task.priority && (
            <Badge 
              variant="secondary" 
              className={cn(
                'mb-2',
                priorityColors[task.priority] || 'bg-gray-100'
              )}
            >
              {task.priority.toLowerCase()}
            </Badge>
          )}
          
          <h4 className="font-medium">{task.title}</h4>
          
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between text-muted-foreground">
            <div className="flex items-center space-x-4 text-xs">
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                  </span>
                </div>
              )}
              
              {task.estimatedTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimatedTime}h</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center space-x-1 text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span>{task.attachments.length}</span>
                </div>
              )}
              
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center space-x-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}
            </div>
          </div>

          {task.assignedTo && (
            <div className="mt-4 flex items-center justify-end">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={task.assignedTo.image || undefined}
                  alt={task.assignedTo.name || ''}
                />
                <AvatarFallback>
                  {task.assignedTo.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
