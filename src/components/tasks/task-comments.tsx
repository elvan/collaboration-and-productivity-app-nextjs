import { useState } from "react"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MessageSquare, Reply, Trash2 } from "lucide-react"

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  replies?: Comment[]
}

interface TaskCommentsProps {
  taskId: string
  comments: Comment[]
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
}

export function TaskComments({
  taskId,
  comments,
  onAddComment,
  onDeleteComment,
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsLoading(true)
      await onAddComment(newComment)
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      setIsLoading(true)
      await onAddComment(replyContent, parentId)
      setReplyContent("")
      setReplyTo(null)
    } catch (error) {
      console.error("Failed to add reply:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsLoading(true)
      await onDeleteComment(commentId)
    } catch (error) {
      console.error("Failed to delete comment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`relative space-y-2 ${
        isReply ? "ml-12 before:absolute before:left-[-20px] before:top-4 before:h-px before:w-4 before:bg-border" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.image || ""} alt={comment.author.name} />
          <AvatarFallback>
            {comment.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{comment.author.name}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The comment and all its replies will
                    be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm">{comment.content}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              disabled={isLoading}
            >
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </Button>
          </div>
          {replyTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px]"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent("")
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={isLoading || !replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          Discuss this task with your team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={isLoading || !newComment.trim()}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8" />
                    <span>No comments yet</span>
                  </div>
                </div>
              ) : (
                comments.map((comment) => renderComment(comment))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
