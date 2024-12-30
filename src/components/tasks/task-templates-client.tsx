"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { CreateTemplateDialog } from "./create-template-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TaskTemplatesClient() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [projectId, setProjectId] = useState<string>("")
  const [category, setCategory] = useState<string>("")

  const { data: templates, isLoading } = useQuery({
    queryKey: ["taskTemplates", projectId, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(projectId && { projectId }),
        ...(category && { category }),
      })
      const res = await fetch(`/api/tasks/templates?${params}`)
      return res.json()
    },
  })

  const columns = [
    {
      accessorKey: "name",
      header: "Template Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "project.name",
      header: "Project",
    },
    {
      accessorKey: "createdBy.name",
      header: "Created By",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Use Template
          </Button>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Task Templates</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {/* Add project options */}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="feature">Feature Request</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="story">User Story</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold">Total Templates</h3>
          <p className="text-3xl font-bold">{templates?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Most Used Template</h3>
          <p className="text-lg font-medium">Bug Report Template</p>
          <p className="text-sm text-muted-foreground">Used 45 times</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Recently Added</h3>
          <p className="text-lg font-medium">Feature Request Template</p>
          <p className="text-sm text-muted-foreground">Added 2 days ago</p>
        </Card>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={templates || []}
          loading={isLoading}
        />
      </Card>

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
