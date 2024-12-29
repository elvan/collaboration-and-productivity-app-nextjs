"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { User, VersionComment, CommentReaction } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  MoreVertical,
  Smile,
  AtSign,
  Reply,
  Edit,
  Trash,
} from "lucide-react"
import { format } from "date-fns"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"

interface ExtendedComment extends VersionComment {
  createdBy: User
  replies: ExtendedComment[]
  reactions: (CommentReaction & {
    createdBy: User
  })[]
}

interface VersionCommentsProps {
  workspaceId: string
  templateId: string
  versionId: string
}

export function VersionComments({
  workspaceId,
  templateId,
  versionId,
}: VersionCommentsProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [comments, setComments] = useState<ExtendedComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchComments()
  }, [versionId])

  async function fetchComments() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/versions/${versionId}/comments`
      )
      if (!response.ok) throw new Error("Failed to fetch comments")
      const data = await response.json()
      setComments(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment(parentId?: string) {
    try {
      const content = parentId ? newComment : commentInputRef.current?.value
      if (!content?.trim()) return

      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/versions/${versionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            parentId,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to create comment")

      const newCommentData = await response.json()
      if (parentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...comment.replies, newCommentData],
                }
              : comment
          )
        )
        setReplyTo(null)
      } else {
        setComments((prev) => [...prev, newCommentData])
        if (commentInputRef.current) {
          commentInputRef.current.value = ""
        }
      }
      setNewComment("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create comment",
        variant: "destructive",
      })
    }
  }

  async function handleEditComment(commentId: string, content: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/versions/${versionId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) throw new Error("Failed to edit comment")

      const updatedComment = await response.json()
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, ...updatedComment } : comment
        )
      )
      setEditingComment(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit comment",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/versions/${versionId}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to delete comment")

      setComments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  async function handleReaction(commentId: string, emoji: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/versions/${versionId}/comments/${commentId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        }
      )

      if (!response.ok) throw new Error("Failed to add reaction")

      const updatedComment = await response.json()
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, ...updatedComment } : comment
        )
      )
      setShowEmojiPicker(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  function renderComment(comment: ExtendedComment, isReply = false) {
    const isEditing = editingComment === comment.id
    const isOwner = comment.createdById === session?.user?.id

    return (
      <div
        key={comment.id}
        className={`space-y-2 ${isReply ? "ml-12" : "border-b pb-4"}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <Avatar>
              <AvatarImage src={comment.createdBy.image || ""} />
              <AvatarFallback>
                {comment.createdBy.name?.[0] || comment.createdBy.email[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{comment.createdBy.name}</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    defaultValue={comment.content}
                    className="min-h-[100px]"
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleEditComment(comment.id, newComment)
                      }
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingComment(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1">{comment.content}</p>
              )}
            </div>
          </div>

          {isOwner && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingComment(comment.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {!isEditing && (
          <div className="ml-12 space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(comment.id)}
              >
                <Smile className="h-4 w-4 mr-1" />
                React
              </Button>
            </div>

            {showEmojiPicker === comment.id && (
              <div className="absolute z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData: EmojiClickData) =>
                    handleReaction(comment.id, emojiData.emoji)
                  }
                />
              </div>
            )}

            {comment.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(
                  comment.reactions.reduce((acc, reaction) => {
                    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <Badge
                    key={emoji}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleReaction(comment.id, emoji)}
                  >
                    {emoji} {count}
                  </Badge>
                ))}
              </div>
            )}

            {replyTo === comment.id && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment(comment.id)}
                  >
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Comments...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          Discuss and collaborate on this version
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              ref={commentInputRef}
              placeholder="Write a comment..."
              className="min-h-[100px]"
            />
            <Button onClick={() => handleSubmitComment()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>

          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
