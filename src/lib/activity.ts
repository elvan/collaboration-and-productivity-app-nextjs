import { prisma } from "@/lib/prisma"

export async function createActivity(
  type: string,
  data: any,
  projectId: string,
  userId: string
) {
  return await prisma.activity.create({
    data: {
      type,
      data,
      project: { connect: { id: projectId } },
      user: { connect: { id: userId } },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}
