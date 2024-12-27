import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Link as LinkIcon, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: string
  priority: string
}

interface TaskRelationship {
  id: string
  type: string
  sourceTaskId: string
  targetTaskId: string
  metadata?: any
  sourceTask?: Task
  targetTask?: Task
}

interface TaskRelationshipsProps {
  taskId: string
  projectId: string
  relationships: {
    outgoing: TaskRelationship[]
    incoming: TaskRelationship[]
  }
  availableTasks: Task[]
  onCreateRelationship: (data: {
    type: string
    sourceTaskId: string
    targetTaskId: string
  }) => Promise<void>
  onDeleteRelationship: (
    sourceTaskId: string,
    targetTaskId: string,
    type: string
  ) => Promise<void>
}

export function TaskRelationships({
  taskId,
  projectId,
  relationships,
  availableTasks,
  onCreateRelationship,
  onDeleteRelationship,
}: TaskRelationshipsProps) {
  const router = useRouter()
  const [isAddingRelationship, setIsAddingRelationship] = useState(false)
  const [newRelationType, setNewRelationType] = useState<string>("")
  const [newTargetTaskId, setNewTargetTaskId] = useState<string>("")

  const relationshipTypes = [
    {
      value: "parent_child",
      label: "Parent/Child",
      description: "Hierarchical relationship between tasks",
    },
    {
      value: "blocks",
      label: "Blocks",
      description: "This task blocks the completion of another task",
    },
    {
      value: "depends_on",
      label: "Depends On",
      description: "This task depends on another task",
    },
    {
      value: "related_to",
      label: "Related To",
      description: "Tasks are related but not dependent",
    },
  ]

  const statusColors: Record<string, string> = {
    todo: "bg-slate-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
  }

  const priorityColors: Record<string, string> = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }

  async function handleCreateRelationship() {
    if (!newRelationType || !newTargetTaskId) return

    try {
      await onCreateRelationship({
        type: newRelationType,
        sourceTaskId: taskId,
        targetTaskId: newTargetTaskId,
      })
      setIsAddingRelationship(false)
      setNewRelationType("")
      setNewTargetTaskId("")
      router.refresh()
    } catch (error) {
      console.error("Failed to create relationship:", error)
    }
  }

  async function handleDeleteRelationship(
    sourceTaskId: string,
    targetTaskId: string,
    type: string
  ) {
    try {
      await onDeleteRelationship(sourceTaskId, targetTaskId, type)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete relationship:", error)
    }
  }

  function renderTaskBadge(task: Task) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{task.title}</span>
        <Badge className={cn("capitalize", statusColors[task.status])}>
          {task.status.replace("_", " ")}
        </Badge>
        <Badge className={cn("capitalize", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Task Relationships</CardTitle>
          <CardDescription>
            Manage task dependencies and relationships
          </CardDescription>
        </div>
        <Dialog open={isAddingRelationship} onOpenChange={setIsAddingRelationship}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Task Relationship</DialogTitle>
              <DialogDescription>
                Create a new relationship between tasks
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select
                  value={newRelationType}
                  onValueChange={setNewRelationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Task</label>
                <Select
                  value={newTargetTaskId}
                  onValueChange={setNewTargetTaskId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {availableTasks
                        .filter((t) => t.id !== taskId)
                        .map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {renderTaskBadge(task)}
                          </SelectItem>
                        ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingRelationship(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRelationship}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Outgoing Relationships */}
          {relationships.outgoing.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Outgoing</h4>
              {relationships.outgoing.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {relationshipTypes.find((t) => t.value === rel.type)?.label}
                    </Badge>
                    <ArrowRight className="h-4 w-4" />
                    {rel.targetTask && renderTaskBadge(rel.targetTask)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDeleteRelationship(
                        rel.sourceTaskId,
                        rel.targetTaskId,
                        rel.type
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Incoming Relationships */}
          {relationships.incoming.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Incoming</h4>
              {relationships.incoming.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    {rel.sourceTask && renderTaskBadge(rel.sourceTask)}
                    <ArrowRight className="h-4 w-4" />
                    <Badge variant="outline">
                      {relationshipTypes.find((t) => t.value === rel.type)?.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDeleteRelationship(
                        rel.sourceTaskId,
                        rel.targetTaskId,
                        rel.type
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {relationships.outgoing.length === 0 &&
            relationships.incoming.length === 0 && (
              <div className="flex h-[100px] items-center justify-center rounded-lg border border-dashed">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  No relationships
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
