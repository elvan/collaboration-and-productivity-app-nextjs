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

    // Parse query parameters
    const url = new URL(req.url)
    const query = url.searchParams.get("query") || ""
    const entityType = url.searchParams.get("entityType")

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

    // Get comment highlights
    const highlights = await prisma.$queryRaw`
      SELECT
        c.id,
        c.content,
        ts_headline(
          c.content,
          plainto_tsquery(${query}),
          'StartSel=<mark class="bg-yellow-200 dark:bg-yellow-800">, StopSel=</mark>, MaxWords=35, MinWords=15, ShortWord=3, MaxFragments=2'
        ) as highlight
      FROM "Comment" c
      WHERE
        c."workspaceId" = ${params.workspaceId}
        ${entityType ? ` AND c."entityType" = ${entityType}` : ""}
        AND to_tsvector('english', c.content) @@ plainto_tsquery(${query})
      LIMIT 5
    `

    return NextResponse.json(highlights)
  } catch (error) {
    console.error("Failed to get comment highlights:", error)
    return new NextResponse(null, { status: 500 })
  }
}
