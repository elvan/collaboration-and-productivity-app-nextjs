import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Parser } from "@json2csv/plainjs"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const canViewUsers = await hasPermission(session.user.id, "READ", "USERS")
    if (!canViewUsers) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")

    // Build where clause
    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        } : {},
        role ? {
          userRole: {
            some: {
              role: {
                name: { equals: role, mode: "insensitive" }
              }
            }
          }
        } : {}
      ]
    }

    // Get users with their roles
    const users = await prisma.user.findMany({
      where,
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

    // Transform data for CSV
    const csvData = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.userRole.map(ur => ur.role.name).join(", "),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    // Convert to CSV
    const parser = new Parser()
    const csv = parser.parse(csvData)

    // Set headers for file download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", 'attachment; filename="users.csv"')

    return new NextResponse(csv, {
      headers,
    })
  } catch (error) {
    console.error("Error exporting users:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
