import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const preferencesSchema = z.object({
  shareReceived: z.boolean(),
  shareAccepted: z.boolean(),
  shareRejected: z.boolean(),
  shareRevoked: z.boolean(),
  emailNotifications: z.boolean(),
})

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

    // Get user preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId,
        },
      },
    })

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        shareReceived: true,
        shareAccepted: true,
        shareRejected: true,
        shareRevoked: true,
        emailNotifications: true,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Failed to get notification preferences:", error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = preferencesSchema.parse(json)

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

    // Update preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId,
        },
      },
      update: body,
      create: {
        ...body,
        userId: session.user.id,
        workspaceId: params.workspaceId,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Failed to update notification preferences:", error)
    return new NextResponse(null, { status: 500 })
  }
}
