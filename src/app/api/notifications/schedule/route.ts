import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  createSchedule,
  updateSchedule,
  processScheduledNotifications,
} from "@/lib/notification-scheduler"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const schedule = await createSchedule({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Failed to create schedule:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create schedule",
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { id, ...data } = body
    const schedule = await updateSchedule(id, data)

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Failed to update schedule:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update schedule",
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Process scheduled notifications
    await processScheduledNotifications()

    return new NextResponse("Processed scheduled notifications", {
      status: 200,
    })
  } catch (error) {
    console.error("Failed to process scheduled notifications:", error)
    return new NextResponse(
      "Failed to process scheduled notifications",
      { status: 500 }
    )
  }
}
