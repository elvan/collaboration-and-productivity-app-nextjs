import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"

const dependencySchema = z.object({
  sourceTaskId: z.string(),
  targetTaskId: z.string(),
  type: z.enum([
    "blocks",
    "blocked_by",
    "depends_on",
    "required_for",
    "related_to",
    "duplicates",
    "duplicated_by",
  ]),
  metadata: z
    .object({
      description: z.string().optional(),
      delay: z.number().optional(),
      progress: z.number().optional(),
      status: z.string().optional(),
    })
    .optional(),
})

interface TaskDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof dependencySchema>) => Promise<void>
  sourceTask: {
    id: string
    title: string
  }
  availableTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    assignee?: {
      name: string
    }
  }>
  defaultValues?: z.infer<typeof dependencySchema>
}

const dependencyTypes = [
  {
    value: "blocks",
    label: "Blocks",
    description: "This task blocks the target task",
    icon: Icons.lock,
  },
  {
    value: "blocked_by",
    label: "Blocked By",
    description: "This task is blocked by the target task",
    icon: Icons.lockOpen,
  },
  {
    value: "depends_on",
    label: "Depends On",
    description: "This task depends on the target task",
    icon: Icons.arrowDown,
  },
  {
    value: "required_for",
    label: "Required For",
    description: "This task is required for the target task",
    icon: Icons.arrowUp,
  },
  {
    value: "related_to",
    label: "Related To",
    description: "This task is related to the target task",
    icon: Icons.link,
  },
  {
    value: "duplicates",
    label: "Duplicates",
    description: "This task duplicates the target task",
    icon: Icons.copy,
  },
  {
    value: "duplicated_by",
    label: "Duplicated By",
    description: "This task is duplicated by the target task",
    icon: Icons.copy,
  },
]

export function TaskDependencyDialog({
  open,
  onOpenChange,
  onSubmit,
  sourceTask,
  availableTasks,
  defaultValues,
}: TaskDependencyDialogProps) {
  const [selectedType, setSelectedType] = useState<string | undefined>(
    defaultValues?.type
  )

  const form = useForm<z.infer<typeof dependencySchema>>({
    resolver: zodResolver(dependencySchema),
    defaultValues: defaultValues || {
      sourceTaskId: sourceTask.id,
      metadata: {},
    },
  })

  async function handleSubmit(data: z.infer<typeof dependencySchema>) {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save dependency:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Create"} Task Dependency
          </DialogTitle>
          <DialogDescription>
            Define the relationship between tasks
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Source Task</CardTitle>
                  <CardDescription>
                    The task that will have the dependency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Icons.task className="h-4 w-4" />
                    <span>{sourceTask.title}</span>
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependency Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedType(value)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dependency type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dependencyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{type.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetTaskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Task</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {availableTasks
                            .filter((task) => task.id !== sourceTask.id)
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span>{task.title}</span>
                                    <Badge variant="outline">
                                      {task.status}
                                    </Badge>
                                    <Badge variant="outline">
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  {task.assignee && (
                                    <span className="text-xs text-muted-foreground">
                                      Assigned to {task.assignee.name}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="metadata.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the dependency relationship"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(selectedType === "blocks" ||
                    selectedType === "blocked_by") && (
                    <FormField
                      control={form.control}
                      name="metadata.delay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Number of days to delay the dependent task
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(selectedType === "depends_on" ||
                    selectedType === "required_for") && (
                    <FormField
                      control={form.control}
                      name="metadata.progress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Progress of the dependency completion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {defaultValues ? "Update" : "Create"} Dependency
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
