import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const reactionSchema = z.object({
  emoji: z.string().min(1),
})

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      workspaceId: string
      templateId: string
      versionId: string
      commentId: string
    }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = reactionSchema.parse(json)

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            status: "active",
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Check if reaction already exists
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_createdById_emoji: {
          commentId: params.commentId,
          createdById: session.user.id,
          emoji: body.emoji,
        },
      },
    })

    if (existingReaction) {
      // Remove reaction if it exists
      await prisma.commentReaction.delete({
        where: {
          id: existingReaction.id,
        },
      })
    } else {
      // Add reaction if it doesn't exist
      await prisma.commentReaction.create({
        data: {
          emoji: body.emoji,
          commentId: params.commentId,
          createdById: session.user.id,
        },
      })

      // Track activity
      await ActivityTracker.track({
        type: "add_reaction",
        entityType: "comment",
        entityId: params.commentId,
        details: {
          emoji: body.emoji,
        },
        workspaceId: params.workspaceId,
        userId: session.user.id,
      })
    }

    // Get updated comment
    const updatedComment = await prisma.versionComment.findUnique({
      where: {
        id: params.commentId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: true,
        reactions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
