import { useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { EVENTS } from '@/lib/realtime/task-updates'

interface UseTaskRealtimeOptions {
  projectId: string
  onTaskCreated?: (task: any) => void
  onTaskUpdated?: (task: any) => void
  onTaskDeleted?: (taskId: string) => void
  onCommentAdded?: (comment: any) => void
  onCommentUpdated?: (comment: any) => void
  onCommentDeleted?: (commentId: string) => void
  onAttachmentAdded?: (attachment: any) => void
  onAttachmentDeleted?: (attachmentId: string) => void
  onDependencyAdded?: (dependency: any) => void
  onDependencyRemoved?: (dependencyId: string) => void
}

export function useTaskRealtime({
  projectId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  onAttachmentAdded,
  onAttachmentDeleted,
  onDependencyAdded,
  onDependencyRemoved,
}: UseTaskRealtimeOptions) {
  const setupSocket = useCallback(() => {
    const socket: Socket = io({
      path: '/api/realtime',
    })

    socket.on('connect', () => {
      console.log('Connected to realtime server')
      socket.emit('join:project', projectId)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from realtime server')
    })

    // Task events
    socket.on(EVENTS.TASK_CREATED, onTaskCreated)
    socket.on(EVENTS.TASK_UPDATED, onTaskUpdated)
    socket.on(EVENTS.TASK_DELETED, ({ taskId }) => onTaskDeleted?.(taskId))

    // Comment events
    socket.on(EVENTS.TASK_COMMENT_ADDED, onCommentAdded)
    socket.on(EVENTS.TASK_COMMENT_UPDATED, onCommentUpdated)
    socket.on(EVENTS.TASK_COMMENT_DELETED, ({ commentId }) => onCommentDeleted?.(commentId))

    // Attachment events
    socket.on(EVENTS.TASK_ATTACHMENT_ADDED, onAttachmentAdded)
    socket.on(EVENTS.TASK_ATTACHMENT_DELETED, ({ attachmentId }) => onAttachmentDeleted?.(attachmentId))

    // Dependency events
    socket.on(EVENTS.TASK_DEPENDENCY_ADDED, onDependencyAdded)
    socket.on(EVENTS.TASK_DEPENDENCY_REMOVED, ({ dependencyId }) => onDependencyRemoved?.(dependencyId))

    return socket
  }, [
    projectId,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
    onAttachmentAdded,
    onAttachmentDeleted,
    onDependencyAdded,
    onDependencyRemoved,
  ])

  useEffect(() => {
    const socket = setupSocket()

    return () => {
      socket.emit('leave:project', projectId)
      socket.disconnect()
    }
  }, [projectId, setupSocket])
}
