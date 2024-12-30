"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { CreateResourceDialog } from "./create-resource-dialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import { ResourceCalendar } from "@/components/ui/resource-calendar"

interface ProjectResourcesClientProps {
  projectId: string
}

export function ProjectResourcesClient({ projectId }: ProjectResourcesClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 30),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["projectResources", projectId, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })
      const res = await fetch(`/api/projects/${projectId}/resources?${params}`)
      return res.json()
    },
  })

  const columns = [
    {
      accessorKey: "user.name",
      header: "Resource Name",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      accessorKey: "availability",
      header: "Availability",
      cell: ({ row }) => `${row.getValue("availability")}%`,
    },
    {
      accessorKey: "allocations",
      header: "Current Allocation",
      cell: ({ row }) => {
        const allocations = data?.allocations.filter(
          (a: any) => a.resource.id === row.original.id
        )
        const totalAllocation = allocations?.reduce(
          (acc: number, curr: any) => acc + curr.allocation,
          0
        )
        return `${totalAllocation || 0}%`
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => new Date(row.getValue("startDate")).toLocaleDateString(),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => new Date(row.getValue("endDate")).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Project Resources</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold">Total Resources</h3>
          <p className="text-3xl font-bold">{data?.resources?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Total Allocation</h3>
          <p className="text-3xl font-bold">
            {data?.allocations?.reduce(
              (acc: number, curr: any) => acc + curr.allocation,
              0
            ) || 0}%
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Available Capacity</h3>
          <p className="text-3xl font-bold">
            {data?.resources?.reduce(
              (acc: number, curr: any) => acc + curr.availability,
              0
            ) || 0}%
          </p>
        </Card>
      </div>

      <div className="flex justify-end">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <Card className="p-6">
        <ResourceCalendar
          resources={data?.resources || []}
          allocations={data?.allocations || []}
          startDate={dateRange.from}
          endDate={dateRange.to}
        />
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={data?.resources || []}
          loading={isLoading}
        />
      </Card>

      <CreateResourceDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
