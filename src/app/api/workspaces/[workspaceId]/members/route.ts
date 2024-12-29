import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { WorkspaceService } from "@/services/workspace.service"

const memberSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string(),
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
      include: {
        WorkspaceRole: true
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found or unauthorized" },
        { status: 404 }
      )
    }

    const json = await req.json()
    const body = memberSchema.parse(json)

    try {
      const member = await WorkspaceService.inviteMember({
        workspaceId: params.workspaceId,
        email: body.email,
        roleId: body.roleId
      })

      return NextResponse.json(member, { status: 201 })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 400 })
      }
      throw error
    }
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

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: params.workspaceId,
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
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { userId, roleId } = z.object({
      userId: z.string(),
      roleId: z.string()
    }).parse(json)

    const member = await WorkspaceService.updateMemberRole(
      params.workspaceId,
      userId,
      roleId
    )

    return NextResponse.json(member)
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

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
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

    // Prevent removing the last admin
    const admins = await prisma.workspaceMember.count({
      where: {
        workspaceId: params.workspaceId,
        role: {
          name: 'Admin'
        }
      }
    })

    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId
        }
      },
      include: {
        role: true
      }
    })

    if (memberToRemove?.role.name === 'Admin' && admins <= 1) {
      return NextResponse.json(
        { message: "Cannot remove the last admin" },
        { status: 400 }
      )
    }

    await WorkspaceService.removeMember(params.workspaceId, userId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
