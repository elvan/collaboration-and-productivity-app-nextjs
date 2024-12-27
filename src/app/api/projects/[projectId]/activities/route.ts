import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
})

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  type: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { params } = routeContextSchema.parse(context)
    const { searchParams } = new URL(req.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if user is a member of the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Build where clause for filtering
    const where = {
      projectId: params.projectId,
      ...(query.type && { type: query.type }),
      ...(query.userId && { userId: query.userId }),
      ...(query.startDate && {
        createdAt: {
          gte: new Date(query.startDate),
          ...(query.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    }

    // Get total count for pagination
    const total = await prisma.activity.count({ where })

    // Get paginated activities
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })

    return NextResponse.json({
      activities,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
