import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import {
  createComment,
  getTaskComments,
} from "@/lib/tasks/comment-service"

const createCommentSchema = z.object({
  content: z.string(),
  parentId: z.string().optional(),
  metadata: z
    .object({
      mentions: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional(),
    })
    .optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = createCommentSchema.parse(json)

    const comment = await createComment({
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

export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const comments = await getTaskComments(params.taskId)
    return NextResponse.json(comments)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
