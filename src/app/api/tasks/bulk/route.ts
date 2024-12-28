import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { prisma } from "@/lib/prisma"
import { getTaskRealtimeService } from "@/lib/realtime/task-updates"

const bulkActionSchema = z.object({
  action: z.enum(["update", "delete", "move"]),
  taskIds: z.array(z.string()),
  data: z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
    listId: z.string().optional(),
  }).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { action, taskIds, data } = bulkActionSchema.parse(json)

    switch (action) {
      case "update":
        if (!data) {
          return new NextResponse("Data required for update action", { status: 400 })
        }

        const updatedTasks = await prisma.$transaction(
          taskIds.map((id) =>
            prisma.task.update({
              where: { id },
              data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
              },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            })
          )
        )

        // Emit real-time updates
        const realtimeService = getTaskRealtimeService()
        updatedTasks.forEach((task) => {
          realtimeService?.emitTaskUpdated(task.projectId, task)
        })

        return NextResponse.json(updatedTasks)

      case "delete":
        await prisma.$transaction(
          taskIds.map((id) =>
            prisma.task.delete({
              where: { id },
            })
          )
        )

        return NextResponse.json({ message: "Tasks deleted successfully" })

      case "move":
        if (!data?.listId) {
          return new NextResponse("List ID required for move action", { status: 400 })
        }

        const movedTasks = await prisma.$transaction(
          taskIds.map((id) =>
            prisma.task.update({
              where: { id },
              data: {
                listId: data.listId,
              },
            })
          )
        )

        return NextResponse.json(movedTasks)

      default:
        return new NextResponse("Invalid action", { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
