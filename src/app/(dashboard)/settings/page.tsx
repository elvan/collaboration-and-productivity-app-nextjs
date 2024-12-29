import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { UserPreferences } from "@/components/user/user-preferences"

async function getUserPreferences(userId: string) {
  const preferences = await prisma.userPreference.findUnique({
    where: {
      userId,
    },
  })

  if (!preferences) {
    // Return default preferences
    return {
      id: "",
      userId,
      theme: "system",
      accentColor: "blue",
      fontSize: "medium",
      reducedMotion: false,
      highContrast: false,
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      firstDayOfWeek: 0,
      notificationSound: true,
      defaultTaskView: "list",
      taskSortOrder: "dueDate",
      showCompletedTasks: true,
      dashboardLayout: null,
      favoriteProjects: [],
      recentlyViewed: null,
      pageSize: 20,
      autoSaveInterval: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return preferences
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const preferences = await getUserPreferences(session.user.id)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-8">
        <UserPreferences preferences={preferences} />
      </div>
    </div>
  )
}
