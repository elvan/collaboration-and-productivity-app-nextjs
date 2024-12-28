import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const preferences = await prisma.userPreference.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("[PREFERENCES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { theme, emailNotifications, pushNotifications, taskReminders, language, timezone } = body

    const preferences = await prisma.userPreference.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        theme,
        emailNotifications,
        pushNotifications,
        taskReminders,
        language,
        timezone,
      },
      create: {
        userId: session.user.id,
        theme,
        emailNotifications,
        pushNotifications,
        taskReminders,
        language,
        timezone,
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "UPDATED",
        userId: session.user.id,
        entityType: "USER_PREFERENCES",
        entityId: session.user.id,
        metadata: {
          action: "PREFERENCES_UPDATE",
          changes: body,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("[PREFERENCES_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
