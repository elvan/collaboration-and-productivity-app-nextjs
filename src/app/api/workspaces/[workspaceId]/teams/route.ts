import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is workspace member
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found or unauthorized" },
        { status: 404 }
      )
    }

    const json = await req.json()
    const body = teamSchema.parse(json)

    const team = await prisma.team.create({
      data: {
        name: body.name,
        description: body.description,
        workspaceId: params.workspaceId,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
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

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is workspace member
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found or unauthorized" },
        { status: 404 }
      )
    }

    const teams = await prisma.team.findMany({
      where: {
        workspaceId: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
