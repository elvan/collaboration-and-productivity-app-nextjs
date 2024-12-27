"use client"

import { TeamList } from "@/components/teams/team-list"
import { TeamMembers } from "@/components/teams/team-members"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deleteTeam, addTeamMember, updateTeamMember, removeTeamMember } from "@/app/(dashboard)/dashboard/team/actions"

interface TeamPageClientProps {
  teams: any[]
  defaultTeam: any
  currentUserId: string
  availableUsers: any[]
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
              onAddMember={(userId, role) => addTeamMember(defaultTeam.id, userId, role)}
              onUpdateMember={(userId, role) => updateTeamMember(defaultTeam.id, userId, role)}
              onRemoveMember={(userId) => removeTeamMember(defaultTeam.id, userId)}
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
            onDelete={deleteTeam}
            currentUserId={currentUserId}
          />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
