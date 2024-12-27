import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  createABTest,
  updateABTest,
  getABTest,
  getABTests,
  getABTestMetrics,
} from "@/lib/notification-ab-testing"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const test = await createABTest({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error("Failed to create A/B test:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create A/B test",
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

    const body = await req.json()
    const test = await updateABTest(body)

    return NextResponse.json(test)
  } catch (error) {
    console.error("Failed to update A/B test:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update A/B test",
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
    const id = searchParams.get("id")
    const status = searchParams.get("status")
    const metrics = searchParams.get("metrics")

    if (id) {
      if (metrics === "true") {
        const testMetrics = await getABTestMetrics(id)
        return NextResponse.json(testMetrics)
      }

      const test = await getABTest(id)
      if (!test) {
        return new NextResponse("Test not found", { status: 404 })
      }
      return NextResponse.json(test)
    }

    const tests = await getABTests(status || undefined)
    return NextResponse.json(tests)
  } catch (error) {
    console.error("Failed to get A/B tests:", error)
    return new NextResponse("Failed to get A/B tests", { status: 500 })
  }
}
