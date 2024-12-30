import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: params.meetingId,
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
        messages: {
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
        },
      },
    })

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 })
    }

    // Check if user has access to the meeting
    const isAttendee = meeting.attendees.some(
      (attendee) => attendee.user.id === session.user.id
    )
    if (!isAttendee && meeting.createdById !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Failed to fetch meeting:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, status } = body

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: params.meetingId,
      },
      include: {
        attendees: true,
      },
    })

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 })
    }

    // Only creator can update meeting details
    if (meeting.createdById !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const updatedMeeting = await prisma.meeting.update({
      where: {
        id: params.meetingId,
      },
      data: {
        title,
        description,
        startTime,
        endTime,
        status,
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

    return NextResponse.json(updatedMeeting)
  } catch (error) {
    console.error("Failed to update meeting:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: params.meetingId,
      },
    })

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 })
    }

    // Only creator can delete meeting
    if (meeting.createdById !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.meeting.delete({
      where: {
        id: params.meetingId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete meeting:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
