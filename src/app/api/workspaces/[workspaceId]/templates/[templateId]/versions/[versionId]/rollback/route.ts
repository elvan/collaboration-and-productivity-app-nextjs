import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { workspaceId: string; templateId: string; versionId: string }
  }
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

    // Get version to rollback to
    const version = await prisma.templateVersion.findUnique({
      where: {
        id: params.versionId,
        templateId: params.templateId,
      },
    })

    if (!version) {
      return new NextResponse("Version not found", { status: 404 })
    }

    // Get template
    const template = await prisma.folderTemplate.findUnique({
      where: {
        id: params.templateId,
        workspaceId: params.workspaceId,
      },
    })

    if (!template) {
      return new NextResponse("Template not found", { status: 404 })
    }

    // Create new version based on rollback
    const nextVersion = template.currentVersion + 1
    const newVersion = await prisma.templateVersion.create({
      data: {
        version: nextVersion,
        name: version.name,
        description: version.description,
        structure: version.structure,
        changelog: `Rolled back to version ${version.version}`,
        templateId: template.id,
        createdById: session.user.id,
      },
    })

    // Update template
    await prisma.folderTemplate.update({
      where: {
        id: template.id,
      },
      data: {
        currentVersion: nextVersion,
        name: version.name,
        description: version.description,
        structure: version.structure,
      },
    })

    // Track activity
    await ActivityTracker.track({
      type: "rollback_version",
      entityType: "template",
      entityId: template.id,
      entityName: template.name,
      details: {
        fromVersion: template.currentVersion,
        toVersion: version.version,
        newVersion: nextVersion,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(newVersion)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
