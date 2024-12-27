"use client"

import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"
import { TeamList } from "@/components/teams/team-list"
import { TeamMembers } from "@/components/teams/team-members"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeamPage() {
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
            <TeamMembers />
          </Card>
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <Card className="p-6">
            <TeamList />
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
