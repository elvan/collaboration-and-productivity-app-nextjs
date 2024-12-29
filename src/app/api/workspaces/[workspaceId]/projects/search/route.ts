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
    const search = searchParams.get("search")
    const folder = searchParams.get("folder")
    const team = searchParams.get("team")
    const visibility = searchParams.get("visibility")
    const date = searchParams.get("date")

    // Build the where clause based on filters
    const where: any = {
      workspaceId: params.workspaceId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    }

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by folder
    if (folder) {
      where.folderId = folder
    }

    // Filter by team
    if (team) {
      where.teamId = team
    }

    // Filter by visibility
    if (visibility) {
      where.visibility = visibility.toUpperCase()
    }

    // Filter by date
    if (date) {
      const now = new Date()
      let dateFilter: Date
      switch (date) {
        case "week":
          dateFilter = new Date(now.setDate(now.getDate() - 7))
          break
        case "month":
          dateFilter = new Date(now.setMonth(now.getMonth() - 1))
          break
        case "year":
          dateFilter = new Date(now.setFullYear(now.getFullYear() - 1))
          break
        default:
          dateFilter = new Date(0)
      }
      where.createdAt = {
        gte: dateFilter,
      }
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        folder: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        team: true,
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
        {
          name: "asc",
        },
      ],
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to search projects:", error)
    return new NextResponse(null, { status: 500 })
  }
}
