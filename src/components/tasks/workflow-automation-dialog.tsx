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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"

const triggerTypes = [
  {
    value: "status_changed",
    label: "Status Changed",
    description: "Triggered when a task's status is changed",
  },
  {
    value: "priority_changed",
    label: "Priority Changed",
    description: "Triggered when a task's priority is changed",
  },
  {
    value: "assignee_changed",
    label: "Assignee Changed",
    description: "Triggered when a task is assigned to someone",
  },
  {
    value: "due_date_changed",
    label: "Due Date Changed",
    description: "Triggered when a task's due date is changed",
  },
  {
    value: "comment_added",
    label: "Comment Added",
    description: "Triggered when a comment is added to a task",
  },
  {
    value: "attachment_added",
    label: "Attachment Added",
    description: "Triggered when a file is attached to a task",
  },
  {
    value: "custom_field_changed",
    label: "Custom Field Changed",
    description: "Triggered when a custom field value is changed",
  },
]

const actionTypes = [
  {
    value: "update_task",
    label: "Update Task",
    description: "Update task properties",
    params: ["status", "priority", "dueDate"],
  },
  {
    value: "create_task",
    label: "Create Task",
    description: "Create a new related task",
    params: ["title", "description", "assigneeId"],
  },
  {
    value: "assign_task",
    label: "Assign Task",
    description: "Assign the task to someone",
    params: ["assigneeId"],
  },
  {
    value: "send_notification",
    label: "Send Notification",
    description: "Send an in-app notification",
    params: ["title", "content", "userId"],
  },
  {
    value: "send_email",
    label: "Send Email",
    description: "Send an email notification",
    params: ["to", "subject", "body"],
  },
  {
    value: "update_custom_field",
    label: "Update Custom Field",
    description: "Update a custom field value",
    params: ["customFieldId", "value"],
  },
  {
    value: "trigger_webhook",
    label: "Trigger Webhook",
    description: "Send data to an external webhook",
    params: ["url", "method", "headers", "body"],
  },
]

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  trigger: z.object({
    type: z.string(),
    conditions: z.record(z.any()).optional(),
  }),
  actions: z.array(
    z.object({
      type: z.string(),
      params: z.record(z.any()),
    })
  ),
})

interface WorkflowAutomationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof workflowSchema>) => Promise<void>
  defaultValues?: z.infer<typeof workflowSchema>
  projectMembers: Array<{ id: string; name: string }>
  customFields: Array<{ id: string; name: string; type: string }>
}

export function WorkflowAutomationDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  projectMembers,
  customFields,
}: WorkflowAutomationDialogProps) {
  const [actions, setActions] = useState<any[]>(defaultValues?.actions || [])

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      enabled: true,
      trigger: {
        type: "",
        conditions: {},
      },
      actions: [],
    },
  })

  async function handleSubmit(data: z.infer<typeof workflowSchema>) {
    try {
      await onSubmit({
        ...data,
        actions,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save workflow automation:", error)
    }
  }

  function addAction() {
    setActions([...actions, { type: "", params: {} }])
  }

  function removeAction(index: number) {
    setActions(actions.filter((_, i) => i !== index))
  }

  function updateAction(index: number, field: string, value: any) {
    const updatedActions = [...actions]
    if (field === "type") {
      const actionType = actionTypes.find((t) => t.value === value)
      updatedActions[index] = {
        type: value,
        params: actionType?.params.reduce(
          (acc, param) => ({ ...acc, [param]: "" }),
          {}
        ),
      }
    } else {
      updatedActions[index] = {
        ...updatedActions[index],
        params: {
          ...updatedActions[index].params,
          [field]: value,
        },
      }
    }
    setActions(updatedActions)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Create"} Workflow Automation
          </DialogTitle>
          <DialogDescription>
            Automate task updates and notifications based on events
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter workflow name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter workflow description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <FormDescription>
                      Enable or disable this workflow automation
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

            <FormField
              control={form.control}
              name="trigger.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {triggerTypes.map((type) => (
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Actions</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAction}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {actions.map((action, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <CardTitle>Action {index + 1}</CardTitle>
                          <CardDescription>
                            Configure action parameters
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Select
                          value={action.type}
                          onValueChange={(value) =>
                            updateAction(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select action type" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map((type) => (
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

                        {action.type && (
                          <div className="space-y-4">
                            {actionTypes
                              .find((t) => t.value === action.type)
                              ?.params.map((param) => (
                                <div key={param} className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {param}
                                  </label>
                                  {param === "assigneeId" ? (
                                    <Select
                                      value={action.params[param]}
                                      onValueChange={(value) =>
                                        updateAction(index, param, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select assignee" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {projectMembers.map((member) => (
                                          <SelectItem
                                            key={member.id}
                                            value={member.id}
                                          >
                                            {member.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : param === "customFieldId" ? (
                                    <Select
                                      value={action.params[param]}
                                      onValueChange={(value) =>
                                        updateAction(index, param, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select custom field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {customFields.map((field) => (
                                          <SelectItem
                                            key={field.id}
                                            value={field.id}
                                          >
                                            {field.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      value={action.params[param] || ""}
                                      onChange={(e) =>
                                        updateAction(index, param, e.target.value)
                                      }
                                      placeholder={`Enter ${param}`}
                                    />
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
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
                {defaultValues ? "Update" : "Create"} Workflow
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
