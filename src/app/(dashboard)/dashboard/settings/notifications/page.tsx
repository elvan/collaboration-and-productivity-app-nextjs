import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationPreferences } from "@/components/settings/notification-preferences"

export const metadata = {
  title: "Notification Settings",
  description: "Manage your notification preferences",
}

async function getNotificationPreferences(userId: string) {
  return await prisma.notificationPreference.findUnique({
    where: { userId },
  })
}

export default async function NotificationSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return notFound()
  }

  const preferences = await getNotificationPreferences(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Manage how you receive notifications about project activity.
        </p>
      </div>
      <NotificationPreferences
        preferences={preferences}
        userId={session.user.id}
      />
    </div>
  )
}
