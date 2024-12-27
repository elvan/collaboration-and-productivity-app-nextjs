import { Activity, Project, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import ActivityDigest from "@/components/emails/activity-digest"
import { format, subDays, subWeeks, startOfDay, endOfDay } from "date-fns"

const resend = new Resend(process.env.RESEND_API_KEY)

interface DigestActivity {
  title: string
  message: string
  timestamp: string
}

interface ProjectDigest {
  projectName: string
  projectUrl: string
  items: DigestActivity[]
}

async function getActivitiesForUser(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // Get all projects where user is a member or owner
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      activities: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  return userProjects.map((project) => ({
    projectName: project.name,
    projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${project.id}`,
    items: project.activities.map((activity) => {
      const data = activity.data as any
      let title = ""
      let message = ""

      switch (activity.type) {
        case "member_added":
          title = "New Member Added"
          message = `${activity.user.name || activity.user.email} added ${
            data.memberName
          }`
          break
        case "member_removed":
          title = "Member Removed"
          message = `${activity.user.name || activity.user.email} removed ${
            data.memberName
          }`
          break
        case "task_created":
          title = "New Task"
          message = `${activity.user.name || activity.user.email} created "${
            data.taskTitle
          }"`
          break
        case "task_completed":
          title = "Task Completed"
          message = `${activity.user.name || activity.user.email} completed "${
            data.taskTitle
          }"`
          break
        case "task_assigned":
          title = "Task Assigned"
          message = `${
            activity.user.name || activity.user.email
          } assigned "${data.taskTitle}" to ${data.assigneeName}`
          break
        default:
          title = "Project Update"
          message = `${
            activity.user.name || activity.user.email
          } made changes to the project`
      }

      return {
        title,
        message,
        timestamp: format(new Date(activity.createdAt), "PPP p"),
      }
    }),
  }))
}

export async function sendDailyDigest() {
  const startDate = startOfDay(subDays(new Date(), 1))
  const endDate = endOfDay(subDays(new Date(), 1))

  // Get users who have daily digest enabled
  const users = await prisma.user.findMany({
    where: {
      notificationPreferences: {
        some: {
          emailEnabled: true,
          dailyDigest: true,
        },
      },
    },
    include: {
      notificationPreferences: true,
    },
  })

  for (const user of users) {
    const activities = await getActivitiesForUser(user.id, startDate, endDate)

    // Only send digest if there are activities
    if (activities.some((p) => p.items.length > 0)) {
      await resend.emails.send({
        from: "digest@yourdomain.com",
        to: user.email,
        subject: `Your daily project activity digest - ${format(
          startDate,
          "PP"
        )}`,
        react: ActivityDigest({
          userName: user.name || user.email,
          digestType: "daily",
          activities,
          userEmail: user.email,
          startDate: format(startDate, "PP"),
          endDate: format(endDate, "PP"),
        }),
      })
    }
  }
}

export async function sendWeeklyDigest() {
  const startDate = startOfDay(subWeeks(new Date(), 1))
  const endDate = endOfDay(new Date())

  // Get users who have weekly digest enabled
  const users = await prisma.user.findMany({
    where: {
      notificationPreferences: {
        some: {
          emailEnabled: true,
          weeklyDigest: true,
        },
      },
    },
    include: {
      notificationPreferences: true,
    },
  })

  for (const user of users) {
    const activities = await getActivitiesForUser(user.id, startDate, endDate)

    // Only send digest if there are activities
    if (activities.some((p) => p.items.length > 0)) {
      await resend.emails.send({
        from: "digest@yourdomain.com",
        to: user.email,
        subject: `Your weekly project activity digest - Week of ${format(
          startDate,
          "PP"
        )}`,
        react: ActivityDigest({
          userName: user.name || user.email,
          digestType: "weekly",
          activities,
          userEmail: user.email,
          startDate: format(startDate, "PP"),
          endDate: format(endDate, "PP"),
        }),
      })
    }
  }
}
