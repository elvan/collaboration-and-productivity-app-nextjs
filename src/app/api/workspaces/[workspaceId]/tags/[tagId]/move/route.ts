import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const moveSchema = z.object({
  parentId: z.string().nullable(),
})

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { workspaceId: string; tagId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = moveSchema.parse(json)

    // Check workspace access and tag ownership
    const tag = await prisma.tag.findFirst({
      where: {
        id: params.tagId,
        workspace: {
          id: params.workspaceId,
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
    })

    if (!tag) {
      return new NextResponse("Not found", { status: 404 })
    }

    // If moving to a new parent, verify the parent exists and is in the same workspace
    if (body.parentId) {
      const parentTag = await prisma.tag.findFirst({
        where: {
          id: body.parentId,
          workspaceId: params.workspaceId,
        },
      })

      if (!parentTag) {
        return new NextResponse("Parent tag not found", { status: 404 })
      }

      // Check for circular dependencies
      let currentParent = parentTag
      while (currentParent.parentId) {
        if (currentParent.parentId === params.tagId) {
          return new NextResponse(
            "Cannot move tag: would create circular dependency",
            { status: 400 }
          )
        }

        currentParent = await prisma.tag.findUniqueOrThrow({
          where: { id: currentParent.parentId },
        })
      }
    }

    // Get siblings at the new location to determine order
    const siblings = await prisma.tag.findMany({
      where: {
        workspaceId: params.workspaceId,
        parentId: body.parentId,
        id: {
          not: params.tagId,
        },
      },
      orderBy: {
        order: "desc",
      },
      take: 1,
    })

    const newOrder = siblings.length > 0 ? siblings[0].order + 1 : 0

    // Move the tag
    const updatedTag = await prisma.tag.update({
      where: {
        id: params.tagId,
      },
      data: {
        parentId: body.parentId,
        order: newOrder,
      },
      include: {
        parent: true,
      },
    })

    // Track activity
    await ActivityTracker.track({
      type: "move_tag",
      entityType: "tag",
      entityId: params.tagId,
      details: {
        oldParentId: tag.parentId,
        newParentId: body.parentId,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Failed to move tag:", error)
    return new NextResponse(null, { status: 500 })
  }
}
