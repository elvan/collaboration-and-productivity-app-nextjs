import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createBulkAction, getBulkAction } from "@/lib/notification-bulk-actions"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { type, filter, notificationIds } = body

    if (!type) {
      return new NextResponse("Type is required", { status: 400 })
    }

    const action = await createBulkAction({
      userId: session.user.id,
      type,
      filter,
      notificationIds,
    })

    return NextResponse.json(action)
  } catch (error) {
    console.error("Failed to create bulk action:", error)
    return new NextResponse("Failed to create bulk action", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const actionId = searchParams.get("actionId")

    if (!actionId) {
      return new NextResponse("Action ID is required", { status: 400 })
    }

    const action = await getBulkAction(actionId)
    if (!action) {
      return new NextResponse("Action not found", { status: 404 })
    }

    if (action.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    return NextResponse.json(action)
  } catch (error) {
    console.error("Failed to get bulk action:", error)
    return new NextResponse("Failed to get bulk action", { status: 500 })
  }
}
