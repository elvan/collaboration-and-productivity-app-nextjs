import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowDownUp,
  Check,
  ChevronsUpDown,
  Filter,
  List,
  Plus,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { TaskList } from "./task-list"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  assignee?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  labels?: string[]
  parentId?: string | null
  children?: Task[]
}

interface TaskListManagerProps {
  tasks: Task[]
  projectId: string
  projectMembers: Array<{ id: string; name: string }>
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, data: any) => Promise<void>
  onBulkUpdate: (taskIds: string[], data: any) => Promise<void>
}

export function TaskListManager({
  tasks,
  projectId,
  projectMembers,
  onDelete,
  onUpdate,
  onBulkUpdate,
}: TaskListManagerProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([])
  const [labelFilter, setLabelFilter] = useState<string[]>([])
  const [sortField, setSortField] = useState("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showHierarchy, setShowHierarchy] = useState(true)

  const filteredTasks = useMemo(() => {
    let result = tasks

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((task) => statusFilter.includes(task.status))
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      result = result.filter((task) => priorityFilter.includes(task.priority))
    }

    // Assignee filter
    if (assigneeFilter.length > 0) {
      result = result.filter(
        (task) => task.assignee && assigneeFilter.includes(task.assignee.id)
      )
    }

    // Label filter
    if (labelFilter.length > 0) {
      result = result.filter(
        (task) =>
          task.labels &&
          labelFilter.some((label) => task.labels?.includes(label))
      )
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let aValue = a[sortField as keyof Task]
      let bValue = b[sortField as keyof Task]

      if (sortField === "assignee") {
        aValue = a.assignee?.name
        bValue = b.assignee?.name
      }

      if (aValue === undefined || aValue === null) return sortDirection === "asc" ? 1 : -1
      if (bValue === undefined || bValue === null) return sortDirection === "asc" ? -1 : 1

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    // Organize into hierarchy if enabled
    if (showHierarchy) {
      const taskMap = new Map<string, Task>()
      const rootTasks: Task[] = []

      result.forEach((task) => {
        taskMap.set(task.id, { ...task, children: [] })
      })

      taskMap.forEach((task) => {
        if (task.parentId && taskMap.has(task.parentId)) {
          const parent = taskMap.get(task.parentId)!
          parent.children = parent.children || []
          parent.children.push(task)
        } else {
          rootTasks.push(task)
        }
      })

      result = rootTasks
    }

    return result
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    sortField,
    sortDirection,
    showHierarchy,
  ])

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.length === 0) return

    switch (action) {
      case "delete":
        await Promise.all(selectedTasks.map((id) => onDelete(id)))
        break
      case "status":
        await onBulkUpdate(selectedTasks, { status: "in_progress" })
        break
      case "priority":
        await onBulkUpdate(selectedTasks, { priority: "high" })
        break
      // Add more bulk actions as needed
    }

    setSelectedTasks([])
  }

  const allLabels = useMemo(() => {
    const labelSet = new Set<string>()
    tasks.forEach((task) => {
      task.labels?.forEach((label) => labelSet.add(label))
    })
    return Array.from(labelSet)
  }, [tasks])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Manage and organize your project tasks
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHierarchy(!showHierarchy)}
            >
              <List className="mr-2 h-4 w-4" />
              {showHierarchy ? "Flat View" : "Hierarchy View"}
            </Button>
            {selectedTasks.length > 0 && (
              <Select onValueChange={handleBulkAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                  <SelectItem value="status">Set Status</SelectItem>
                  <SelectItem value="priority">Set Priority</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {["todo", "in_progress", "done"].map((status) => (
                        <Badge
                          key={status}
                          variant={
                            statusFilter.includes(status)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            setStatusFilter((prev) =>
                              prev.includes(status)
                                ? prev.filter((s) => s !== status)
                                : [...prev, status]
                            )
                          }
                        >
                          {status.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Priority</h4>
                    <div className="flex flex-wrap gap-2">
                      {["low", "medium", "high", "urgent"].map((priority) => (
                        <Badge
                          key={priority}
                          variant={
                            priorityFilter.includes(priority)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            setPriorityFilter((prev) =>
                              prev.includes(priority)
                                ? prev.filter((p) => p !== priority)
                                : [...prev, priority]
                            )
                          }
                        >
                          {priority}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Assignee</h4>
                    <ScrollArea className="h-[100px]">
                      {projectMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`assignee-${member.id}`}
                            checked={assigneeFilter.includes(member.id)}
                            onCheckedChange={(checked) =>
                              setAssigneeFilter((prev) =>
                                checked
                                  ? [...prev, member.id]
                                  : prev.filter((id) => id !== member.id)
                              )
                            }
                          />
                          <label
                            htmlFor={`assignee-${member.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {member.name}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Labels</h4>
                    <ScrollArea className="h-[100px]">
                      {allLabels.map((label) => (
                        <div
                          key={label}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`label-${label}`}
                            checked={labelFilter.includes(label)}
                            onCheckedChange={(checked) =>
                              setLabelFilter((prev) =>
                                checked
                                  ? [...prev, label]
                                  : prev.filter((l) => l !== label)
                              )
                            }
                          />
                          <label
                            htmlFor={`label-${label}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Select
              value={sortField}
              onValueChange={setSortField}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="assignee">Assignee</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {sortDirection === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Task List */}
          <TaskList
            tasks={filteredTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onDelete={onDelete}
            onUpdate={onUpdate}
            selectedTasks={selectedTasks}
            onSelectTask={(taskId) =>
              setSelectedTasks((prev) =>
                prev.includes(taskId)
                  ? prev.filter((id) => id !== taskId)
                  : [...prev, taskId]
              )
            }
            showHierarchy={showHierarchy}
          />
        </div>
      </CardContent>
    </Card>
  )
}
