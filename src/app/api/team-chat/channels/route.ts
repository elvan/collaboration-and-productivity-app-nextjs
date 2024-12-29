import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            },
          },
        },
      },
    })

    const formattedChannels = channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.isPrivate,
      unreadCount: channel._count.messages,
    }))

    return NextResponse.json(formattedChannels)
  } catch (error) {
    console.error("Failed to fetch channels:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, isPrivate = false } = body

    const channel = await prisma.channel.create({
      data: {
        name,
        isPrivate,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    })

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Failed to create channel:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
