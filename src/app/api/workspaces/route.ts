import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { WorkspaceService } from "@/services/workspace.service"

const workspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
  theme: z.record(z.any()).optional(),
  logoUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const body = workspaceSchema.parse(json)

    const workspace = await WorkspaceService.createWorkspace({
      name: body.name,
      description: body.description,
      ownerId: session.user.id,
      settings: body.settings,
      theme: body.theme,
      logoUrl: body.logoUrl,
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

    const { searchParams } = new URL(req.url)
    const archived = searchParams.get('archived') === 'true'

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
            status: 'active',
          },
        },
        isArchived: archived,
      },
      include: {
        members: {
          where: {
            status: 'active',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            role: true,
          },
        },
        analytics: true,
        _count: {
          select: {
            projects: true,
            teams: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
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
