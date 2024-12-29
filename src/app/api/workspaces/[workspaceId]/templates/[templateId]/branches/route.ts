import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const branchSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sourceBranch: z.string().optional(),
})

export async function GET(
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

    // Get branches
    const branches = await prisma.templateBranch.findMany({
      where: {
        templateId: params.templateId,
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
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(branches)
  } catch (error) {
    console.error("Failed to get branches:", error)
    return new NextResponse(null, { status: 500 })
  }
}

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
    const body = branchSchema.parse(json)

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

    // Create branch
    const branch = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.templateBranch.create({
        data: {
          name: body.name,
          description: body.description,
          templateId: params.templateId,
          createdById: session.user.id,
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
          _count: {
            select: {
              versions: true,
            },
          },
        },
      })

      if (body.sourceBranch) {
        // Copy latest version from source branch
        const sourceVersion = await tx.templateVersion.findFirst({
          where: {
            branchId: body.sourceBranch,
          },
          orderBy: {
            version: "desc",
          },
        })

        if (sourceVersion) {
          await tx.templateVersion.create({
            data: {
              name: sourceVersion.name,
              description: sourceVersion.description,
              structure: sourceVersion.structure,
              version: 1,
              branchId: newBranch.id,
              createdById: session.user.id,
            },
          })
        }
      }

      return newBranch
    })

    // Track activity
    await ActivityTracker.track({
      type: "create_branch",
      entityType: "template",
      entityId: params.templateId,
      details: {
        branchId: branch.id,
        branchName: branch.name,
        sourceBranch: body.sourceBranch,
      },
      workspaceId: params.workspaceId,
      userId: session.user.id,
    })

    return NextResponse.json(branch)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
