import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  unreadOnly: z.coerce.boolean().default(false),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const where = {
      userId: session.user.id,
      ...(query.unreadOnly && { read: false }),
    }

    // Get total count for pagination
    const total = await prisma.notification.count({ where })

    // Get paginated notifications
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        activity: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
