import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  description: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            status: "active",
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    const json = await req.json()
    const body = tagSchema.parse(json)

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        color: body.color,
        description: body.description,
        workspaceId: params.workspaceId,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      where: {
        workspaceId: params.workspaceId,
        workspace: {
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
