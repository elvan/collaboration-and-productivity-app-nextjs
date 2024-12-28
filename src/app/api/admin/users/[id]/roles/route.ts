import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { roleId, action } = body

    if (action === "add") {
      await prisma.userRole.create({
        data: {
          userId: params.id,
          roleId: roleId,
        },
      })
    } else if (action === "remove") {
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: params.id,
            roleId: roleId,
          },
        },
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      include: {
        userRole: {
          include: {
            role: true,
          },
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
