import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivity } from "@/lib/activity"

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
})

const inviteSchema = z.object({
  email: z.string().email(),
})

export async function POST(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if user is a member of the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
      include: {
        members: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    const json = await req.json()
    const body = inviteSchema.parse(json)

    // Check if user is already a member
    const isMember = project.members.some(
      (member) => member.email === body.email
    )

    if (isMember) {
      return new NextResponse("User is already a member", { status: 400 })
    }

    // Find or create user
    const invitedUser = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    })

    if (!invitedUser) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Add user to project
    await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        members: {
          connect: {
            id: invitedUser.id,
          },
        },
      },
    })

    // Create activity for adding member
    await createActivity(
      "member_added",
      {
        memberName: invitedUser.name || invitedUser.email,
        memberId: invitedUser.id,
      },
      params.projectId,
      session.user.id
    )

    // Create project invitation
    const invitation = await prisma.projectInvitation.create({
      data: {
        project: { connect: { id: params.projectId } },
        invitedBy: { connect: { id: session.user.id } },
        invitedUser: { connect: { id: invitedUser.id } },
        status: "pending",
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send email notification
    // For now, we'll just return the invitation
    return NextResponse.json(invitation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
