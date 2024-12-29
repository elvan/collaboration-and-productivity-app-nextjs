import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const editCommentSchema = z.object({
  content: z.string().min(1),
})

export async function PATCH(
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
    const body = editCommentSchema.parse(json)

    // Check workspace access and comment ownership
    const comment = await prisma.versionComment.findFirst({
      where: {
        id: params.commentId,
        versionId: params.versionId,
        createdById: session.user.id,
        version: {
          templateId: params.templateId,
          template: {
            workspaceId: params.workspaceId,
            workspace: {
              workspaceMembers: {
                some: {
                  userId: session.user.id,
                  status: "active",
                },
              },
            },
          },
        },
      },
    })

    if (!comment) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Update comment
    const updatedComment = await prisma.versionComment.update({
      where: {
        id: params.commentId,
      },
      data: {
        content: body.content,
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

    // Track activity
    await ActivityTracker.track({
      type: "edit_comment",
      entityType: "template_version",
      entityId: params.versionId,
      details: {
        commentId: params.commentId,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
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

    // Check workspace access and comment ownership
    const comment = await prisma.versionComment.findFirst({
      where: {
        id: params.commentId,
        versionId: params.versionId,
        createdById: session.user.id,
        version: {
          templateId: params.templateId,
          template: {
            workspaceId: params.workspaceId,
            workspace: {
              workspaceMembers: {
                some: {
                  userId: session.user.id,
                  status: "active",
                },
              },
            },
          },
        },
      },
    })

    if (!comment) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Delete comment
    await prisma.versionComment.delete({
      where: {
        id: params.commentId,
      },
    })

    // Track activity
    await ActivityTracker.track({
      type: "delete_comment",
      entityType: "template_version",
      entityId: params.versionId,
      details: {
        commentId: params.commentId,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
