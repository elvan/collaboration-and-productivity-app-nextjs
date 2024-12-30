import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { channelId, event } = await req.json()

    const eventName = event === "typing" ? "user_typing" : "user_stopped_typing"
    
    await pusherServer.trigger(
      `channel-${channelId}`,
      eventName,
      {
        userId: session.user.id,
        userName: session.user.name,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to handle typing event:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
