import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.role.findUnique({
      where: {
        id: params.id,
      },
      include: {
        permissions: true,
      },
    })

    if (!role) {
      return new NextResponse("Role not found", { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, permissions } = body

    const role = await prisma.role.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        permissions: {
          deleteMany: {},
          create: permissions,
        },
      },
      include: {
        permissions: true,
      },
    })

    return NextResponse.json(role)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
