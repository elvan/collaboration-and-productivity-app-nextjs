import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: params.channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { content } = await req.json()

    // First verify the channel exists and user is a member
    const channel = await prisma.channel.findFirst({
      where: {
        id: params.channelId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!channel) {
      return new NextResponse("Channel not found or access denied", { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        channel: {
          connect: {
            id: params.channelId,
          },
        },
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Trigger real-time update
    await pusherServer.trigger(
      `channel-${params.channelId}`,
      "new_message",
      message
    )

    return NextResponse.json(message)
  } catch (error) {
    console.error("Failed to create message:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
