import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
  structure: z.object({}).passthrough(),
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
    const body = createTemplateSchema.parse(json)

    const template = await prisma.folderTemplate.create({
      data: {
        ...body,
        workspaceId: params.workspaceId,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(template)
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

    const templates = await prisma.folderTemplate.findMany({
      where: {
        OR: [
          {
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
          {
            isGlobal: true,
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
