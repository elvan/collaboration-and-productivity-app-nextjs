import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  projectId: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

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

    const json = await req.json()
    const body = createTemplateSchema.parse(json)

    let template
    if (body.projectId) {
      // Create template from existing project
      const project = await prisma.project.findFirst({
        where: {
          id: body.projectId,
          workspaceId: params.workspaceId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
        include: {
          taskStatuses: true,
          taskPriorities: true,
          settings: true,
        },
      })

      if (!project) {
        return new NextResponse("Project not found", { status: 404 })
      }

      template = await prisma.projectTemplate.create({
        data: {
          name: body.name,
          description: body.description,
          category: body.category,
          workspaceId: params.workspaceId,
          settings: project.settings,
          taskStatuses: {
            createMany: {
              data: project.taskStatuses.map(({ id, createdAt, updatedAt, projectId, ...status }) => status),
            },
          },
          taskPriorities: {
            createMany: {
              data: project.taskPriorities.map(({ id, createdAt, updatedAt, projectId, ...priority }) => priority),
            },
          },
        },
        include: {
          taskStatuses: true,
          taskPriorities: true,
        },
      })
    } else {
      // Create empty template
      template = await prisma.projectTemplate.create({
        data: {
          name: body.name,
          description: body.description,
          category: body.category,
          workspaceId: params.workspaceId,
          settings: {
            features: {
              timeTracking: false,
              sprints: false,
              customFields: false,
              automations: false,
            },
            notifications: {
              email: true,
              desktop: true,
              mobile: false,
            },
          },
          taskStatuses: {
            createMany: {
              data: [
                {
                  name: "To Do",
                  color: "gray",
                  position: 0,
                },
                {
                  name: "In Progress",
                  color: "blue",
                  position: 1000,
                },
                {
                  name: "Done",
                  color: "green",
                  position: 2000,
                },
              ],
            },
          },
          taskPriorities: {
            createMany: {
              data: [
                {
                  name: "Low",
                  color: "gray",
                  position: 0,
                },
                {
                  name: "Medium",
                  color: "yellow",
                  position: 1000,
                },
                {
                  name: "High",
                  color: "red",
                  position: 2000,
                },
              ],
            },
          },
        },
        include: {
          taskStatuses: true,
          taskPriorities: true,
        },
      })
    }

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const templates = await prisma.projectTemplate.findMany({
      where: {
        workspaceId: params.workspaceId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
