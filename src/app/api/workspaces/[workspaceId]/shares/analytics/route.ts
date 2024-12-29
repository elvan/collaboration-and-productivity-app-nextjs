import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            status: "active",
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get share analytics
    const [
      overview,
      sharesByType,
      sharesByRole,
      trend,
      topSharedItems,
      topSharers,
    ] = await Promise.all([
      // Overview stats
      prisma.$transaction(async (tx) => {
        const [totalShares, activeUsers, sharedItems] = await Promise.all([
          tx.projectShare.count({
            where: {
              project: {
                workspaceId: params.workspaceId,
              },
            },
          }) +
            (await tx.folderShare.count({
              where: {
                folder: {
                  workspaceId: params.workspaceId,
                },
              },
            })),
          tx.user.count({
            where: {
              OR: [
                {
                  projectShares: {
                    some: {
                      project: {
                        workspaceId: params.workspaceId,
                      },
                    },
                  },
                },
                {
                  folderShares: {
                    some: {
                      folder: {
                        workspaceId: params.workspaceId,
                      },
                    },
                  },
                },
              ],
            },
          }),
          tx.project.count({
            where: {
              workspaceId: params.workspaceId,
              projectShares: {
                some: {},
              },
            },
          }) +
            (await tx.folder.count({
              where: {
                workspaceId: params.workspaceId,
                folderShares: {
                  some: {},
                },
              },
            })),
        ])

        return {
          totalShares,
          activeUsers,
          sharedItems,
          averageShares: sharedItems > 0 ? totalShares / sharedItems : 0,
        }
      }),

      // Shares by type
      prisma.$transaction(async (tx) => {
        const [projectShares, folderShares] = await Promise.all([
          tx.projectShare.count({
            where: {
              project: {
                workspaceId: params.workspaceId,
              },
            },
          }),
          tx.folderShare.count({
            where: {
              folder: {
                workspaceId: params.workspaceId,
              },
            },
          }),
        ])

        return [
          { type: "Project", count: projectShares },
          { type: "Folder", count: folderShares },
        ]
      }),

      // Shares by role
      prisma.$transaction(async (tx) => {
        const roles = ["viewer", "editor", "admin"]
        const counts = await Promise.all(
          roles.map(async (role) => {
            const projectCount = await tx.projectShare.count({
              where: {
                role,
                project: {
                  workspaceId: params.workspaceId,
                },
              },
            })
            const folderCount = await tx.folderShare.count({
              where: {
                role,
                folder: {
                  workspaceId: params.workspaceId,
                },
              },
            })
            return {
              role,
              count: projectCount + folderCount,
            }
          })
        )
        return counts
      }),

      // Share trend
      prisma.activity.groupBy({
        by: ["createdAt"],
        where: {
          workspaceId: params.workspaceId,
          type: "create_share",
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }).then((activities) =>
        activities.map((activity) => ({
          date: activity.createdAt.toISOString(),
          shares: activity._count,
        }))
      ),

      // Top shared items
      prisma.$transaction(async (tx) => {
        const [projects, folders] = await Promise.all([
          tx.project.findMany({
            where: {
              workspaceId: params.workspaceId,
              projectShares: {
                some: {},
              },
            },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  projectShares: true,
                },
              },
            },
            orderBy: {
              projectShares: {
                _count: "desc",
              },
            },
            take: 5,
          }),
          tx.folder.findMany({
            where: {
              workspaceId: params.workspaceId,
              folderShares: {
                some: {},
              },
            },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  folderShares: true,
                },
              },
            },
            orderBy: {
              folderShares: {
                _count: "desc",
              },
            },
            take: 5,
          }),
        ])

        return [
          ...projects.map((p) => ({
            id: p.id,
            name: p.name,
            type: "Project",
            shares: p._count.projectShares,
          })),
          ...folders.map((f) => ({
            id: f.id,
            name: f.name,
            type: "Folder",
            shares: f._count.folderShares,
          })),
        ].sort((a, b) => b.shares - a.shares)
      }),

      // Top sharers
      prisma.user.findMany({
        where: {
          OR: [
            {
              projectShares: {
                some: {
                  project: {
                    workspaceId: params.workspaceId,
                  },
                },
              },
            },
            {
              folderShares: {
                some: {
                  folder: {
                    workspaceId: params.workspaceId,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          _count: {
            select: {
              projectShares: true,
              folderShares: true,
            },
          },
        },
        orderBy: [
          {
            projectShares: {
              _count: "desc",
            },
          },
          {
            folderShares: {
              _count: "desc",
            },
          },
        ],
        take: 5,
      }).then((users) =>
        users.map((user) => ({
          userId: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          shares: user._count.projectShares + user._count.folderShares,
        }))
      ),
    ])

    return NextResponse.json({
      overview,
      sharesByType,
      sharesByRole,
      trend,
      topSharedItems,
      topSharers,
    })
  } catch (error) {
    console.error("Failed to get share analytics:", error)
    return new NextResponse(null, { status: 500 })
  }
}
