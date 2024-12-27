import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const preferencesSchema = z.object({
  emailEnabled: z.boolean(),
  memberActivity: z.boolean(),
  taskActivity: z.boolean(),
  mentions: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyDigest: z.boolean(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const json = await req.json()
    const body = preferencesSchema.parse(json)

    const preferences = await prisma.notificationPreference.create({
      data: {
        ...body,
        user: { connect: { id: session.user.id } },
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const json = await req.json()
    const body = preferencesSchema.parse(json)

    const preferences = await prisma.notificationPreference.update({
      where: { userId: session.user.id },
      data: body,
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
