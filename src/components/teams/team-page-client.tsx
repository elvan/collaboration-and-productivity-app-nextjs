"use client"

import { TeamList } from "@/components/teams/team-list"
import { TeamMembers } from "@/components/teams/team-members"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addTeamMember, updateTeamMember, removeTeamMember, deleteTeam } from "@/lib/teams"

interface Team {
  id: string
  name: string
  description?: string | null
  members: Array<{
    user: {
      id: string
      name: string
      email: string
      image?: string | null
    }
    role: "admin" | "member"
  }>
}

interface TeamPageClientProps {
  teams: Team[]
  defaultTeam?: Team
  currentUserId: string
  availableUsers: Array<{
    id: string
    name: string
    email: string
    image?: string | null
  }>
}

export function TeamPageClient({
  teams,
  defaultTeam,
  currentUserId,
  availableUsers,
}: TeamPageClientProps) {
  return (
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
              onAddMember={async (userId, role) => {
                await addTeamMember(defaultTeam.id, { userId, role }, currentUserId)
              }}
              onUpdateMember={async (userId, role) => {
                await updateTeamMember(defaultTeam.id, userId, role, currentUserId)
              }}
              onRemoveMember={async (userId) => {
                await removeTeamMember(defaultTeam.id, userId, currentUserId)
              }}
              currentUserId={currentUserId}
              availableUsers={availableUsers}
            />
          )}
        </Card>
      </TabsContent>
      <TabsContent value="teams" className="space-y-4">
        <Card className="p-6">
          <TeamList
            teams={teams}
            onDelete={async (id) => {
              await deleteTeam(id, currentUserId)
            }}
            currentUserId={currentUserId}
          />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
