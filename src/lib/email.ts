import { Resend } from "resend"
import { Activity, Project, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import ActivityEmail from "@/components/emails/activity-notification"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  title: string
  message: string
  projectName: string
  projectUrl: string
  userEmail: string
}

export async function sendActivityEmail(data: EmailData) {
  try {
    await resend.emails.send({
      from: "notifications@yourdomain.com",
      to: data.userEmail,
      subject: data.title,
      react: ActivityEmail(data),
    })
  } catch (error) {
    console.error("Failed to send email:", error)
  }
}

export async function sendActivityNotificationEmail(
  activity: Activity & {
    user: Pick<User, "name" | "email">
    project: Pick<Project, "name">
  }
) {
  // Get project members and their notification preferences
  const projectMembers = await prisma.project.findUnique({
    where: { id: activity.projectId },
    select: {
      members: {
        select: {
          id: true,
          email: true,
          notificationPreferences: {
            select: {
              emailEnabled: true,
              memberActivity: true,
              taskActivity: true,
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          email: true,
          notificationPreferences: {
            select: {
              emailEnabled: true,
              memberActivity: true,
              taskActivity: true,
            },
          },
        },
      },
    },
  })

  if (!projectMembers) return

  const data = activity.data as any
  let title = ""
  let message = ""

  switch (activity.type) {
    case "member_added":
      title = "New Project Member"
      message = `${activity.user.name || activity.user.email} added ${
        data.memberName
      } to ${activity.project.name}`
      break
    case "member_removed":
      title = "Member Removed"
      message = `${activity.user.name || activity.user.email} removed ${
        data.memberName
      } from ${activity.project.name}`
      break
    case "task_created":
      title = "New Task Created"
      message = `${activity.user.name || activity.user.email} created task "${
        data.taskTitle
      }" in ${activity.project.name}`
      break
    case "task_completed":
      title = "Task Completed"
      message = `${activity.user.name || activity.user.email} completed task "${
        data.taskTitle
      }" in ${activity.project.name}`
      break
    case "task_assigned":
      title = "Task Assigned"
      message = `${
        activity.user.name || activity.user.email
      } assigned task "${data.taskTitle}" to ${data.assigneeName} in ${
        activity.project.name
      }`
      break
    default:
      title = "Project Update"
      message = `${
        activity.user.name || activity.user.email
      } made changes to ${activity.project.name}`
  }

  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${activity.projectId}`

  // Send emails to members with enabled notifications
  const members = [
    ...projectMembers.members,
    projectMembers.owner,
  ]

  for (const member of members) {
    if (member.id === activity.userId) continue

    const preferences = member.notificationPreferences?.[0]
    if (!preferences?.emailEnabled) continue

    // Check if user wants this type of notification
    const isTaskActivity = activity.type.startsWith("task_")
    const isMemberActivity = activity.type.startsWith("member_")

    if (
      (isTaskActivity && !preferences.taskActivity) ||
      (isMemberActivity && !preferences.memberActivity)
    ) {
      continue
    }

    await sendActivityEmail({
      title,
      message,
      projectName: activity.project.name,
      projectUrl,
      userEmail: member.email,
    })
  }
}
