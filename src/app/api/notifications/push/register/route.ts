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

    // Save or update FCM token
    await prisma.pushSubscription.upsert({
      where: {
        token_userId: {
          token,
          userId: session.user.id,
        },
      },
      create: {
        token,
        userId: session.user.id,
      },
      update: {
        updatedAt: new Date(),
      },
    })

    return new NextResponse("Token registered successfully", { status: 200 })
  } catch (error) {
    console.error("Failed to register push token:", error)
    return new NextResponse("Failed to register token", { status: 500 })
  }
}
