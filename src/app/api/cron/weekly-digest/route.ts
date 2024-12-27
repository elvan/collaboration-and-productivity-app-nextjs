import { NextResponse } from "next/server"
import { sendWeeklyDigest } from "@/lib/digest"

export const runtime = "edge"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: Request) {
  try {
    // Verify cron secret to ensure request is from Vercel
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await sendWeeklyDigest()
    return new NextResponse("Weekly digest sent successfully", { status: 200 })
  } catch (error) {
    console.error("Failed to send weekly digest:", error)
    return new NextResponse("Failed to send weekly digest", { status: 500 })
  }
}
