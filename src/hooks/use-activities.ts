import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

interface Activity {
  id: string
  type: string
  createdAt: Date
  userId: string
  taskId: string
  metadata?: {
    previousValue?: any
    newValue?: any
    commentId?: string
    attachmentId?: string
    dependencyId?: string
    customFieldId?: string
    workflowId?: string
    automationId?: string
    description?: string
  }
}

interface ActivityStats {
  totalCount: number
  byType: Record<string, number>
  byDate: Record<string, number>
}

async function fetchActivities(taskId: string, includeStats: boolean = false) {
  const response = await fetch(
    `/api/tasks/${taskId}/activities?includeStats=${includeStats}`
  )
  if (!response.ok) {
    throw new Error("Failed to fetch activities")
  }
  return response.json()
}

export function useActivities(taskId: string, includeStats: boolean = false) {
  const queryKey = ["activities", taskId, { includeStats }]

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchActivities(taskId, includeStats),
    staleTime: 1000 * 60, // 1 minute
    select: (data) => ({
      activities: data.activities,
      stats: data.stats,
    }),
  })

  if (error) {
    toast.error("Failed to load activities")
  }

  return {
    activities: data?.activities || [],
    stats: data?.stats,
    isLoading,
  }
}
