import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
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

    const json = await req.json()
    const body = reorderSchema.parse(json)

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

    // Verify all tags belong to the workspace
    const tags = await prisma.tag.findMany({
      where: {
        id: {
          in: body.items.map((item) => item.id),
        },
        workspaceId: params.workspaceId,
      },
    })

    if (tags.length !== body.items.length) {
      return new NextResponse("Invalid tag ids", { status: 400 })
    }

    // Update tag orders in a transaction
    const updates = await prisma.$transaction(
      body.items.map((item) =>
        prisma.tag.update({
          where: {
            id: item.id,
          },
          data: {
            order: item.order,
          },
        })
      )
    )

    return NextResponse.json(updates)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Failed to reorder tags:", error)
    return new NextResponse(null, { status: 500 })
  }
}
