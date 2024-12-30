"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { CreateMilestoneDialog } from "./create-milestone-dialog"
import { Progress } from "@/components/ui/progress"

interface ProjectMilestonesClientProps {
  projectId: string
}

export function ProjectMilestonesClient({ projectId }: ProjectMilestonesClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["projectMilestones", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/milestones`)
      return res.json()
    },
  })

  const columns = [
    {
      accessorKey: "title",
      header: "Milestone",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => new Date(row.getValue("dueDate")).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const completedTasks = row.original.tasks.filter((t: any) => t.status === "completed").length
        const totalTasks = row.original.tasks.length
        const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
        
        return (
          <div className="w-[200px]">
            <div className="flex justify-between mb-1">
              <span className="text-sm">{progress}%</span>
              <span className="text-sm">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <Progress value={progress} />
          </div>
        )
      },
    },
    {
      accessorKey: "assignedTo.name",
      header: "Assigned To",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Project Milestones</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold">Total Milestones</h3>
          <p className="text-3xl font-bold">{milestones?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Upcoming</h3>
          <p className="text-3xl font-bold">
            {milestones?.filter((m: any) => 
              new Date(m.dueDate) > new Date()
            ).length || 0}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Completed</h3>
          <p className="text-3xl font-bold">
            {milestones?.filter((m: any) => 
              m.tasks.every((t: any) => t.status === "completed")
            ).length || 0}
          </p>
        </Card>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={milestones || []}
          loading={isLoading}
        />
      </Card>

      <CreateMilestoneDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
