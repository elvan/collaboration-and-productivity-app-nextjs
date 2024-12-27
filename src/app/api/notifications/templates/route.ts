import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import {
  createTemplate,
  updateTemplate,
  getTemplate,
  getTemplates,
} from "@/lib/notification-templates"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const template = await createTemplate({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to create template:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create template",
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
    const template = await updateTemplate({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to update template:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update template",
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
    const type = searchParams.get("type")

    if (id) {
      const template = await getTemplate(id)
      if (!template) {
        return new NextResponse("Template not found", { status: 404 })
      }
      return NextResponse.json(template)
    }

    const templates = await getTemplates(type || undefined)
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to get templates:", error)
    return new NextResponse("Failed to get templates", { status: 500 })
  }
}
