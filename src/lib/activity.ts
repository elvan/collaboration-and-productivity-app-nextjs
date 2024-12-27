import { prisma } from "@/lib/prisma"
import { createActivityNotification } from "@/lib/notification"

export async function createActivity(
  type: string,
  data: any,
  projectId: string,
  userId: string
) {
  const activity = await prisma.activity.create({
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
        },
      },
      project: {
        select: {
          name: true,
        },
      },
    },
  })

  // Create notifications for project members
  await createActivityNotification(activity)

  return activity
}
