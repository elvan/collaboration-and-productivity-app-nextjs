import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { workspaceId: string; notificationId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check workspace access and notification ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.notificationId,
        type: "share_received",
        status: "unread",
        recipientId: session.user.id,
        workspace: {
          id: params.workspaceId,
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
    })

    if (!notification) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Process share acceptance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update share status
      const share = await tx.share.update({
        where: {
          id: notification.entityId,
        },
        data: {
          status: "accepted",
        },
      })

      // Mark original notification as read
      await tx.notification.update({
        where: {
          id: params.notificationId,
        },
        data: {
          status: "read",
        },
      })

      // Create acceptance notification for sender
      const acceptanceNotification = await tx.notification.create({
        data: {
          type: "share_accepted",
          status: "unread",
          senderId: session.user.id,
          recipientId: notification.senderId,
          entityId: notification.entityId,
          entityType: notification.entityType,
          workspaceId: params.workspaceId,
        },
      })

      return { share, acceptanceNotification }
    })

    // Track activity
    await ActivityTracker.track({
      type: "accept_share",
      entityType: notification.entityType,
      entityId: notification.entityId,
      details: {
        notificationId: params.notificationId,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to accept share:", error)
    return new NextResponse(null, { status: 500 })
  }
}
