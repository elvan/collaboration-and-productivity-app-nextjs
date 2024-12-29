import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""
    const folderId = searchParams.get("folderId")
    const tags = searchParams.getAll("tags[]")

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: params.workspaceId,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        folderId: folderId || undefined,
        ...(tags.length > 0 && {
          tags: {
            some: {
              id: {
                in: tags,
              },
            },
          },
        }),
        workspace: {
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        folder: true,
        tags: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    const folders = await prisma.projectFolder.findMany({
      where: {
        workspaceId: params.workspaceId,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        parentId: folderId || undefined,
        ...(tags.length > 0 && {
          tags: {
            some: {
              id: {
                in: tags,
              },
            },
          },
        }),
        workspace: {
          workspaceMembers: {
            some: {
              userId: session.user.id,
              status: "active",
            },
          },
        },
      },
      include: {
        children: true,
        projects: true,
        tags: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ projects, folders })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
