"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Timeline } from "@/components/ui/timeline"
import { CreateRoadmapItemDialog } from "./create-roadmap-item-dialog"

interface ProjectRoadmapClientProps {
  projectId: string
}

export function ProjectRoadmapClient({ projectId }: ProjectRoadmapClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: roadmapItems, isLoading } = useQuery({
    queryKey: ["projectRoadmap", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/roadmap`)
      return res.json()
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Project Roadmap</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Roadmap Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold">Total Items</h3>
          <p className="text-3xl font-bold">{roadmapItems?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">In Progress</h3>
          <p className="text-3xl font-bold">
            {roadmapItems?.filter((item: any) => 
              new Date(item.startDate) <= new Date() && 
              new Date(item.endDate) >= new Date()
            ).length || 0}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Completed</h3>
          <p className="text-3xl font-bold">
            {roadmapItems?.filter((item: any) => 
              new Date(item.endDate) < new Date()
            ).length || 0}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <Timeline
          items={roadmapItems?.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            dependencies: item.dependencies,
            milestones: item.milestones,
          }))}
          loading={isLoading}
        />
      </Card>

      <CreateRoadmapItemDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
