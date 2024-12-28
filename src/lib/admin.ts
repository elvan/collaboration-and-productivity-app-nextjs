import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SystemRole } from "@/types/roles"

export async function requireAdminAccess() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user has admin role
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: {
        name: SystemRole.ADMIN
      }
    },
    include: {
      role: true
    }
  })

  console.log("Admin access check:", {
    userId: session.user.id,
    hasAccess: !!userRole,
    role: userRole?.role
  })

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null // No error response means access is granted
}
