import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Circle, Plus } from "lucide-react"
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
import { ColorPicker } from "@/components/ui/color-picker"
import { Icons } from "@/components/icons"

interface TaskStatusEditorProps {
  projectId: string
  value?: string
  onChange?: (value: string) => void
}

export function TaskStatusEditor({
  projectId,
  value,
  onChange,
}: TaskStatusEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newStatus, setNewStatus] = useState({
    name: "",
    category: "todo",
    color: "#808080",
    icon: "circle",
    description: "",
  })
  const queryClient = useQueryClient()

  const { data: statuses, isLoading } = useQuery({
    queryKey: ["task-statuses", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/task-statuses`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch statuses")
      }
      return response.json()
    },
  })

  const createStatus = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/projects/${projectId}/task-statuses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create status")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-statuses", projectId],
      })
      setIsCreateOpen(false)
      setNewStatus({
        name: "",
        category: "todo",
        color: "#808080",
        icon: "circle",
        description: "",
      })
    },
  })

  const selectedStatus = statuses?.find(
    (s: any) => s.id === value
  )

  const getStatusIcon = (status: any) => {
    return status.icon ? (
      Icons[status.icon as keyof typeof Icons]({
        className: cn(
          "h-4 w-4",
          status.color
            ? `text-[${status.color}]`
            : "text-muted-foreground"
        ),
      })
    ) : (
      <Circle
        className={cn(
          "h-4 w-4",
          status.color
            ? `text-[${status.color}]`
            : "text-muted-foreground"
        )}
      />
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Circle className="mr-2 h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    )
  }

  const statusCategories = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
    { value: "canceled", label: "Canceled" },
    { value: "blocked", label: "Blocked" },
    { value: "review", label: "Review" },
  ]

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue>
            {selectedStatus ? (
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedStatus)}
                <span>{selectedStatus.name}</span>
              </div>
            ) : (
              <span>Select status</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusCategories.map((category) => (
            <div key={category.value}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {category.label}
              </div>
              {statuses
                ?.filter(
                  (status: any) =>
                    status.category === category.value
                )
                .map((status: any) => (
                  <SelectItem
                    key={status.id}
                    value={status.id}
                    className="flex items-center gap-2"
                  >
                    {getStatusIcon(status)}
                    <span>{status.name}</span>
                  </SelectItem>
                ))}
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Status
          </Button>
        </SelectContent>
      </Select>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Status</DialogTitle>
            <DialogDescription>
              Add a new status for tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newStatus.name}
                onChange={(e) =>
                  setNewStatus({
                    ...newStatus,
                    name: e.target.value,
                  })
                }
                placeholder="Status name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={newStatus.category}
                onValueChange={(value) =>
                  setNewStatus({
                    ...newStatus,
                    category: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusCategories.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker
                color={newStatus.color}
                onChange={(color) =>
                  setNewStatus({
                    ...newStatus,
                    color,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={newStatus.description}
                onChange={(e) =>
                  setNewStatus({
                    ...newStatus,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
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
              onClick={() => createStatus.mutate(newStatus)}
            >
              Create Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
