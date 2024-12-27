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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Check, ChevronsUpDown, Link2, Link2Off, Plus } from "lucide-react"

interface Task {
  id: string
  title: string
  status: string
  priority: string
}

interface TaskDependenciesProps {
  task: Task
  dependencies: Task[]
  dependents: Task[]
  availableTasks: Task[]
  onAddDependency: (taskId: string) => Promise<void>
  onRemoveDependency: (taskId: string) => Promise<void>
}

export function TaskDependencies({
  task,
  dependencies,
  dependents,
  availableTasks,
  onAddDependency,
  onRemoveDependency,
}: TaskDependenciesProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredTasks = availableTasks.filter(
    (t) =>
      t.id !== task.id &&
      !dependencies.find((d) => d.id === t.id) &&
      !dependents.find((d) => d.id === t.id)
  )

  const handleAddDependency = async (taskId: string) => {
    try {
      setIsLoading(true)
      await onAddDependency(taskId)
      setValue("")
      setOpen(false)
    } catch (error) {
      console.error("Failed to add dependency:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDependency = async (taskId: string) => {
    try {
      setIsLoading(true)
      await onRemoveDependency(taskId)
    } catch (error) {
      console.error("Failed to remove dependency:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="space-y-4">
      {/* Dependencies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dependencies</CardTitle>
              <CardDescription>
                Tasks that must be completed before this task
              </CardDescription>
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="justify-between"
                  disabled={isLoading || filteredTasks.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dependency
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search tasks..." />
                  <CommandEmpty>No tasks found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {filteredTasks.map((task) => (
                        <CommandItem
                          key={task.id}
                          value={task.id}
                          onSelect={() => handleAddDependency(task.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              value === task.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-1 items-center justify-between">
                            <span>{task.title}</span>
                            <Badge
                              className={`${getPriorityColor(
                                task.priority
                              )} text-white`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-8 w-8" />
                <span>No dependencies</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{dep.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {dep.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getPriorityColor(dep.priority)} text-white`}
                    >
                      {dep.priority}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                        >
                          <Link2Off className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Dependency?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this dependency? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveDependency(dep.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Dependent Tasks</CardTitle>
          <CardDescription>
            Tasks that depend on this task being completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-8 w-8" />
                <span>No dependent tasks</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{dep.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {dep.status}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${getPriorityColor(dep.priority)} text-white`}
                  >
                    {dep.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
