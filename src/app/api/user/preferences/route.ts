import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updatePreferencesSchema = z.object({
  // UI Preferences
  theme: z.enum(["light", "dark", "system"]),
  accentColor: z.string(),
  fontSize: z.enum(["small", "medium", "large"]),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),

  // Localization
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(["12h", "24h"]),
  firstDayOfWeek: z.number().min(0).max(6),

  // Notification Settings
  notificationSound: z.boolean(),

  // Task Display
  defaultTaskView: z.enum(["list", "board", "calendar"]),
  taskSortOrder: z.string(),
  showCompletedTasks: z.boolean(),

  // Performance
  pageSize: z.number().min(10).max(100),
  autoSaveInterval: z.number().min(0).max(300),
})

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = updatePreferencesSchema.parse(json)

    const preferences = await prisma.userPreference.upsert({
      where: {
        userId: session.user.id,
      },
      update: body,
      create: {
        userId: session.user.id,
        ...body,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
