import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { token } = await req.json()
    if (!token) {
      return new NextResponse("Token is required", { status: 400 })
    }

    // Delete FCM token
    await prisma.pushSubscription.deleteMany({
      where: {
        token,
        userId: session.user.id,
      },
    })

    return new NextResponse("Token unregistered successfully", { status: 200 })
  } catch (error) {
    console.error("Failed to unregister push token:", error)
    return new NextResponse("Failed to unregister token", { status: 500 })
  }
}
