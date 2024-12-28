import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

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
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

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

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    // Get users with pagination, sorting, and filtering
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
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      users,
      pagination: {
        total,
        pageCount: Math.ceil(total / pageSize),
        currentPage: page,
        pageSize,
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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
    console.error("Error creating user:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Bulk actions endpoint
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const canUpdateUsers = await hasPermission(session.user.id, "UPDATE", "USERS")
    if (!canUpdateUsers) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { userIds, action, data } = body

    // Check for admin users in the selection
    const selectedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      include: {
        userRole: {
          include: {
            role: true,
          },
        },
      },
    })

    // Filter out admin users
    const adminUsers = selectedUsers.filter(user =>
      user.userRole.some(ur => ur.role.name.toLowerCase() === "admin")
    )

    if (action === "delete" && adminUsers.length > 0) {
      return new NextResponse(
        `Cannot delete admin users: ${adminUsers.map(u => u.name).join(", ")}`,
        { status: 400 }
      )
    }

    // Get non-admin users for processing
    const nonAdminUserIds = selectedUsers
      .filter(user => !user.userRole.some(ur => ur.role.name.toLowerCase() === "admin"))
      .map(user => user.id)

    switch (action) {
      case "assignRole":
        await prisma.$transaction(
          nonAdminUserIds.map((userId: string) =>
            prisma.userRole.create({
              data: {
                userId,
                roleId: data.roleId,
              },
            })
          )
        )
        break

      case "removeRole":
        // Prevent removing admin role if it's the last admin
        if (data.roleId === "admin") {
          const adminCount = await prisma.userRole.count({
            where: {
              role: {
                name: "admin"
              }
            }
          })
          if (adminCount <= nonAdminUserIds.length) {
            return new NextResponse(
              "Cannot remove admin role: At least one admin must remain",
              { status: 400 }
            )
          }
        }

        await prisma.$transaction(
          nonAdminUserIds.map((userId: string) =>
            prisma.userRole.delete({
              where: {
                userId_roleId: {
                  userId,
                  roleId: data.roleId,
                },
              },
            })
          )
        )
        break

      case "delete":
        await prisma.user.deleteMany({
          where: {
            id: {
              in: nonAdminUserIds,
            },
          },
        })
        break

      default:
        return new NextResponse("Invalid action", { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: adminUsers.length > 0
        ? `Operation completed. Skipped admin users: ${adminUsers.map(u => u.name).join(", ")}`
        : "Operation completed successfully"
    })
  } catch (error) {
    console.error("Error performing bulk action:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
