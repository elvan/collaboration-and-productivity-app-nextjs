import { prisma } from "@/lib/prisma"
import { z } from "zod"

const commentSchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  content: z.string(),
  parentId: z.string().optional(),
  metadata: z
    .object({
      mentions: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional(),
      reactions: z
        .record(z.string(), z.array(z.string()))
        .optional(), // emoji -> userId[]
      editHistory: z
        .array(
          z.object({
            content: z.string(),
            timestamp: z.date(),
            userId: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
})

export type TaskComment = z.infer<typeof commentSchema>

export async function createComment(data: TaskComment) {
  const mentions = data.metadata?.mentions || []
  const attachments = data.metadata?.attachments || []

  // Create the comment
  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      task: { connect: { id: data.taskId } },
      user: { connect: { id: data.userId } },
      parent: data.parentId
        ? { connect: { id: data.parentId } }
        : undefined,
    },
    include: {
      user: true,
      task: true,
    },
  })

  // Create activity for the comment
  await prisma.activity.create({
    data: {
      type: "comment_created",
      taskId: data.taskId,
      userId: data.userId,
      metadata: JSON.stringify({
        commentId: comment.id,
        content: data.content,
        mentions,
        attachments,
      }),
    },
  })

  // Create notifications for mentioned users
  if (mentions.length > 0) {
    await prisma.notification.createMany({
      data: mentions.map((userId) => ({
        type: "mention",
        userId,
        metadata: JSON.stringify({
          taskId: data.taskId,
          commentId: comment.id,
          mentionedBy: data.userId,
        }),
      })),
    })
  }

  return comment
}

export async function updateComment(
  id: string,
  data: Partial<TaskComment>
) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  // Store edit history
  const metadata = comment.metadata
    ? JSON.parse(comment.metadata as string)
    : {}
  const editHistory = metadata.editHistory || []
  editHistory.push({
    content: comment.content,
    timestamp: new Date(),
    userId: comment.userId,
  })
  metadata.editHistory = editHistory

  // Update the comment
  const updatedComment = await prisma.comment.update({
    where: { id },
    data: {
      content: data.content,
      metadata: JSON.stringify(metadata),
    },
    include: {
      user: true,
      task: true,
    },
  })

  // Create activity for the edit
  await prisma.activity.create({
    data: {
      type: "comment_edited",
      taskId: updatedComment.taskId,
      userId: updatedComment.userId,
      metadata: JSON.stringify({
        commentId: id,
        newContent: data.content,
      }),
    },
  })

  return updatedComment
}

export async function deleteComment(id: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { task: true },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  // Delete the comment
  await prisma.comment.delete({
    where: { id },
  })

  // Create activity for the deletion
  await prisma.activity.create({
    data: {
      type: "comment_deleted",
      taskId: comment.taskId,
      userId,
      metadata: JSON.stringify({
        commentId: id,
      }),
    },
  })
}

export async function getTaskComments(taskId: string) {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      user: true,
      parent: {
        include: {
          user: true,
        },
      },
      replies: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return comments.map((comment) => ({
    ...comment,
    metadata: comment.metadata
      ? JSON.parse(comment.metadata as string)
      : null,
  }))
}

export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  const metadata = comment.metadata
    ? JSON.parse(comment.metadata as string)
    : {}
  const reactions = metadata.reactions || {}
  const users = reactions[emoji] || []

  if (!users.includes(userId)) {
    reactions[emoji] = [...users, userId]
    metadata.reactions = reactions

    return prisma.comment.update({
      where: { id: commentId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    })
  }

  return comment
}

export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  const metadata = comment.metadata
    ? JSON.parse(comment.metadata as string)
    : {}
  const reactions = metadata.reactions || {}
  const users = reactions[emoji] || []

  reactions[emoji] = users.filter((id: string) => id !== userId)
  if (reactions[emoji].length === 0) {
    delete reactions[emoji]
  }
  metadata.reactions = reactions

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      metadata: JSON.stringify(metadata),
    },
  })
}

export async function getCommentThread(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: true,
      parent: {
        include: {
          user: true,
        },
      },
      replies: {
        include: {
          user: true,
          replies: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  return {
    ...comment,
    metadata: comment.metadata
      ? JSON.parse(comment.metadata as string)
      : null,
  }
}

export async function getCommentsByMention(userId: string) {
  const comments = await prisma.comment.findMany({
    where: {
      metadata: {
        path: ["mentions"],
        array_contains: userId,
      },
    },
    include: {
      user: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return comments.map((comment) => ({
    ...comment,
    metadata: comment.metadata
      ? JSON.parse(comment.metadata as string)
      : null,
  }))
}
