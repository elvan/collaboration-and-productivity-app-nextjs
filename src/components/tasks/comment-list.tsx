import { useState } from "react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    image?: string | null
  }
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
  replies?: Comment[]
}

interface CommentListProps {
  comments: Comment[]
  taskId: string
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onEditComment: (id: string, content: string) => Promise<void>
  onDeleteComment: (id: string) => Promise<void>
  onAddReaction: (id: string, emoji: string) => Promise<void>
  onRemoveReaction: (id: string, emoji: string) => Promise<void>
}

export function CommentList({
  comments,
  taskId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  onRemoveReaction,
}: CommentListProps) {
  const { data: session } = useSession()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [editContent, setEditContent] = useState("")

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim()) return

    await onAddComment(newComment, parentId)
    setNewComment("")
    setReplyingTo(null)
  }

  const handleSubmitEdit = async (id: string) => {
    if (!editContent.trim()) return

    await onEditComment(id, editContent)
    setEditing(null)
    setEditContent("")
  }

  const handleStartEdit = (comment: Comment) => {
    setEditing(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditing(null)
    setEditContent("")
  }

  const commonEmojis = ["👍", "❤️", "😄", "🎉", "🤔", "👀"]

  const CommentComponent = ({
    comment,
    isReply = false,
  }: {
    comment: Comment
    isReply?: boolean
  }) => {
    const isAuthor = session?.user?.id === comment.user.id
    const reactions = comment.metadata?.reactions || {}
    const hasEditHistory = (comment.metadata?.editHistory?.length || 0) > 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("mb-4", isReply && "ml-12")}
      >
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.user.image || ""} />
              <AvatarFallback>
                {comment.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{comment.user.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {hasEditHistory && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (edited)
                    </span>
                  )}
                </div>
                {isAuthor && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(comment)}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Icons.trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {editing === comment.id ? (
                <div className="mt-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitEdit(comment.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(reactions).map(([emoji, users]) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "space-x-1",
                      users.includes(session?.user?.id || "") &&
                        "bg-primary/10"
                    )}
                    onClick={() =>
                      users.includes(session?.user?.id || "")
                        ? onRemoveReaction(comment.id, emoji)
                        : onAddReaction(comment.id, emoji)
                    }
                  >
                    <span>{emoji}</span>
                    <span>{users.length}</span>
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  Reply
                </Button>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-4">
                  <Textarea
                    placeholder="Write a reply..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(comment.id)}
                    >
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                {commonEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddReaction(comment.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4">
                  {comment.replies.map((reply) => (
                    <CommentComponent
                      key={reply.id}
                      comment={reply}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <Button
          className="mt-2"
          onClick={() => handleSubmitComment()}
        >
          Add Comment
        </Button>
      </div>

      <AnimatePresence>
        {comments.map((comment) => (
          <CommentComponent key={comment.id} comment={comment} />
        ))}
      </AnimatePresence>
    </div>
  )
}
