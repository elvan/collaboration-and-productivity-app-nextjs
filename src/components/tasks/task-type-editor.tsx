import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Box, Plus, Settings } from "lucide-react"
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
import { CustomFieldEditor } from "./custom-field-editor"

interface TaskTypeEditorProps {
  projectId: string
  value?: string
  onChange?: (value: string) => void
}

export function TaskTypeEditor({
  projectId,
  value,
  onChange,
}: TaskTypeEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isFieldsOpen, setIsFieldsOpen] = useState(false)
  const [newType, setNewType] = useState({
    name: "",
    description: "",
    color: "#808080",
    icon: "box",
  })
  const queryClient = useQueryClient()

  const { data: taskTypes, isLoading } = useQuery({
    queryKey: ["task-types", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/task-types`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch task types")
      }
      return response.json()
    },
  })

  const createTaskType = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/projects/${projectId}/task-types`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create task type")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-types", projectId],
      })
      setIsCreateOpen(false)
      setNewType({
        name: "",
        description: "",
        color: "#808080",
        icon: "box",
      })
    },
  })

  const selectedType = taskTypes?.find(
    (t: any) => t.id === value
  )

  const getTypeIcon = (type: any) => {
    return type.icon ? (
      Icons[type.icon as keyof typeof Icons]({
        className: cn(
          "h-4 w-4",
          type.color
            ? `text-[${type.color}]`
            : "text-muted-foreground"
        ),
      })
    ) : (
      <Box
        className={cn(
          "h-4 w-4",
          type.color
            ? `text-[${type.color}]`
            : "text-muted-foreground"
        )}
      />
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Box className="mr-2 h-4 w-4 animate-pulse" />
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
              {selectedType ? (
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedType)}
                  <span>{selectedType.name}</span>
                </div>
              ) : (
                <span>Select type</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {taskTypes?.map((type: any) => (
              <SelectItem
                key={type.id}
                value={type.id}
                className="flex items-center gap-2"
              >
                {getTypeIcon(type)}
                <span>{type.name}</span>
              </SelectItem>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Type
            </Button>
          </SelectContent>
        </Select>

        {selectedType && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setIsFieldsOpen(true)}
              >
                Custom Fields...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit Type...</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete Type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task Type</DialogTitle>
            <DialogDescription>
              Add a new type to categorize tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newType.name}
                onChange={(e) =>
                  setNewType({
                    ...newType,
                    name: e.target.value,
                  })
                }
                placeholder="Task type name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={newType.description}
                onChange={(e) =>
                  setNewType({
                    ...newType,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker
                color={newType.color}
                onChange={(color) =>
                  setNewType({
                    ...newType,
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
              onClick={() => createTaskType.mutate(newType)}
            >
              Create Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedType && (
        <Dialog
          open={isFieldsOpen}
          onOpenChange={setIsFieldsOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Custom Fields</DialogTitle>
              <DialogDescription>
                Manage custom fields for {selectedType.name} tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <CustomFieldEditor
                taskTypeId={selectedType.id}
                onClose={() => setIsFieldsOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
