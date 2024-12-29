import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface TagNode {
  id: string
  name: string
  color: string
  parentId: string | null
  children: TagNode[]
  itemCount: number
  order: number
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

    // Get all tags for the workspace
    const tags = await prisma.tag.findMany({
      where: {
        workspaceId: params.workspaceId,
      },
      include: {
        _count: {
          select: {
            projects: true,
            folders: true,
            templates: true,
          },
        },
      },
      orderBy: [
        {
          parentId: "asc",
        },
        {
          order: "asc",
        },
      ],
    })

    // Build tag hierarchy
    const tagMap = new Map<string, TagNode>()
    const rootTags: TagNode[] = []

    // First pass: Create tag nodes
    tags.forEach((tag) => {
      tagMap.set(tag.id, {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        parentId: tag.parentId,
        children: [],
        itemCount:
          tag._count.projects + tag._count.folders + tag._count.templates,
        order: tag.order,
      })
    })

    // Second pass: Build hierarchy
    tags.forEach((tag) => {
      const tagNode = tagMap.get(tag.id)!
      if (tag.parentId) {
        const parentNode = tagMap.get(tag.parentId)
        if (parentNode) {
          parentNode.children.push(tagNode)
        }
      } else {
        rootTags.push(tagNode)
      }
    })

    // Sort children recursively
    function sortChildren(tags: TagNode[]) {
      tags.sort((a, b) => a.order - b.order)
      tags.forEach((tag) => {
        if (tag.children.length > 0) {
          sortChildren(tag.children)
        }
      })
    }

    sortChildren(rootTags)

    return NextResponse.json(rootTags)
  } catch (error) {
    console.error("Failed to get tag hierarchy:", error)
    return new NextResponse(null, { status: 500 })
  }
}
