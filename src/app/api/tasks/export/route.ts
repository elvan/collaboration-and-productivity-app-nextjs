import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Parser } from "json2csv"

const exportSchema = z.object({
  projectId: z.string(),
  format: z.enum(["csv", "json"]),
  fields: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { projectId, format, fields } = exportSchema.parse(json)

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Get tasks with related data
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        labels: true,
        customFields: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    // Transform tasks for export
    const exportData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : null,
      assignee: task.assignee?.name,
      assigneeEmail: task.assignee?.email,
      labels: task.labels.map((l) => l.name).join(", "),
      commentsCount: task._count.comments,
      attachmentsCount: task._count.attachments,
      createdAt: format(task.createdAt, "yyyy-MM-dd HH:mm:ss"),
      updatedAt: format(task.updatedAt, "yyyy-MM-dd HH:mm:ss"),
      ...task.customFields,
    }))

    // Filter fields if specified
    const filteredData = fields
      ? exportData.map((item) =>
          Object.fromEntries(
            Object.entries(item).filter(([key]) => fields.includes(key))
          )
        )
      : exportData

    if (format === "json") {
      return new NextResponse(JSON.stringify(filteredData), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="tasks-${projectId}-${format(
            new Date(),
            "yyyy-MM-dd"
          )}.json"`,
        },
      })
    }

    // Convert to CSV
    const parser = new Parser({
      fields: fields || Object.keys(filteredData[0] || {}),
    })
    const csv = parser.parse(filteredData)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tasks-${projectId}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
