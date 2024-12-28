import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const workspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const body = workspaceSchema.parse(json)

    const workspace = await prisma.workspace.create({
      data: {
        name: body.name,
        description: body.description,
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

    return NextResponse.json(workspace, { status: 201 })
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
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
            teams: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
