import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const template = await prisma.folderTemplate.findFirst({
      where: {
        id: params.templateId,
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
    })

    if (!template) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Create folders based on template structure
    const structure = template.structure as Record<string, any>
    const createFolders = async (
      parentId: string | null,
      items: Record<string, any>
    ) => {
      const folders = []
      for (const [name, children] of Object.entries(items)) {
        const folder = await prisma.projectFolder.create({
          data: {
            name,
            workspaceId: params.workspaceId,
            parentId,
          },
        })
        folders.push(folder)

        if (children && typeof children === "object") {
          await createFolders(folder.id, children)
        }
      }
      return folders
    }

    const folders = await createFolders(null, structure)

    return NextResponse.json(folders)
  } catch (error) {
    console.error("Failed to apply template:", error)
    return new NextResponse(null, { status: 500 })
  }
}
