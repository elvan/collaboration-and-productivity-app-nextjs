"use client"

import { getServerSession } from "next-auth"
import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"
import { TeamList } from "@/components/teams/team-list"
import { TeamMembers } from "@/components/teams/team-members"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { deleteTeam, addTeamMember, updateTeamMember, removeTeamMember } from "./actions"

async function getTeamsData(userId: string) {
  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return teams
}

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
    getTeamsData(session.user.id),
    getAvailableUsers(session.user.id)
  ])

  const defaultTeam = teams[0]

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Team"
        text="Manage your team and collaborators"
      />
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-4">
          <Card className="p-6">
            {defaultTeam && (
              <TeamMembers
                team={defaultTeam}
                onAddMember={(userId, role) => addTeamMember(defaultTeam.id, userId, role)}
                onUpdateMember={(userId, role) => updateTeamMember(defaultTeam.id, userId, role)}
                onRemoveMember={(userId) => removeTeamMember(defaultTeam.id, userId)}
                currentUserId={session.user.id}
                availableUsers={availableUsers}
              />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <Card className="p-6">
            <TeamList
              teams={teams}
              onDelete={deleteTeam}
              currentUserId={session.user.id}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
