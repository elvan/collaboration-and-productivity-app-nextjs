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
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"

const taskListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  filters: z.object({
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    assignee: z.array(z.string()).optional(),
    dueDate: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional(),
    customFields: z.record(z.any()).optional(),
  }).optional(),
  viewSettings: z.object({
    groupBy: z.string().optional(),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    showSubtasks: z.boolean().optional(),
    showCompletedTasks: z.boolean().optional(),
    columns: z.array(z.string()).optional(),
  }).optional(),
})

interface TaskListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof taskListSchema>) => Promise<void>
  defaultValues?: z.infer<typeof taskListSchema>
  customFields: Array<{
    id: string
    name: string
    type: string
  }>
  projectMembers: Array<{
    id: string
    name: string
  }>
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
]

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const groupByOptions = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "dueDate", label: "Due Date" },
]

const sortByOptions = [
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
]

const columnOptions = [
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "dueDate", label: "Due Date" },
  { value: "progress", label: "Progress" },
]

export function TaskListDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  customFields,
  projectMembers,
}: TaskListDialogProps) {
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<z.infer<typeof taskListSchema>>({
    resolver: zodResolver(taskListSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      filters: {},
      viewSettings: {
        showSubtasks: true,
        showCompletedTasks: true,
      },
    },
  })

  async function handleSubmit(data: z.infer<typeof taskListSchema>) {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save task list:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Create"} Task List
          </DialogTitle>
          <DialogDescription>
            Configure a task list with custom filters and view settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="view">View Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter list name" {...field} />
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
                          placeholder="Enter list description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(Icons).map(([name, Icon]) => (
                              <SelectItem key={name} value={name}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="status">
                    <AccordionTrigger>Status</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="filters.status"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-wrap gap-2">
                              {statusOptions.map((status) => {
                                const selected = field.value?.includes(
                                  status.value
                                )
                                return (
                                  <Button
                                    key={status.value}
                                    type="button"
                                    variant={
                                      selected ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => {
                                      const current = field.value || []
                                      field.onChange(
                                        selected
                                          ? current.filter(
                                              (s) => s !== status.value
                                            )
                                          : [...current, status.value]
                                      )
                                    }}
                                  >
                                    {status.label}
                                  </Button>
                                )
                              })}
                            </div>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="priority">
                    <AccordionTrigger>Priority</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="filters.priority"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-wrap gap-2">
                              {priorityOptions.map((priority) => {
                                const selected = field.value?.includes(
                                  priority.value
                                )
                                return (
                                  <Button
                                    key={priority.value}
                                    type="button"
                                    variant={
                                      selected ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => {
                                      const current = field.value || []
                                      field.onChange(
                                        selected
                                          ? current.filter(
                                              (p) => p !== priority.value
                                            )
                                          : [...current, priority.value]
                                      )
                                    }}
                                  >
                                    {priority.label}
                                  </Button>
                                )
                              })}
                            </div>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="assignee">
                    <AccordionTrigger>Assignee</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="filters.assignee"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-wrap gap-2">
                              {projectMembers.map((member) => {
                                const selected = field.value?.includes(
                                  member.id
                                )
                                return (
                                  <Button
                                    key={member.id}
                                    type="button"
                                    variant={
                                      selected ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => {
                                      const current = field.value || []
                                      field.onChange(
                                        selected
                                          ? current.filter(
                                              (id) => id !== member.id
                                            )
                                          : [...current, member.id]
                                      )
                                    }}
                                  >
                                    {member.name}
                                  </Button>
                                )
                              })}
                            </div>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dueDate">
                    <AccordionTrigger>Due Date</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="filters.dueDate.start"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="filters.dueDate.end"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {customFields.map((field) => (
                    <AccordionItem key={field.id} value={field.id}>
                      <AccordionTrigger>{field.name}</AccordionTrigger>
                      <AccordionContent>
                        <FormField
                          control={form.control}
                          name={`filters.customFields.${field.id}`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormControl>
                                {field.type === "select" ? (
                                  <Select
                                    value={formField.value}
                                    onValueChange={formField.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input {...formField} />
                                )}
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="view" className="space-y-4">
                <FormField
                  control={form.control}
                  name="viewSettings.groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group By</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grouping" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groupByOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="viewSettings.sortBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort By</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sorting" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortByOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="viewSettings.sortDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Direction</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asc">
                              Ascending
                            </SelectItem>
                            <SelectItem value="desc">
                              Descending
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="viewSettings.columns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visible Columns</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {columnOptions.map((column) => {
                          const selected = field.value?.includes(
                            column.value
                          )
                          return (
                            <Button
                              key={column.value}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const current = field.value || []
                                field.onChange(
                                  selected
                                    ? current.filter(
                                        (c) => c !== column.value
                                      )
                                    : [...current, column.value]
                                )
                              }}
                            >
                              {column.label}
                            </Button>
                          )
                        })}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="viewSettings.showSubtasks"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Show Subtasks</FormLabel>
                          <FormDescription>
                            Display subtasks in the list
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
                    name="viewSettings.showCompletedTasks"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Show Completed</FormLabel>
                          <FormDescription>
                            Display completed tasks
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
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {defaultValues ? "Update" : "Create"} List
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
