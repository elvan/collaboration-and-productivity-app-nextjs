import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updateSchema = z.object({
  status: z.enum(["read", "unread"]),
})

export async function PATCH(
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

    const json = await req.json()
    const body = updateSchema.parse(json)

    // Check workspace access and notification ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.notificationId,
        workspace: {
          id: params.workspaceId,
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
        OR: [
          { recipientId: session.user.id },
          { senderId: session.user.id },
        ],
      },
    })

    if (!notification) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Update notification status
    const updatedNotification = await prisma.notification.update({
      where: {
        id: params.notificationId,
      },
      data: {
        status: body.status,
      },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Failed to update notification:", error)
    return new NextResponse(null, { status: 500 })
  }
}
