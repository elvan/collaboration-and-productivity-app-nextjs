import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
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

    // Get share notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          {
            type: "share_received",
            recipientId: session.user.id,
            workspace: {
              id: params.workspaceId,
            },
          },
          {
            type: {
              in: ["share_accepted", "share_rejected", "share_revoked"],
            },
            senderId: session.user.id,
            workspace: {
              id: params.workspaceId,
            },
          },
        ],
      },
      include: {
        sender: {
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

    // Transform notifications to include item details
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        const itemDetails = await getItemDetails(notification.entityId, notification.entityType)
        return {
          ...notification,
          item: itemDetails,
        }
      })
    )

    return NextResponse.json(notificationsWithDetails)
  } catch (error) {
    console.error("Failed to get notifications:", error)
    return new NextResponse(null, { status: 500 })
  }
}

async function getItemDetails(entityId: string, entityType: string) {
  switch (entityType) {
    case "project":
      const project = await prisma.project.findUnique({
        where: { id: entityId },
        select: { id: true, name: true },
      })
      return project ? { ...project, type: "project" } : null

    case "folder":
      const folder = await prisma.folder.findUnique({
        where: { id: entityId },
        select: { id: true, name: true },
      })
      return folder ? { ...folder, type: "folder" } : null

    case "template":
      const template = await prisma.folderTemplate.findUnique({
        where: { id: entityId },
        select: { id: true, name: true },
      })
      return template ? { ...template, type: "template" } : null

    default:
      return null
  }
}
