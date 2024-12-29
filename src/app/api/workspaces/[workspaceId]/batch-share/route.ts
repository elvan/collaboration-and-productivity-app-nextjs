import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityTracker } from "@/lib/activity-tracker"

const batchShareSchema = z.object({
  userIds: z.array(z.string()),
  role: z.enum(["viewer", "editor", "admin"]),
  items: z.array(
    z.object({
      type: z.enum(["folder", "project"]),
      id: z.string(),
      name: z.string(),
    })
  ),
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
    const body = batchShareSchema.parse(json)

    // Create shares in transaction
    await prisma.$transaction(async (tx) => {
      for (const item of body.items) {
        for (const userId of body.userIds) {
          if (item.type === "folder") {
            // Check if share already exists
            const existingShare = await tx.folderShare.findFirst({
              where: {
                folderId: item.id,
                userId,
              },
            })

            if (existingShare) {
              // Update existing share
              await tx.folderShare.update({
                where: {
                  id: existingShare.id,
                },
                data: {
                  role: body.role,
                },
              })
            } else {
              // Create new share
              await tx.folderShare.create({
                data: {
                  folderId: item.id,
                  userId,
                  role: body.role,
                },
              })
            }

            // Track activity
            await ActivityTracker.track({
              type: existingShare ? "update_share" : "create_share",
              entityType: "folder",
              entityId: item.id,
              entityName: item.name,
              details: {
                role: body.role,
                userId,
              },
              workspaceId: params.workspaceId,
              userId: session.user.id,
            })
          } else {
            // Check if share already exists
            const existingShare = await tx.projectShare.findFirst({
              where: {
                projectId: item.id,
                userId,
              },
            })

            if (existingShare) {
              // Update existing share
              await tx.projectShare.update({
                where: {
                  id: existingShare.id,
                },
                data: {
                  role: body.role,
                },
              })
            } else {
              // Create new share
              await tx.projectShare.create({
                data: {
                  projectId: item.id,
                  userId,
                  role: body.role,
                },
              })
            }

            // Track activity
            await ActivityTracker.track({
              type: existingShare ? "update_share" : "create_share",
              entityType: "project",
              entityId: item.id,
              entityName: item.name,
              details: {
                role: body.role,
                userId,
              },
              workspaceId: params.workspaceId,
              userId: session.user.id,
            })
          }
        }
      }
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
