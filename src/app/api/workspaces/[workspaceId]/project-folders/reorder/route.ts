import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const reorderSchema = z.object({
  sourceId: z.string(),
  destinationId: z.string(),
  sourceIndex: z.number(),
  destinationIndex: z.number(),
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
    const body = reorderSchema.parse(json)

    // Get all projects in the source and destination folders
    const [sourceProjects, destinationProjects] = await Promise.all([
      prisma.project.findMany({
        where: {
          workspaceId: params.workspaceId,
          folderId: body.sourceId === "root" ? null : body.sourceId,
        },
        orderBy: {
          position: "asc",
        },
      }),
      prisma.project.findMany({
        where: {
          workspaceId: params.workspaceId,
          folderId: body.destinationId === "root" ? null : body.destinationId,
        },
        orderBy: {
          position: "asc",
        },
      }),
    ])

    // Calculate new positions
    const POSITION_GAP = 1000 // Gap between positions to allow for future insertions
    const movedProject = sourceProjects[body.sourceIndex]

    // Remove project from source array
    sourceProjects.splice(body.sourceIndex, 1)

    // Insert project into destination array
    destinationProjects.splice(body.destinationIndex, 0, movedProject)

    // Update positions for all affected projects
    const updates = destinationProjects.map((project, index) => ({
      id: project.id,
      position: index * POSITION_GAP,
      folderId: body.destinationId === "root" ? null : body.destinationId,
    }))

    // If source and destination are different, update source positions
    if (body.sourceId !== body.destinationId) {
      updates.push(
        ...sourceProjects.map((project, index) => ({
          id: project.id,
          position: index * POSITION_GAP,
          folderId: body.sourceId === "root" ? null : body.sourceId,
        }))
      )
    }

    // Update all projects in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.project.update({
          where: { id: update.id },
          data: {
            position: update.position,
            folderId: update.folderId,
          },
        })
      )
    )

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
