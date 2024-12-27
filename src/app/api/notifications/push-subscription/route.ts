import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { saveSubscription, removeSubscription } from "@/lib/web-push"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const subscription = await req.json()
    await saveSubscription(session.user.id, subscription)

    return new NextResponse("Subscription saved", { status: 200 })
  } catch (error) {
    console.error("Failed to save push subscription:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { endpoint } = await req.json()
    await removeSubscription(endpoint)

    return new NextResponse("Subscription removed", { status: 200 })
  } catch (error) {
    console.error("Failed to remove push subscription:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
