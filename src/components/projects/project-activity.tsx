"use client"

import * as React from "react"
import { Activity, Project, User } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface ExtendedActivity extends Activity {
  user: {
    name: string | null
    email: string
    image: string | null
  }
}

interface ProjectActivityProps {
  project: Project & {
    members: {
      id: string
      name: string | null
      image: string | null
    }[]
    activities: ExtendedActivity[]
  }
}

const activityTypes = [
  { value: "", label: "All Activities" },
  { value: "member_added", label: "Member Added" },
  { value: "member_removed", label: "Member Removed" },
  { value: "task_created", label: "Task Created" },
  { value: "task_completed", label: "Task Completed" },
  { value: "task_assigned", label: "Task Assigned" },
  { value: "project_updated", label: "Project Updated" },
]

export function ProjectActivity({ project }: ProjectActivityProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [activities, setActivities] = React.useState<ExtendedActivity[]>(
    project.activities
  )
  const [page, setPage] = React.useState<number>(1)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  const [filters, setFilters] = React.useState({
    type: searchParams.get("type") || "",
    userId: searchParams.get("userId") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  })

  async function fetchActivities(newPage?: number, newFilters = filters) {
    setIsLoading(true)

    const params = new URLSearchParams({
      page: String(newPage || page),
      limit: "20",
      ...(newFilters.type && { type: newFilters.type }),
      ...(newFilters.userId && { userId: newFilters.userId }),
      ...(newFilters.startDate && { startDate: newFilters.startDate }),
      ...(newFilters.endDate && { endDate: newFilters.endDate }),
    })

    try {
      const response = await fetch(
        `/api/projects/${project.id}/activities?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch activities")
      }

      const data = await response.json()
      setActivities(data.activities)
      setTotalPages(data.pagination.totalPages)
      setPage(data.pagination.page)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch activities. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchActivities()
  }, [])

  function handleFilterChange(key: string, value: string) {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    fetchActivities(1, newFilters)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchActivities(newPage)
  }

  function getActivityMessage(activity: ExtendedActivity) {
    const data = activity.data as any
    switch (activity.type) {
      case "member_added":
        return (
          <span>
            added <strong>{data.memberName}</strong> to the project
          </span>
        )
      case "member_removed":
        return (
          <span>
            removed <strong>{data.memberName}</strong> from the project
          </span>
        )
      case "task_created":
        return (
          <span>
            created task <strong>{data.taskTitle}</strong>
          </span>
        )
      case "task_completed":
        return (
          <span>
            completed task <strong>{data.taskTitle}</strong>
          </span>
        )
      case "task_assigned":
        return (
          <span>
            assigned task <strong>{data.taskTitle}</strong> to{" "}
            <strong>{data.assigneeName}</strong>
          </span>
        )
      case "project_updated":
        return (
          <span>
            updated project {data.field && <strong>{data.field}</strong>}
          </span>
        )
      default:
        return <span>{activity.type}</span>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Activity</h3>
          <p className="text-sm text-muted-foreground">
            Recent activity in this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivities()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.userId}
          onValueChange={(value) => handleFilterChange("userId", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Members</SelectItem>
            {project.members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(new Date(filters.startDate), "PPP")
                ) : (
                  <span>Start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={(date) =>
                  handleFilterChange(
                    "startDate",
                    date ? date.toISOString() : ""
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(new Date(filters.endDate), "PPP")
                ) : (
                  <span>End date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={(date) =>
                  handleFilterChange("endDate", date ? date.toISOString() : "")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 rounded-lg border p-4"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.image || undefined} />
              <AvatarFallback>
                {activity.user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{" "}
                {getActivityMessage(activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No activity found
              </p>
            </div>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
