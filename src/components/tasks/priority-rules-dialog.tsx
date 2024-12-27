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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"

const priorityLevels = [
  {
    value: "critical",
    label: "Critical",
    description: "Highest priority tasks that need immediate attention",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Tasks that require urgent attention",
  },
  {
    value: "high",
    label: "High",
    description: "Important tasks with high priority",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Tasks with normal priority",
  },
  {
    value: "low",
    label: "Low",
    description: "Tasks with low priority",
  },
]

const ruleSchema = z.object({
  projectId: z.string(),
  conditions: z.object({
    dueDate: z
      .object({
        days: z.number().min(1),
        priority: z.string(),
      })
      .optional(),
    dependencies: z
      .object({
        priority: z.string(),
        escalate: z.boolean(),
      })
      .optional(),
    inactivity: z
      .object({
        days: z.number().min(1),
        priority: z.string(),
      })
      .optional(),
  }),
  enabled: z.boolean().default(true),
})

interface PriorityRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof ruleSchema>) => Promise<void>
  defaultValues?: z.infer<typeof ruleSchema>
  projectId: string
}

export function PriorityRulesDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  projectId,
}: PriorityRulesDialogProps) {
  const [dueDateEnabled, setDueDateEnabled] = useState(
    !!defaultValues?.conditions.dueDate
  )
  const [dependenciesEnabled, setDependenciesEnabled] = useState(
    !!defaultValues?.conditions.dependencies
  )
  const [inactivityEnabled, setInactivityEnabled] = useState(
    !!defaultValues?.conditions.inactivity
  )

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: defaultValues || {
      projectId,
      conditions: {},
      enabled: true,
    },
  })

  async function handleSubmit(data: z.infer<typeof ruleSchema>) {
    try {
      // Clean up conditions based on enabled state
      const conditions: any = {}
      if (dueDateEnabled && data.conditions.dueDate) {
        conditions.dueDate = data.conditions.dueDate
      }
      if (dependenciesEnabled && data.conditions.dependencies) {
        conditions.dependencies = data.conditions.dependencies
      }
      if (inactivityEnabled && data.conditions.inactivity) {
        conditions.inactivity = data.conditions.inactivity
      }

      await onSubmit({
        ...data,
        conditions,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save priority rule:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Create"} Priority Rule
          </DialogTitle>
          <DialogDescription>
            Configure automatic priority updates based on conditions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <FormDescription>
                      Enable or disable this priority rule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Due Date Condition</CardTitle>
                    <CardDescription>
                      Update priority based on due date proximity
                    </CardDescription>
                  </div>
                  <Switch
                    checked={dueDateEnabled}
                    onCheckedChange={setDueDateEnabled}
                  />
                </div>
              </CardHeader>
              {dueDateEnabled && (
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="conditions.dueDate.days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days Before Due</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conditions.dueDate.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalate To Priority</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityLevels.map((priority) => (
                              <SelectItem
                                key={priority.value}
                                value={priority.value}
                              >
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {priority.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {priority.description}
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
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Dependencies Condition</CardTitle>
                    <CardDescription>
                      Update priority based on dependent tasks
                    </CardDescription>
                  </div>
                  <Switch
                    checked={dependenciesEnabled}
                    onCheckedChange={setDependenciesEnabled}
                  />
                </div>
              </CardHeader>
              {dependenciesEnabled && (
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="conditions.dependencies.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dependency Priority Threshold</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityLevels.map((priority) => (
                              <SelectItem
                                key={priority.value}
                                value={priority.value}
                              >
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {priority.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {priority.description}
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
                    name="conditions.dependencies.escalate"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel>Auto-escalate Priority</FormLabel>
                          <FormDescription>
                            Automatically increase priority when dependencies are
                            high priority
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Inactivity Condition</CardTitle>
                    <CardDescription>
                      Update priority based on task inactivity
                    </CardDescription>
                  </div>
                  <Switch
                    checked={inactivityEnabled}
                    onCheckedChange={setInactivityEnabled}
                  />
                </div>
              </CardHeader>
              {inactivityEnabled && (
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="conditions.inactivity.days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days of Inactivity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conditions.inactivity.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalate To Priority</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityLevels.map((priority) => (
                              <SelectItem
                                key={priority.value}
                                value={priority.value}
                              >
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {priority.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {priority.description}
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
                </CardContent>
              )}
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {defaultValues ? "Update" : "Create"} Rule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
