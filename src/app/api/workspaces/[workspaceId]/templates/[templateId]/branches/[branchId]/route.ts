import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: { workspaceId: string; templateId: string; branchId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check workspace access and branch ownership
    const branch = await prisma.templateBranch.findFirst({
      where: {
        id: params.branchId,
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
    })

    if (!branch) {
      return new NextResponse("Not found", { status: 404 })
    }

    if (branch.isDefault) {
      return new NextResponse("Cannot delete default branch", { status: 400 })
    }

    // Delete branch
    await prisma.templateBranch.delete({
      where: {
        id: params.branchId,
      },
    })

    // Track activity
    await ActivityTracker.track({
      type: "delete_branch",
      entityType: "template",
      entityId: params.templateId,
      details: {
        branchId: params.branchId,
        branchName: branch.name,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
