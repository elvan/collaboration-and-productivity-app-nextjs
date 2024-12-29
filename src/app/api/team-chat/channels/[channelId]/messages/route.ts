import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { pusherServer } from "@/lib/pusher"

export async function GET(
  request: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
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
  request: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    const message = await prisma.message.create({
      data: {
        content,
        channelId: params.channelId,
        userId: session.user.id,
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
