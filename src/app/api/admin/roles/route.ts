import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(
    z.object({
      action: z.enum(["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"]),
      resource: z.enum([
        "USERS",
        "ROLES",
        "TEAMS",
        "PROJECTS",
        "TASKS",
        "WORKSPACES",
        "SETTINGS",
      ]),
    })
  ),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has permission to manage roles
    const canManageRoles = await hasPermission(session.user.id, "MANAGE", "ROLES")
    if (!canManageRoles) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const json = await req.json()
    const body = createRoleSchema.parse(json)

    const role = await prisma.role.create({
      data: {
        name: body.name,
        description: body.description,
        permissions: {
          create: body.permissions,
        },
      },
      include: {
        permissions: true,
      },
    })

    return NextResponse.json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has permission to read roles
    const canReadRoles = await hasPermission(session.user.id, "READ", "ROLES")
    if (!canReadRoles) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            userRoles: true,
            workspaceRoles: true,
            teamRoles: true,
          },
        },
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
