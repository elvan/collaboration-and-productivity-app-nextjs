import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; tagId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check workspace access
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

    // Delete tag
    await prisma.tag.delete({
      where: {
        id: params.tagId,
        workspaceId: params.workspaceId,
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; tagId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { projectId, folderId, action } = json

    // Check workspace access
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

    if (projectId) {
      if (action === "add") {
        await prisma.project.update({
          where: {
            id: projectId,
            workspaceId: params.workspaceId,
          },
          data: {
            tags: {
              connect: {
                id: params.tagId,
              },
            },
          },
        })
      } else {
        await prisma.project.update({
          where: {
            id: projectId,
            workspaceId: params.workspaceId,
          },
          data: {
            tags: {
              disconnect: {
                id: params.tagId,
              },
            },
          },
        })
      }
    }

    if (folderId) {
      if (action === "add") {
        await prisma.projectFolder.update({
          where: {
            id: folderId,
            workspaceId: params.workspaceId,
          },
          data: {
            tags: {
              connect: {
                id: params.tagId,
              },
            },
          },
        })
      } else {
        await prisma.projectFolder.update({
          where: {
            id: folderId,
            workspaceId: params.workspaceId,
          },
          data: {
            tags: {
              disconnect: {
                id: params.tagId,
              },
            },
          },
        })
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
