import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  icon: z.string().min(1),
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
    const body = categorySchema.parse(json)

    // Get max order
    const maxOrder = await prisma.templateCategory.aggregate({
      where: {
        workspaceId: params.workspaceId,
      },
      _max: {
        order: true,
      },
    })

    // Create category
    const category = await prisma.templateCategory.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        icon: body.icon,
        order: (maxOrder._max.order || 0) + 1,
        workspaceId: params.workspaceId,
      },
      include: {
        templates: true,
      },
    })

    return NextResponse.json(category)
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

    const categories = await prisma.templateCategory.findMany({
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
      include: {
        templates: true,
      },
      orderBy: {
        order: "asc",
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { categories } = json

    // Update category orders
    await prisma.$transaction(
      categories.map((category: { id: string; order: number }) =>
        prisma.templateCategory.update({
          where: {
            id: category.id,
            workspaceId: params.workspaceId,
          },
          data: {
            order: category.order,
          },
        })
      )
    )

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
