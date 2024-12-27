"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getFilteredNotifications, NotificationFilters } from "@/lib/notification"
import { useDebounce } from "@/lib/hooks"

const categories = [
  { label: "Project", value: "project" },
  { label: "Task", value: "task" },
  { label: "Member", value: "member" },
  { label: "System", value: "system" },
]

const priorities = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
]

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [filters, setFilters] = React.useState<NotificationFilters>({})
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [page, setPage] = React.useState(1)
  const [notifications, setNotifications] = React.useState<any>({
    groups: [],
    ungrouped: [],
    pagination: { total: 0, pages: 0, current: 1, pageSize: 20 },
  })
  const [loading, setLoading] = React.useState(true)

  const fetchNotifications = React.useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const result = await getFilteredNotifications(
        session.user.id,
        { ...filters, search: debouncedSearch },
        page
      )
      setNotifications(result)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, filters, debouncedSearch, page])

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleCategoryChange = (checked: boolean, category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...(prev.categories || []), category]
        : (prev.categories || []).filter((c) => c !== category),
    }))
    setPage(1)
  }

  const handlePriorityChange = (checked: boolean, priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: checked
        ? [...(prev.priority || []), priority]
        : (prev.priority || []).filter((p) => p !== priority),
    }))
    setPage(1)
  }

  const handleDateChange = (dates: Date[] | undefined) => {
    if (!dates?.length) {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }))
    } else if (dates.length === 2) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0],
        endDate: dates[1],
      }))
    }
    setPage(1)
  }

  const handleReadFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      read: value === "all" ? undefined : value === "read",
    }))
    setPage(1)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select
              value={
                filters.read === undefined
                  ? "all"
                  : filters.read
                  ? "read"
                  : "unread"
              }
              onValueChange={handleReadFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-8">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Categories</h3>
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={(filters.categories || []).includes(category.value)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(!!checked, category.value)
                    }
                  />
                  <label
                    htmlFor={`category-${category.value}`}
                    className="text-sm"
                  >
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Priority</h3>
            <div className="flex flex-wrap gap-4">
              {priorities.map((priority) => (
                <div key={priority.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority.value}`}
                    checked={(filters.priority || []).includes(priority.value)}
                    onCheckedChange={(checked) =>
                      handlePriorityChange(!!checked, priority.value)
                    }
                  />
                  <label
                    htmlFor={`priority-${priority.value}`}
                    className="text-sm"
                  >
                    {priority.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Date Range</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    filters.endDate ? (
                      <>
                        {format(filters.startDate, "LLL dd, y")} -{" "}
                        {format(filters.endDate, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.startDate, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.startDate}
                  selected={{
                    from: filters.startDate,
                    to: filters.endDate,
                  }}
                  onSelect={(range: any) =>
                    handleDateChange(
                      range
                        ? [range.from, range.to].filter(Boolean)
                        : undefined
                    )
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : notifications.groups.length === 0 &&
            notifications.ungrouped.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <>
              {/* Grouped Notifications */}
              {notifications.groups.map((group: any) => (
                <div
                  key={group.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted px-4 py-2 flex items-center justify-between">
                    <h3 className="font-medium">
                      {group.category} ({group.notifications.length})
                    </h3>
                  </div>
                  <div className="divide-y">
                    {group.notifications.map((notification: any) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Ungrouped Notifications */}
              {notifications.ungrouped.map((notification: any) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}

              {/* Pagination */}
              {notifications.pagination.pages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {notifications.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(notifications.pagination.pages, p + 1)
                      )
                    }
                    disabled={page === notifications.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationItem({ notification }: { notification: any }) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors",
        !notification.read && "bg-accent/20"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              "text-sm",
              !notification.read && "font-medium"
            )}
          >
            {notification.title}
          </h4>
          <Badge
            variant={
              notification.priority === "high"
                ? "destructive"
                : notification.priority === "low"
                ? "secondary"
                : "default"
            }
            className="text-xs"
          >
            {notification.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(notification.createdAt), "PPp")}
        </p>
      </div>
    </div>
  )
}
