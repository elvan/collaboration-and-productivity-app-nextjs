import { useEffect, useCallback, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useRouter } from "next/navigation"
import { EVENTS } from "@/lib/realtime/task-updates"

interface UseTaskUpdatesOptions {
  projectId: string
  viewId?: string
  autoRefresh?: boolean
  refreshInterval?: number
  onUpdate?: () => void
}

export function useTaskUpdates({
  projectId,
  viewId,
  autoRefresh = false,
  refreshInterval = 30,
  onUpdate,
}: UseTaskUpdatesOptions) {
  const router = useRouter()
  const socketRef = useRef<Socket>()
  const refreshTimerRef = useRef<NodeJS.Timeout>()

  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate()
    } else {
      router.refresh()
    }
  }, [onUpdate, router])

  useEffect(() => {
    socketRef.current = io({
      path: "/api/realtime",
    })

    socketRef.current.on("connect", () => {
      console.log("Connected to realtime server")
      socketRef.current?.emit("join:project", projectId)
      if (viewId) {
        socketRef.current?.emit("join:view", viewId)
      }
    })

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from realtime server")
    })

    // Task events
    socketRef.current.on(EVENTS.TASK_CREATED, handleUpdate)
    socketRef.current.on(EVENTS.TASK_UPDATED, handleUpdate)
    socketRef.current.on(EVENTS.TASK_DELETED, handleUpdate)

    // Comment events
    socketRef.current.on(EVENTS.COMMENT_ADDED, handleUpdate)
    socketRef.current.on(EVENTS.COMMENT_UPDATED, handleUpdate)
    socketRef.current.on(EVENTS.COMMENT_DELETED, handleUpdate)

    // Attachment events
    socketRef.current.on(EVENTS.ATTACHMENT_ADDED, handleUpdate)
    socketRef.current.on(EVENTS.ATTACHMENT_DELETED, handleUpdate)

    // Dependency events
    socketRef.current.on(EVENTS.DEPENDENCY_ADDED, handleUpdate)
    socketRef.current.on(EVENTS.DEPENDENCY_REMOVED, handleUpdate)

    return () => {
      if (socketRef.current) {
        socketRef.current.off(EVENTS.TASK_CREATED, handleUpdate)
        socketRef.current.off(EVENTS.TASK_UPDATED, handleUpdate)
        socketRef.current.off(EVENTS.TASK_DELETED, handleUpdate)
        socketRef.current.off(EVENTS.COMMENT_ADDED, handleUpdate)
        socketRef.current.off(EVENTS.COMMENT_UPDATED, handleUpdate)
        socketRef.current.off(EVENTS.COMMENT_DELETED, handleUpdate)
        socketRef.current.off(EVENTS.ATTACHMENT_ADDED, handleUpdate)
        socketRef.current.off(EVENTS.ATTACHMENT_DELETED, handleUpdate)
        socketRef.current.off(EVENTS.DEPENDENCY_ADDED, handleUpdate)
        socketRef.current.off(EVENTS.DEPENDENCY_REMOVED, handleUpdate)
        socketRef.current.disconnect()
      }
    }
  }, [projectId, viewId, handleUpdate])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        handleUpdate()
      }, refreshInterval * 1000)

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, handleUpdate])

  return {
    refresh: handleUpdate,
  }
}
