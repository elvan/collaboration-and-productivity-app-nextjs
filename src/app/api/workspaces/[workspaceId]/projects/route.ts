import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  folderId: z.string().optional(),
  teamId: z.string().optional(),
  visibility: z.enum(["private", "team", "public"]),
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
      include: {
        projects: {
          where: {
            folderId: null,
          },
          orderBy: {
            position: "desc",
          },
          take: 1,
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    const json = await req.json()
    const body = createProjectSchema.parse(json)

    // Get the highest position for projects in the same folder
    let position = 0
    if (body.folderId) {
      const lastProject = await prisma.project.findFirst({
        where: {
          workspaceId: params.workspaceId,
          folderId: body.folderId,
        },
        orderBy: {
          position: "desc",
        },
      })
      position = lastProject ? lastProject.position + 1000 : 0
    } else {
      position = workspace.projects[0]
        ? workspace.projects[0].position + 1000
        : 0
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        workspaceId: params.workspaceId,
        ownerId: session.user.id,
        folderId: body.folderId,
        teamId: body.teamId,
        position,
        // Create default task statuses
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
        // Create default task priorities
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
        // Add owner as project member with admin role
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        taskStatuses: true,
        taskPriorities: true,
        members: true,
      },
    })

    return NextResponse.json(project)
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

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        team: true,
        folder: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: [
        {
          folderId: "asc",
        },
        {
          position: "asc",
        },
      ],
    })

    return NextResponse.json(projects)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
