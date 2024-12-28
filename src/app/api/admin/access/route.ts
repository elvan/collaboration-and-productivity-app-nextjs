import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ hasAccess: false })
    }

    // Check if user has admin role - using the exact role name from the database
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "Admin" // Match the exact role name from the database
        }
      },
      include: {
        role: true
      }
    })

    console.log('Admin access check:', {
      userId: session.user.id,
      hasAccess: !!userRole,
      role: userRole?.role,
      query: {
        userId: session.user.id,
        roleName: "Admin"
      }
    })

    return NextResponse.json({ hasAccess: !!userRole })
  } catch (error) {
    console.error("Error checking admin access:", error)
    return NextResponse.json({ hasAccess: false })
  }
}
