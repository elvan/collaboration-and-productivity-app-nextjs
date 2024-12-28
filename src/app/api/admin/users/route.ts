import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const canViewUsers = await hasPermission(session.user.id, "READ", "USERS")
    if (!canViewUsers) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        userRole: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const canCreateUsers = await hasPermission(session.user.id, "CREATE", "USERS")
    if (!canCreateUsers) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { name, email, image } = body

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        image,
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
