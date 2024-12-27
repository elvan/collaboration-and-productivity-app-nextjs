import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  automationRuleSchema,
  automationTriggerSchema,
  automationConditionSchema,
  automationActionSchema,
  type AutomationRule,
} from "@/lib/tasks/automation-service"

interface AutomationRuleEditorProps {
  rule?: AutomationRule
  onSave: (rule: AutomationRule) => void
  onCancel: () => void
}

export function AutomationRuleEditor({
  rule,
  onSave,
  onCancel,
}: AutomationRuleEditorProps) {
  const [conditions, setConditions] = useState(rule?.conditions || [])
  const [actions, setActions] = useState(rule?.actions || [])

  const form = useForm<AutomationRule>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues: {
      name: rule?.name || "",
      description: rule?.description || "",
      enabled: rule?.enabled ?? true,
      trigger: rule?.trigger || "on_create",
      conditions: conditions,
      actions: actions,
      metadata: rule?.metadata || {},
    },
  })

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: "",
        operator: "equals",
        value: "",
      },
    ])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const addAction = () => {
    setActions([
      ...actions,
      {
        type: "update_field",
        params: {},
      },
    ])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const onSubmit = (data: AutomationRule) => {
    onSave({
      ...data,
      conditions,
      actions,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic settings for this automation rule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rule name" />
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
                      {...field}
                      placeholder="Describe what this rule does"
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
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Enable this rule</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trigger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trigger" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {automationTriggerSchema.options.map(
                        (trigger) => (
                          <SelectItem
                            key={trigger}
                            value={trigger}
                          >
                            {trigger
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1)
                              )
                              .join(" ")}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
            <CardDescription>
              Define when this rule should run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg border p-4"
              >
                <div className="grid flex-1 gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>Field</FormLabel>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          const newConditions = [...conditions]
                          newConditions[index].field = value
                          setConditions(newConditions)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="status">
                            Status
                          </SelectItem>
                          <SelectItem value="assignee">
                            Assignee
                          </SelectItem>
                          <SelectItem value="priority">
                            Priority
                          </SelectItem>
                          <SelectItem value="dueDate">
                            Due Date
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Operator</FormLabel>
                      <Select
                        value={condition.operator}
                        onValueChange={(value: any) => {
                          const newConditions = [...conditions]
                          newConditions[index].operator = value
                          setConditions(newConditions)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {automationConditionSchema.shape.operator.options.map(
                            (operator) => (
                              <SelectItem
                                key={operator}
                                value={operator}
                              >
                                {operator
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...conditions]
                            newConditions[index].value =
                              e.target.value
                            setConditions(newConditions)
                          }}
                          placeholder="Enter value"
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addCondition}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Define what should happen when the conditions are met.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg border p-4"
              >
                <div className="grid flex-1 gap-4">
                  <FormItem>
                    <FormLabel>Action Type</FormLabel>
                    <Select
                      value={action.type}
                      onValueChange={(value: any) => {
                        const newActions = [...actions]
                        newActions[index].type = value
                        setActions(newActions)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {automationActionSchema.shape.type.options.map(
                          (type) => (
                            <SelectItem key={type} value={type}>
                              {type
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1)
                                )
                                .join(" ")}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <div className="space-y-4">
                    {action.type === "update_field" && (
                      <>
                        <FormItem>
                          <FormLabel>Field</FormLabel>
                          <Select
                            value={action.params.field}
                            onValueChange={(value) => {
                              const newActions = [...actions]
                              newActions[index].params.field =
                                value
                              setActions(newActions)
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="status">
                                Status
                              </SelectItem>
                              <SelectItem value="assignee">
                                Assignee
                              </SelectItem>
                              <SelectItem value="priority">
                                Priority
                              </SelectItem>
                              <SelectItem value="dueDate">
                                Due Date
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>

                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input
                              value={action.params.value}
                              onChange={(e) => {
                                const newActions = [...actions]
                                newActions[index].params.value =
                                  e.target.value
                                setActions(newActions)
                              }}
                              placeholder="Enter value"
                            />
                          </FormControl>
                        </FormItem>
                      </>
                    )}

                    {action.type === "send_notification" && (
                      <>
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              value={action.params.title}
                              onChange={(e) => {
                                const newActions = [...actions]
                                newActions[index].params.title =
                                  e.target.value
                                setActions(newActions)
                              }}
                              placeholder="Notification title"
                            />
                          </FormControl>
                        </FormItem>

                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              value={action.params.message}
                              onChange={(e) => {
                                const newActions = [...actions]
                                newActions[index].params.message =
                                  e.target.value
                                setActions(newActions)
                              }}
                              placeholder="Notification message"
                            />
                          </FormControl>
                        </FormItem>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addAction}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Action
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure advanced options for this automation rule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="metadata.schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule (Cron Expression)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="*/15 * * * *"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Run this rule on a schedule using cron
                    syntax
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata.maxRuns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Runs</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Limit the number of times this rule can
                    run
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata.cooldown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cooldown Period (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Minimum time between rule executions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">Save Rule</Button>
        </div>
      </form>
    </Form>
  )
}
