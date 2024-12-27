import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  trackEvent,
  getTemplatePerformance,
  getTemplateComparison,
  getTopPerformingTemplates,
  getTemplateInsights,
} from "@/lib/template-analytics"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { templateId, event, metadata } = body

    const analyticsEvent = await trackEvent(
      templateId,
      event,
      session.user.id,
      metadata
    )

    return NextResponse.json(analyticsEvent)
  } catch (error) {
    console.error("Failed to track event:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to track event",
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
    const templateId = searchParams.get("templateId")
    const type = searchParams.get("type") || "performance"
    const period = searchParams.get("period") || "daily"
    const metric = searchParams.get("metric") || "conversionRate"
    const limit = parseInt(searchParams.get("limit") || "10")
    const compareIds = searchParams.get("compareIds")?.split(",")
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date()

    let data

    switch (type) {
      case "performance":
        if (!templateId) {
          return new NextResponse("Template ID is required", {
            status: 400,
          })
        }
        data = await getTemplatePerformance(templateId, period, limit)
        break

      case "comparison":
        if (!compareIds) {
          return new NextResponse("Compare IDs are required", {
            status: 400,
          })
        }
        data = await getTemplateComparison(
          compareIds,
          period,
          startDate,
          endDate
        )
        break

      case "top":
        data = await getTopPerformingTemplates(period, metric as any, limit)
        break

      case "insights":
        if (!templateId) {
          return new NextResponse("Template ID is required", {
            status: 400,
          })
        }
        data = await getTemplateInsights(templateId)
        break

      default:
        return new NextResponse("Invalid analytics type", { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to get analytics:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to get analytics",
      { status: 500 }
    )
  }
}
