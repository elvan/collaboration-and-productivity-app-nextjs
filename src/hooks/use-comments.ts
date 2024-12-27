import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  userId: string
  taskId: string
  parentId?: string
  metadata?: {
    mentions?: string[]
    attachments?: string[]
    reactions?: Record<string, string[]>
    editHistory?: Array<{
      content: string
      timestamp: Date
      userId: string
    }>
  }
}

async function fetchComments(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}/comments`)
  if (!response.ok) {
    throw new Error("Failed to fetch comments")
  }
  return response.json()
}

async function createComment(data: {
  taskId: string
  content: string
  parentId?: string
}) {
  const response = await fetch(`/api/tasks/${data.taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: data.content,
      parentId: data.parentId,
    }),
  })
  if (!response.ok) {
    throw new Error("Failed to create comment")
  }
  return response.json()
}

async function updateComment(data: {
  taskId: string
  commentId: string
  content: string
}) {
  const response = await fetch(
    `/api/tasks/${data.taskId}/comments/${data.commentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data.content }),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to update comment")
  }
  return response.json()
}

async function deleteComment(data: {
  taskId: string
  commentId: string
}) {
  const response = await fetch(
    `/api/tasks/${data.taskId}/comments/${data.commentId}`,
    {
      method: "DELETE",
    }
  )
  if (!response.ok) {
    throw new Error("Failed to delete comment")
  }
}

async function addReaction(data: {
  taskId: string
  commentId: string
  emoji: string
}) {
  const response = await fetch(
    `/api/tasks/${data.taskId}/comments/${data.commentId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: data.emoji }),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to add reaction")
  }
  return response.json()
}

async function removeReaction(data: {
  taskId: string
  commentId: string
  emoji: string
}) {
  const response = await fetch(
    `/api/tasks/${data.taskId}/comments/${data.commentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: data.emoji }),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to remove reaction")
  }
  return response.json()
}

export function useComments(taskId: string) {
  const queryClient = useQueryClient()
  const queryKey = ["comments", taskId]

  const { data: comments, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchComments(taskId),
    staleTime: 1000 * 60, // 1 minute
  })

  const createMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Comment added")
    },
    onError: () => {
      toast.error("Failed to add comment")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Comment updated")
    },
    onError: () => {
      toast.error("Failed to update comment")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Comment deleted")
    },
    onError: () => {
      toast.error("Failed to delete comment")
    },
  })

  const addReactionMutation = useMutation({
    mutationFn: addReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error("Failed to add reaction")
    },
  })

  const removeReactionMutation = useMutation({
    mutationFn: removeReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error("Failed to remove reaction")
    },
  })

  return {
    comments,
    isLoading,
    createComment: (content: string, parentId?: string) =>
      createMutation.mutate({ taskId, content, parentId }),
    updateComment: (commentId: string, content: string) =>
      updateMutation.mutate({ taskId, commentId, content }),
    deleteComment: (commentId: string) =>
      deleteMutation.mutate({ taskId, commentId }),
    addReaction: (commentId: string, emoji: string) =>
      addReactionMutation.mutate({ taskId, commentId, emoji }),
    removeReaction: (commentId: string, emoji: string) =>
      removeReactionMutation.mutate({ taskId, commentId, emoji }),
  }
}
