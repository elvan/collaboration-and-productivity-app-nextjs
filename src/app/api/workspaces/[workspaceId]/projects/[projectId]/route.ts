import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  folderId: z.string().optional(),
  visibility: z.enum(["private", "team", "public"]),
  settings: z.object({
    features: z.object({
      timeTracking: z.boolean(),
      sprints: z.boolean(),
      customFields: z.boolean(),
      automations: z.boolean(),
    }),
    notifications: z.object({
      email: z.boolean(),
      desktop: z.boolean(),
      mobile: z.boolean(),
    }),
  }),
})

export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        workspaceId: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Not found", { status: 404 })
    }

    const json = await req.json()
    const body = updateProjectSchema.parse(json)

    const updatedProject = await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        name: body.name,
        description: body.description,
        folderId: body.folderId,
        visibility: body.visibility,
        settings: body.settings,
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        workspaceId: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        status: "ARCHIVED",
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
