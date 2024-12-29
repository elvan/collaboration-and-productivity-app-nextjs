import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const template = await prisma.folderTemplate.findFirst({
      where: {
        id: params.templateId,
        workspaceId: params.workspaceId,
        workspace: {
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
    })

    if (!template) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.folderTemplate.delete({
      where: {
        id: params.templateId,
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const template = await prisma.folderTemplate.findFirst({
      where: {
        id: params.templateId,
        OR: [
          {
            workspaceId: params.workspaceId,
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
            isGlobal: true,
          },
        ],
      },
    })

    if (!template) {
      return new NextResponse("Not found", { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
