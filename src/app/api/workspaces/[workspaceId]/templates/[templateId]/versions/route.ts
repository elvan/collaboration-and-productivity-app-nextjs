import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const versionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  structure: z.any(),
  changelog: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; templateId: string } }
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
    const body = versionSchema.parse(json)

    // Get template and current version
    const template = await prisma.folderTemplate.findUnique({
      where: {
        id: params.templateId,
        workspaceId: params.workspaceId,
      },
      include: {
        versions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
        },
      },
    })

    if (!template) {
      return new NextResponse("Template not found", { status: 404 })
    }

    const nextVersion = template.currentVersion + 1

    // Create new version
    const version = await prisma.templateVersion.create({
      data: {
        version: nextVersion,
        name: body.name,
        description: body.description,
        structure: body.structure,
        changelog: body.changelog,
        templateId: template.id,
        createdById: session.user.id,
      },
    })

    // Update template current version
    await prisma.folderTemplate.update({
      where: {
        id: template.id,
      },
      data: {
        currentVersion: nextVersion,
        name: body.name,
        description: body.description,
        structure: body.structure,
      },
    })

    // Track activity
    await ActivityTracker.track({
      type: "create_version",
      entityType: "template",
      entityId: template.id,
      entityName: template.name,
      details: {
        version: nextVersion,
        changelog: body.changelog,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(version)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const versions = await prisma.templateVersion.findMany({
      where: {
        templateId: params.templateId,
        template: {
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
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        version: "desc",
      },
    })

    return NextResponse.json(versions)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
