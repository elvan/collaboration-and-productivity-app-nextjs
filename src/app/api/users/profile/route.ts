import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[PROFILE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, email, bio, location, website } = body

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        email,
        bio,
        location,
        website,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[PROFILE_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { image } = body

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[PROFILE_PUT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
