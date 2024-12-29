import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { WorkspaceService } from "@/services/workspace.service"

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string())
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

    // Check if user is workspace admin
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
            role: {
              name: 'Admin'
            }
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
    const body = roleSchema.parse(json)

    const role = await WorkspaceService.createWorkspaceRole({
      workspaceId: params.workspaceId,
      name: body.name,
      permissions: body.permissions
    })

    return NextResponse.json(role, { status: 201 })
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
            status: 'active'
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

    const roles = await WorkspaceService.getWorkspaceRoles(params.workspaceId)

    return NextResponse.json(roles)
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
