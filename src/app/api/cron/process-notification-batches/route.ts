import { NextResponse } from "next/server"
import { scheduleBatchProcessing } from "@/lib/notification-batching"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Process notification batches
    await scheduleBatchProcessing()

    return new NextResponse("Notification batches processed", { status: 200 })
  } catch (error) {
    console.error("Failed to process notification batches:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
