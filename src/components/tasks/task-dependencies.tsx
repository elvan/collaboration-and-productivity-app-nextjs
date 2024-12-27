import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { TaskStatusBadge } from "./task-status-badge"

interface TaskDependenciesProps {
  taskId: string
  projectId: string
}

export function TaskDependencies({
  taskId,
  projectId,
}: TaskDependenciesProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("blocks")
  const queryClient = useQueryClient()

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/dependencies`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch dependencies")
      }
      return response.json()
    },
  })

  const { data: searchResults } = useQuery({
    queryKey: ["task-search", projectId, searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/search?q=${encodeURIComponent(
          searchQuery
        )}`
      )
      if (!response.ok) {
        throw new Error("Failed to search tasks")
      }
      return response.json()
    },
    enabled: searchQuery.length > 2,
  })

  const addDependency = useMutation({
    mutationFn: async ({
      dependsOnId,
      type,
    }: {
      dependsOnId: string
      type: string
    }) => {
      const response = await fetch(
        `/api/tasks/${taskId}/dependencies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dependsOnId, type }),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to add dependency")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-dependencies", taskId],
      })
      setIsAddOpen(false)
      setSearchOpen(false)
      setSearchQuery("")
    },
  })

  const removeDependency = useMutation({
    mutationFn: async (dependencyId: string) => {
      const response = await fetch(
        `/api/tasks/${taskId}/dependencies/${dependencyId}`,
        {
          method: "DELETE",
        }
      )
      if (!response.ok) {
        throw new Error("Failed to remove dependency")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-dependencies", taskId],
      })
    },
  })

  const dependencyTypes = [
    { value: "blocks", label: "Blocks" },
    { value: "relates_to", label: "Relates to" },
    { value: "duplicates", label: "Duplicates" },
    { value: "required_by", label: "Required by" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Dependencies</h3>
          <p className="text-sm text-muted-foreground">
            Manage task dependencies and relationships.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dependency
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      ) : dependencies?.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <Link2 className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No dependencies yet
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {dependencies?.map((dep: any) => (
            <div
              key={dep.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline">{dep.type}</Badge>
                <div>
                  <p className="font-medium">{dep.dependsOn.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TaskStatusBadge status={dep.dependsOn.status} />
                    <span>#{dep.dependsOn.number}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeDependency.mutate(dep.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Link this task to another task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Relationship Type</Label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {dependencyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Search Tasks</Label>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setSearchOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Select Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search tasks..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No tasks found.</CommandEmpty>
          <CommandGroup>
            {searchResults?.map((task: any) => (
              <CommandItem
                key={task.id}
                onSelect={() => {
                  addDependency.mutate({
                    dependsOnId: task.id,
                    type: selectedType,
                  })
                }}
              >
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <span>#{task.number}</span>
                  <span>{task.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
