import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { exportNotifications, generateExportFilename } from "@/lib/notification-export"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { format = "csv", conditions, fields, includeMetadata, dateRange } = body

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return new NextResponse("Invalid format", { status: 400 })
    }

    // Export notifications
    const data = await exportNotifications(session.user.id, {
      format,
      conditions,
      fields,
      includeMetadata,
      dateRange,
    })

    // Set appropriate headers for file download
    const filename = generateExportFilename(format)
    const headers = new Headers()
    headers.set(
      "Content-Type",
      format === "csv" ? "text/csv" : "application/json"
    )
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    )

    return new NextResponse(data, {
      headers,
    })
  } catch (error) {
    console.error("Export failed:", error)
    return new NextResponse("Export failed", { status: 500 })
  }
}
