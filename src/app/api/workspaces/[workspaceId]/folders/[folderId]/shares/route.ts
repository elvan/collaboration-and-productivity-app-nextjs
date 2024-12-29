import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const shareSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["viewer", "editor", "admin"]),
})

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; folderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has access to the folder
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
    const body = shareSchema.parse(json)

    // Check if user exists and is a member of the workspace
    const user = await prisma.user.findFirst({
      where: {
        id: body.userId,
        workspaceMembers: {
          some: {
            workspaceId: params.workspaceId,
            status: "active",
          },
        },
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Create share
    const share = await prisma.folderShare.create({
      data: {
        folderId: params.folderId,
        userId: body.userId,
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

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; folderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const shares = await prisma.folderShare.findMany({
      where: {
        folderId: params.folderId,
        folder: {
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
                },
              },
            },
          ],
        },
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
        createdAt: "desc",
      },
    })

    return NextResponse.json(shares)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
