import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const bulkActionSchema = z.object({
  action: z.enum(["move", "delete", "duplicate"]),
  targetFolderId: z.string().optional(),
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
    const body = bulkActionSchema.parse(json)

    // Verify target folder if moving
    if (body.action === "move" && body.targetFolderId) {
      const targetFolder = await prisma.projectFolder.findFirst({
        where: {
          id: body.targetFolderId,
          workspaceId: params.workspaceId,
        },
      })

      if (!targetFolder) {
        return new NextResponse("Target folder not found", { status: 404 })
      }
    }

    // Process items based on action
    switch (body.action) {
      case "move":
        await prisma.$transaction(async (tx) => {
          for (const item of body.items) {
            if (item.type === "folder") {
              await tx.projectFolder.update({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
                data: {
                  parentId: body.targetFolderId,
                },
              })
            } else {
              await tx.project.update({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
                data: {
                  folderId: body.targetFolderId,
                },
              })
            }
          }
        })
        break

      case "duplicate":
        await prisma.$transaction(async (tx) => {
          for (const item of body.items) {
            if (item.type === "folder") {
              // Get folder with all nested items
              const folder = await tx.projectFolder.findFirst({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
                include: {
                  children: true,
                  projects: true,
                },
              })

              if (folder) {
                // Create new folder
                const newFolder = await tx.projectFolder.create({
                  data: {
                    name: `${folder.name} (Copy)`,
                    description: folder.description,
                    workspaceId: params.workspaceId,
                    parentId: folder.parentId,
                  },
                })

                // Duplicate nested folders and projects
                await duplicateNestedItems(tx, folder, newFolder.id)
              }
            } else {
              // Get project details
              const project = await tx.project.findFirst({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
              })

              if (project) {
                // Create new project
                await tx.project.create({
                  data: {
                    name: `${project.name} (Copy)`,
                    description: project.description,
                    workspaceId: params.workspaceId,
                    folderId: project.folderId,
                    visibility: project.visibility,
                    ownerId: session.user.id,
                  },
                })
              }
            }
          }
        })
        break

      case "delete":
        await prisma.$transaction(async (tx) => {
          for (const item of body.items) {
            if (item.type === "folder") {
              await tx.projectFolder.delete({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
              })
            } else {
              await tx.project.delete({
                where: {
                  id: item.id,
                  workspaceId: params.workspaceId,
                },
              })
            }
          }
        })
        break
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    console.error("Bulk operation error:", error)
    return new NextResponse(null, { status: 500 })
  }
}

// Helper function to duplicate nested items
async function duplicateNestedItems(
  tx: any,
  folder: any,
  newParentId: string
) {
  // Duplicate child folders
  for (const child of folder.children) {
    const newChild = await tx.projectFolder.create({
      data: {
        name: `${child.name} (Copy)`,
        description: child.description,
        workspaceId: folder.workspaceId,
        parentId: newParentId,
      },
    })
    await duplicateNestedItems(tx, child, newChild.id)
  }

  // Duplicate projects
  for (const project of folder.projects) {
    await tx.project.create({
      data: {
        name: `${project.name} (Copy)`,
        description: project.description,
        workspaceId: folder.workspaceId,
        folderId: newParentId,
        visibility: project.visibility,
        ownerId: project.ownerId,
      },
    })
  }
}
