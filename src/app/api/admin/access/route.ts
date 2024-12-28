import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ hasAccess: false })
    }

    // Check if user has admin role
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "admin"
        }
      }
    })

    return NextResponse.json({ hasAccess: !!userRole })
  } catch (error) {
    console.error("Error checking admin access:", error)
    return NextResponse.json({ hasAccess: false })
  }
}
