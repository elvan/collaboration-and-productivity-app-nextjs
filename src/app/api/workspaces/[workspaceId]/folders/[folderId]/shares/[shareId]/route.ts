import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updateSchema = z.object({
  role: z.enum(["viewer", "editor", "admin"]),
})

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: { workspaceId: string; folderId: string; shareId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has access to modify shares
    const folder = await prisma.projectFolder.findFirst({
      where: {
        id: params.folderId,
        workspaceId: params.workspaceId,
        OR: [
          {
            workspace: {
              workspaceMembers: {
                some: {
                  userId: session.user.id,
                  status: "active",
                },
              },
            },
          },
          {
            shares: {
              some: {
                userId: session.user.id,
                role: "admin",
              },
            },
          },
        ],
      },
    })

    if (!folder) {
      return new NextResponse("Not found", { status: 404 })
    }

    const json = await req.json()
    const body = updateSchema.parse(json)

    // Update share
    const share = await prisma.folderShare.update({
      where: {
        id: params.shareId,
        folderId: params.folderId,
      },
      data: {
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

    return NextResponse.json(share)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: { params: { workspaceId: string; folderId: string; shareId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has access to modify shares
    const folder = await prisma.projectFolder.findFirst({
      where: {
        id: params.folderId,
        workspaceId: params.workspaceId,
        OR: [
          {
            workspace: {
              workspaceMembers: {
                some: {
                  userId: session.user.id,
                  status: "active",
                },
              },
            },
          },
          {
            shares: {
              some: {
                userId: session.user.id,
                role: "admin",
              },
            },
          },
        ],
      },
    })

    if (!folder) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Delete share
    await prisma.folderShare.delete({
      where: {
        id: params.shareId,
        folderId: params.folderId,
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
