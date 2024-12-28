import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const memberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
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
            role: "admin",
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
    const body = memberSchema.parse(json)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { message: "User is already a member of this workspace" },
        { status: 409 }
      )
    }

    // Add member to workspace
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: params.workspaceId,
        userId: user.id,
        role: body.role,
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
      },
    })

    return NextResponse.json(member, { status: 201 })
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
      },
      orderBy: {
        joinedAt: "desc",
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
