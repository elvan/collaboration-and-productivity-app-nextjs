import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useComments } from "./use-comments"
import { useActivities } from "./use-activities"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  startDate?: Date
  endDate?: Date
  progress: number
  assignee?: {
    id: string
    name: string
    image?: string | null
  }
}

async function fetchTask(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch task")
  }
  return response.json()
}

export function useTaskDetails(taskId: string) {
  const {
    data: task,
    isLoading: isLoadingTask,
    error: taskError,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    staleTime: 1000 * 60, // 1 minute
  })

  const {
    comments,
    isLoading: isLoadingComments,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
  } = useComments(taskId)

  const {
    activities,
    stats: activityStats,
    isLoading: isLoadingActivities,
  } = useActivities(taskId, true)

  if (taskError) {
    toast.error("Failed to load task details")
  }

  return {
    task,
    comments,
    activities,
    activityStats,
    isLoading: isLoadingTask || isLoadingComments || isLoadingActivities,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
  }
}
