import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserEngagementMetrics } from "@/lib/analytics"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export const metadata = {
  title: "Notification Analytics",
  description: "View your notification engagement metrics",
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return notFound()
  }

  const metrics = await getUserEngagementMetrics(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Track and analyze your notification engagement
        </p>
      </div>
      <AnalyticsDashboard metrics={metrics} userId={session.user.id} />
    </div>
  )
}
