import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { hash, compare } from "bcryptjs"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return new NextResponse("Invalid current password", { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "UPDATED",
        userId: session.user.id,
        entityType: "USER",
        entityId: session.user.id,
        metadata: {
          action: "PASSWORD_CHANGE",
          timestamp: new Date().toISOString(),
        },
      },
    })

    return new NextResponse("Password updated successfully", { status: 200 })
  } catch (error) {
    console.error("[SECURITY_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
