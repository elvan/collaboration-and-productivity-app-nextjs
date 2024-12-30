"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { BarChart, DoughnutChart } from "@/components/ui/charts"

export function TaskReportsClient() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [projectId, setProjectId] = useState<string>("")
  const [status, setStatus] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["taskReports", dateRange, projectId, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(projectId && { projectId }),
        ...(status && { status }),
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })
      const res = await fetch(`/api/tasks/reports?${params}`)
      return res.json()
    },
  })

  const columns = [
    {
      accessorKey: "title",
      header: "Task",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "assignee.name",
      header: "Assignee",
    },
    {
      accessorKey: "project.name",
      header: "Project",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Task Reports</h2>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {/* Add project options */}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="font-semibold">Total Tasks</h3>
          <p className="text-3xl font-bold">{data?.tasks?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Completed Tasks</h3>
          <p className="text-3xl font-bold">
            {data?.taskStats?.find((s: any) => s.status === "done")?._count || 0}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">In Progress</h3>
          <p className="text-3xl font-bold">
            {data?.taskStats?.find((s: any) => s.status === "in_progress")?._count || 0}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Total Time Spent</h3>
          <p className="text-3xl font-bold">
            {Math.round(
              (data?.timeStats?.reduce((acc: number, curr: any) =>
                acc + (curr._sum.duration || 0), 0) || 0) / 3600
            )}h
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Task Status Distribution</h3>
          <DoughnutChart
            data={{
              labels: ["To Do", "In Progress", "Done"],
              datasets: [{
                data: [
                  data?.taskStats?.find((s: any) => s.status === "todo")?._count || 0,
                  data?.taskStats?.find((s: any) => s.status === "in_progress")?._count || 0,
                  data?.taskStats?.find((s: any) => s.status === "done")?._count || 0,
                ],
              }],
            }}
          />
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Task Completion Trend</h3>
          <BarChart
            data={{
              labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
              datasets: [{
                label: "Completed Tasks",
                data: [10, 15, 8, 12], // Replace with actual data
              }],
            }}
          />
        </Card>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={data?.tasks || []}
          loading={isLoading}
        />
      </Card>
    </div>
  )
}
