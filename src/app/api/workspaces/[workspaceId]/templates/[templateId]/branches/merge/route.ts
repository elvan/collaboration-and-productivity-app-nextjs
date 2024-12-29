import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const mergeSchema = z.object({
  sourceBranch: z.string(),
  targetBranch: z.string(),
  resolution: z.any().optional(),
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

    const json = await req.json()
    const body = mergeSchema.parse(json)

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

    // Perform merge
    const result = await prisma.$transaction(async (tx) => {
      // Get latest versions from both branches
      const [sourceVersion, targetVersion] = await Promise.all([
        tx.templateVersion.findFirst({
          where: {
            branchId: body.sourceBranch,
          },
          orderBy: {
            version: "desc",
          },
        }),
        tx.templateVersion.findFirst({
          where: {
            branchId: body.targetBranch,
          },
          orderBy: {
            version: "desc",
          },
        }),
      ])

      if (!sourceVersion || !targetVersion) {
        throw new Error("Versions not found")
      }

      // Create merge record
      const merge = await tx.branchMerge.create({
        data: {
          sourceBranchId: body.sourceBranch,
          targetBranchId: body.targetBranch,
          mergedById: session.user.id,
          conflicts: body.resolution,
        },
      })

      // Create new version in target branch
      const mergedStructure = body.resolution
        ? applyResolution(sourceVersion.structure, targetVersion.structure, body.resolution)
        : { ...targetVersion.structure, ...sourceVersion.structure }

      const newVersion = await tx.templateVersion.create({
        data: {
          name: `Merge from ${sourceVersion.name}`,
          description: `Merged changes from branch ${body.sourceBranch}`,
          structure: mergedStructure,
          version: targetVersion.version + 1,
          branchId: body.targetBranch,
          createdById: session.user.id,
        },
      })

      return { merge, newVersion }
    })

    // Track activity
    await ActivityTracker.track({
      type: "merge_branch",
      entityType: "template",
      entityId: params.templateId,
      details: {
        sourceBranch: body.sourceBranch,
        targetBranch: body.targetBranch,
        resolution: body.resolution,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Failed to merge branches:", error)
    return new NextResponse(null, { status: 500 })
  }
}

function applyResolution(sourceStructure: any, targetStructure: any, resolution: any[]) {
  const result = JSON.parse(JSON.stringify(targetStructure))

  resolution.forEach((conflict) => {
    const pathParts = conflict.path.split(".")
    let current = result

    // Navigate to the parent of the conflict
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!(pathParts[i] in current)) {
        current[pathParts[i]] = {}
      }
      current = current[pathParts[i]]
    }

    const lastPart = pathParts[pathParts.length - 1]

    switch (conflict.type) {
      case "missing_in_target":
        current[lastPart] = conflict.source
        break
      case "missing_in_source":
        current[lastPart] = conflict.target
        break
      case "value_mismatch":
      case "type_mismatch":
        current[lastPart] = conflict.resolution || conflict.source
        break
    }
  })

  return result
}
