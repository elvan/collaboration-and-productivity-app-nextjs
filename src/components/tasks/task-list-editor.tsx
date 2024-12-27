import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  LayoutGrid,
  List,
  Calendar,
  GanttChart,
  Timeline,
  Plus,
  Filter,
  ArrowUpDown,
  Group,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorPicker } from "@/components/ui/color-picker"
import { Icons } from "@/components/icons"

interface TaskListEditorProps {
  projectId: string
  value?: string
  onChange?: (value: string) => void
}

export function TaskListEditor({
  projectId,
  value,
  onChange,
}: TaskListEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newList, setNewList] = useState({
    name: "",
    description: "",
    viewType: "list",
    color: "#808080",
    icon: "list",
    filters: {},
    sortOrder: {},
    groupBy: "",
  })
  const queryClient = useQueryClient()

  const { data: lists, isLoading } = useQuery({
    queryKey: ["task-lists", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/task-lists`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch lists")
      }
      return response.json()
    },
  })

  const createList = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/projects/${projectId}/task-lists`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create list")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-lists", projectId],
      })
      setIsCreateOpen(false)
      setNewList({
        name: "",
        description: "",
        viewType: "list",
        color: "#808080",
        icon: "list",
        filters: {},
        sortOrder: {},
        groupBy: "",
      })
    },
  })

  const selectedList = lists?.find((l: any) => l.id === value)

  const getViewIcon = (viewType: string) => {
    switch (viewType) {
      case "board":
        return <LayoutGrid className="h-4 w-4" />
      case "calendar":
        return <Calendar className="h-4 w-4" />
      case "gantt":
        return <GanttChart className="h-4 w-4" />
      case "timeline":
        return <Timeline className="h-4 w-4" />
      default:
        return <List className="h-4 w-4" />
    }
  }

  const viewTypes = [
    { value: "list", label: "List", icon: List },
    { value: "board", label: "Board", icon: LayoutGrid },
    { value: "calendar", label: "Calendar", icon: Calendar },
    { value: "gantt", label: "Gantt", icon: GanttChart },
    { value: "timeline", label: "Timeline", icon: Timeline },
  ]

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <List className="mr-2 h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={value}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {selectedList ? (
                <div className="flex items-center gap-2">
                  {getViewIcon(selectedList.viewType)}
                  <span>{selectedList.name}</span>
                </div>
              ) : (
                <span>Select list</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {lists?.map((list: any) => (
              <SelectItem
                key={list.id}
                value={list.id}
                className="flex items-center gap-2"
              >
                {getViewIcon(list.viewType)}
                <span>{list.name}</span>
              </SelectItem>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </SelectContent>
        </Select>

        {selectedList && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Configure Filters...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                <DropdownMenuItem>
                  Sort by Priority
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Sort by Due Date
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Configure Sort...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Group className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Group by Status</DropdownMenuItem>
                <DropdownMenuItem>
                  Group by Priority
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Group by Assignee
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>No Grouping</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
            <DialogDescription>
              Add a new list to organize tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newList.name}
                onChange={(e) =>
                  setNewList({
                    ...newList,
                    name: e.target.value,
                  })
                }
                placeholder="List name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={newList.description}
                onChange={(e) =>
                  setNewList({
                    ...newList,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label>View Type</Label>
              <Select
                value={newList.viewType}
                onValueChange={(value) =>
                  setNewList({
                    ...newList,
                    viewType: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="flex items-center gap-2"
                    >
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker
                color={newList.color}
                onChange={(color) =>
                  setNewList({
                    ...newList,
                    color,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createList.mutate(newList)}
            >
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
