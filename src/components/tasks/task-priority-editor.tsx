import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Flag, Plus } from "lucide-react"
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

interface TaskPriorityEditorProps {
  projectId: string
  value?: string
  onChange?: (value: string) => void
}

export function TaskPriorityEditor({
  projectId,
  value,
  onChange,
}: TaskPriorityEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newPriority, setNewPriority] = useState({
    name: "",
    level: 3,
    color: "#ff0000",
    icon: "flag",
    description: "",
  })
  const queryClient = useQueryClient()

  const { data: priorities, isLoading } = useQuery({
    queryKey: ["task-priorities", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/task-priorities`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch priorities")
      }
      return response.json()
    },
  })

  const createPriority = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/projects/${projectId}/task-priorities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create priority")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-priorities", projectId],
      })
      setIsCreateOpen(false)
      setNewPriority({
        name: "",
        level: 3,
        color: "#ff0000",
        icon: "flag",
        description: "",
      })
    },
  })

  const selectedPriority = priorities?.find(
    (p: any) => p.id === value
  )

  const getPriorityIcon = (priority: any) => {
    switch (priority.level) {
      case 1:
        return (
          <Flag
            className={cn(
              "h-4 w-4",
              priority.color
                ? `text-[${priority.color}]`
                : "text-muted-foreground"
            )}
          />
        )
      case 5:
        return (
          <AlertCircle
            className={cn(
              "h-4 w-4",
              priority.color
                ? `text-[${priority.color}]`
                : "text-muted-foreground"
            )}
          />
        )
      default:
        return priority.icon ? (
          Icons[priority.icon as keyof typeof Icons]({
            className: cn(
              "h-4 w-4",
              priority.color
                ? `text-[${priority.color}]`
                : "text-muted-foreground"
            ),
          })
        ) : (
          <Flag
            className={cn(
              "h-4 w-4",
              priority.color
                ? `text-[${priority.color}]`
                : "text-muted-foreground"
            )}
          />
        )
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Flag className="mr-2 h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue>
            {selectedPriority ? (
              <div className="flex items-center gap-2">
                {getPriorityIcon(selectedPriority)}
                <span>{selectedPriority.name}</span>
              </div>
            ) : (
              <span>Select priority</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {priorities?.map((priority: any) => (
            <SelectItem
              key={priority.id}
              value={priority.id}
              className="flex items-center gap-2"
            >
              {getPriorityIcon(priority)}
              <span>{priority.name}</span>
            </SelectItem>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Priority
          </Button>
        </SelectContent>
      </Select>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Priority Level</DialogTitle>
            <DialogDescription>
              Add a new priority level for tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newPriority.name}
                onChange={(e) =>
                  setNewPriority({
                    ...newPriority,
                    name: e.target.value,
                  })
                }
                placeholder="Priority name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Level (1-5)</Label>
              <Select
                value={String(newPriority.level)}
                onValueChange={(value) =>
                  setNewPriority({
                    ...newPriority,
                    level: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium Low</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="4">Medium High</SelectItem>
                  <SelectItem value="5">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker
                color={newPriority.color}
                onChange={(color) =>
                  setNewPriority({
                    ...newPriority,
                    color,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={newPriority.description}
                onChange={(e) =>
                  setNewPriority({
                    ...newPriority,
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
              onClick={() => createPriority.mutate(newPriority)}
            >
              Create Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
