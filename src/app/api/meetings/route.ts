import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")

    const whereClause = month
      ? {
          startTime: {
            gte: new Date(`${month}-01`),
            lt: new Date(
              new Date(`${month}-01`).setMonth(
                new Date(`${month}-01`).getMonth() + 1
              )
            ),
          },
        }
      : {}

    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          {
            attendees: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
        ...whereClause,
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Failed to fetch meetings:", error)
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
    const { title, description, date, startTime, endTime, attendees } = body

    // Combine date and time
    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        createdById: session.user.id,
        attendees: {
          create: [
            // Creator is automatically an accepted attendee
            {
              userId: session.user.id,
              status: "accepted",
            },
            // Other attendees start as pending
            ...attendees.map((userId: string) => ({
              userId,
              status: "pending",
            })),
          ],
        },
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Failed to create meeting:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
