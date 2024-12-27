import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  getPreferences,
  createPreference,
  updatePreference,
  deletePreference,
} from "@/lib/notification-preferences"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const preferences = await getPreferences(session.user.id)
    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Failed to get preferences:", error)
    return new NextResponse("Failed to get preferences", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const preference = await createPreference({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(preference)
  } catch (error) {
    console.error("Failed to create preference:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create preference",
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

    const { searchParams } = new URL(req.url)
    const channel = searchParams.get("channel")
    const type = searchParams.get("type")

    if (!channel || !type) {
      return new NextResponse("Missing channel or type", { status: 400 })
    }

    const body = await req.json()
    const preference = await updatePreference(
      session.user.id,
      channel,
      type,
      body
    )

    return NextResponse.json(preference)
  } catch (error) {
    console.error("Failed to update preference:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update preference",
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channel = searchParams.get("channel")
    const type = searchParams.get("type")

    if (!channel || !type) {
      return new NextResponse("Missing channel or type", { status: 400 })
    }

    await deletePreference(session.user.id, channel, type)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete preference:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to delete preference",
      { status: 500 }
    )
  }
}
