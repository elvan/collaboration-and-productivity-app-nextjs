import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
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
        members: true,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(
      channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.isPrivate,
        unreadCount: channel._count.messages,
        members: channel.members,
      }))
    )
  } catch (error) {
    console.error("Failed to fetch channels:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, isPrivate } = await req.json()

    const channel = await prisma.channel.create({
      data: {
        name,
        isPrivate,
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Failed to create channel:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
