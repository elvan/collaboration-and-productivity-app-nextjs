import { Activity, Project, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { sendActivityNotificationEmail } from "@/lib/email"

interface NotificationData {
  type: string
  title: string
  message: string
  userId: string
  activityId?: string
}

export async function createNotification(data: NotificationData) {
  return await prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      user: { connect: { id: data.userId } },
      ...(data.activityId && {
        activity: { connect: { id: data.activityId } },
      }),
    },
  })
}

export async function createActivityNotification(
  activity: Activity & {
    user: Pick<User, "name" | "email">
    project: Pick<Project, "name">
  }
) {
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

  // Get project members to notify
  const projectMembers = await prisma.project.findUnique({
    where: { id: activity.projectId },
    select: {
      members: {
        select: { id: true },
      },
      owner: {
        select: { id: true },
      },
    },
  })

  if (!projectMembers) return

  // Create notifications for all project members except the activity creator
  const memberIds = [
    ...projectMembers.members.map((m) => m.id),
    projectMembers.owner.id,
  ]

  for (const memberId of memberIds) {
    if (memberId === activity.userId) continue

    await createNotification({
      type: "activity",
      title,
      message,
      userId: memberId,
      activityId: activity.id,
    })
  }

  // Send email notifications
  await sendActivityNotificationEmail(activity)
}

export async function markNotificationAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId },
  })
}
