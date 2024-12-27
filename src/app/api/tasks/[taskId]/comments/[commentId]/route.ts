import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import {
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
} from "@/lib/tasks/comment-service"

const updateCommentSchema = z.object({
  content: z.string(),
})

const reactionSchema = z.object({
  emoji: z.string(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = updateCommentSchema.parse(json)

    const comment = await updateComment(params.commentId, {
      ...body,
      taskId: params.taskId,
      userId: session.user.id,
    })

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await deleteComment(params.commentId, session.user.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = reactionSchema.parse(json)

    const comment = await addReaction(
      params.commentId,
      session.user.id,
      body.emoji
    )

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = reactionSchema.parse(json)

    const comment = await removeReaction(
      params.commentId,
      session.user.id,
      body.emoji
    )

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
