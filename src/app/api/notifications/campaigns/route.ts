import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  createCampaign,
  updateCampaign,
  getCampaign,
  getCampaigns,
} from "@/lib/campaigns"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const campaign = await createCampaign({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Failed to create campaign:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create campaign",
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || undefined

    const campaigns = await getCampaigns(status)
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Failed to get campaigns:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to get campaigns",
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
    const id = searchParams.get("id")
    if (!id) {
      return new NextResponse("Campaign ID is required", { status: 400 })
    }

    const body = await req.json()
    const campaign = await updateCampaign(id, body)

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Failed to update campaign:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update campaign",
      { status: 500 }
    )
  }
}
