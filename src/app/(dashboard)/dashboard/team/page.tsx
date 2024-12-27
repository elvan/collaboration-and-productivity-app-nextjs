import { getServerSession } from "next-auth"
import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeamPageClient } from "@/components/teams/team-page-client"
import { getTeams } from "@/lib/teams"

async function getAvailableUsers(userId: string) {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        id: userId
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  })

  return users
}

export default async function TeamPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [teams, availableUsers] = await Promise.all([
    getTeams({ userId: session.user.id }),
    getAvailableUsers(session.user.id)
  ])

  const defaultTeam = teams[0]

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Team"
        text="Manage your team and collaborators"
      />
      <TeamPageClient
        teams={teams}
        defaultTeam={defaultTeam}
        currentUserId={session.user.id}
        availableUsers={availableUsers}
      />
    </DashboardShell>
  )
}
