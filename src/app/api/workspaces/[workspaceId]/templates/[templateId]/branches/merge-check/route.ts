import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const mergeCheckSchema = z.object({
  sourceBranch: z.string(),
  targetBranch: z.string(),
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
    const body = mergeCheckSchema.parse(json)

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

    // Get latest versions from both branches
    const [sourceVersion, targetVersion] = await Promise.all([
      prisma.templateVersion.findFirst({
        where: {
          branchId: body.sourceBranch,
        },
        orderBy: {
          version: "desc",
        },
      }),
      prisma.templateVersion.findFirst({
        where: {
          branchId: body.targetBranch,
        },
        orderBy: {
          version: "desc",
        },
      }),
    ])

    if (!sourceVersion || !targetVersion) {
      return new NextResponse("Versions not found", { status: 404 })
    }

    // Check for conflicts
    const conflicts = checkForConflicts(
      sourceVersion.structure,
      targetVersion.structure
    )

    return NextResponse.json({ conflicts })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

function checkForConflicts(sourceStructure: any, targetStructure: any) {
  const conflicts: any[] = []

  // Compare structures and identify conflicts
  function compareObjects(source: any, target: any, path: string[] = []) {
    if (typeof source !== typeof target) {
      conflicts.push({
        path: path.join("."),
        type: "type_mismatch",
        source: source,
        target: target,
      })
      return
    }

    if (Array.isArray(source)) {
      if (!Array.isArray(target)) {
        conflicts.push({
          path: path.join("."),
          type: "type_mismatch",
          source: source,
          target: target,
        })
        return
      }

      // Compare array items
      source.forEach((item, index) => {
        if (index < target.length) {
          compareObjects(item, target[index], [...path, index.toString()])
        } else {
          conflicts.push({
            path: [...path, index.toString()].join("."),
            type: "missing_in_target",
            source: item,
          })
        }
      })

      if (target.length > source.length) {
        for (let i = source.length; i < target.length; i++) {
          conflicts.push({
            path: [...path, i.toString()].join("."),
            type: "missing_in_source",
            target: target[i],
          })
        }
      }
    } else if (typeof source === "object" && source !== null) {
      const sourceKeys = Object.keys(source)
      const targetKeys = Object.keys(target)

      // Check for missing keys
      sourceKeys.forEach((key) => {
        if (!(key in target)) {
          conflicts.push({
            path: [...path, key].join("."),
            type: "missing_in_target",
            source: source[key],
          })
        } else {
          compareObjects(source[key], target[key], [...path, key])
        }
      })

      targetKeys.forEach((key) => {
        if (!(key in source)) {
          conflicts.push({
            path: [...path, key].join("."),
            type: "missing_in_source",
            target: target[key],
          })
        }
      })
    } else if (source !== target) {
      conflicts.push({
        path: path.join("."),
        type: "value_mismatch",
        source: source,
        target: target,
      })
    }
  }

  compareObjects(sourceStructure, targetStructure)
  return conflicts.length > 0 ? conflicts : null
}
