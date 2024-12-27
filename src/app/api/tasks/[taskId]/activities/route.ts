import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import {
  createActivity,
  getTaskActivities,
  getActivityStats,
} from "@/lib/tasks/activity-service"

const createActivitySchema = z.object({
  type: z.enum([
    "task_created",
    "task_updated",
    "task_deleted",
    "status_changed",
    "priority_changed",
    "assignee_changed",
    "due_date_changed",
    "progress_updated",
    "comment_created",
    "comment_edited",
    "comment_deleted",
    "attachment_added",
    "attachment_removed",
    "dependency_added",
    "dependency_removed",
    "subtask_added",
    "subtask_removed",
    "custom_field_updated",
    "workflow_triggered",
    "automation_executed",
  ]),
  metadata: z
    .object({
      previousValue: z.any().optional(),
      newValue: z.any().optional(),
      commentId: z.string().optional(),
      attachmentId: z.string().optional(),
      dependencyId: z.string().optional(),
      customFieldId: z.string().optional(),
      workflowId: z.string().optional(),
      automationId: z.string().optional(),
      description: z.string().optional(),
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
    const body = createActivitySchema.parse(json)

    const activity = await createActivity({
      ...body,
      taskId: params.taskId,
      userId: session.user.id,
    })

    return NextResponse.json(activity)
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

    const { searchParams } = new URL(req.url)
    const includeStats = searchParams.get("includeStats") === "true"

    const [activities, stats] = await Promise.all([
      getTaskActivities(params.taskId),
      includeStats ? getActivityStats(params.taskId) : null,
    ])

    return NextResponse.json({
      activities,
      ...(includeStats && { stats }),
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
