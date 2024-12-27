import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivity } from "@/lib/activity"

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
    memberId: z.string(),
  }),
})

export async function DELETE(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return new NextResponse("Not found or not authorized", { status: 404 })
    }

    // Cannot remove the project owner
    if (params.memberId === project.ownerId) {
      return new NextResponse("Cannot remove project owner", { status: 400 })
    }

    // Get member details for activity
    const member = await prisma.user.findUnique({
      where: { id: params.memberId },
      select: { name: true, email: true },
    })

    // Remove member from project
    await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        members: {
          disconnect: {
            id: params.memberId,
          },
        },
      },
    })

    // Create activity
    await createActivity(
      "member_removed",
      {
        memberName: member?.name || member?.email,
        memberId: params.memberId,
      },
      params.projectId,
      session.user.id
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
