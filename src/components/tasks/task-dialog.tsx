import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
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
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Clock,
  Link as LinkIcon,
  ListChecks,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { TaskDependencies } from "./task-dependencies"
import { TaskComments } from "./task-comments"
import { TaskAttachments } from "./task-attachments"
import { TaskRelationships } from "./task-relationships"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ActivityLog } from "@/components/activity-log"
import { taskService } from "@/services/task-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | null
  labels?: string[]
  customFields?: Record<string, any>
  assignee?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  _count?: {
    subtasks: number
    dependencies: number
    dependents: number
  }
}

interface TaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (taskId: string, data: any) => Promise<void>
  projectId: string
  currentUserId: string
}

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
]

interface CustomField {
  id: string
  name: string
  type: string
  required: boolean
  description?: string
  options?: { value: string; label: string; color?: string }[]
}

export function TaskDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
  projectId,
  currentUserId,
}: TaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [labels, setLabels] = useState<string[]>(task.labels || [])
  const [newLabel, setNewLabel] = useState("")
  const [dependencies, setDependencies] = useState([])
  const [dependents, setDependents] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [activeTab, setActiveTab] = useState<string>("details")
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [relationships, setRelationships] = useState([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<any>({})
  const router = useRouter();

  useEffect(() => {
    if (open && projectId) {
      loadCustomFields()
      if (task) {
        loadCustomFieldValues()
      }
    }
  }, [open, projectId, task])

  async function loadCustomFields() {
    try {
      const fields = await getProjectCustomFields(projectId)
      setCustomFields(fields)
    } catch (error) {
      console.error("Failed to load custom fields:", error)
    }
  }

  async function loadCustomFieldValues() {
    if (!task) return
    try {
      const values = await getTaskCustomFieldValues(task.id)
      const valueMap = values.reduce(
        (acc, v) => ({
          ...acc,
          [v.customField.id]: v.value,
        }),
        {}
      )
      setCustomFieldValues(valueMap)
    } catch (error) {
      console.error("Failed to load custom field values:", error)
    }
  }

  async function handleCustomFieldChange(fieldId: string, value: any) {
    try {
      await setCustomFieldValue(task!.id, fieldId, value)
      setCustomFieldValues((prev: any) => ({
        ...prev,
        [fieldId]: value,
      }))
    } catch (error) {
      console.error("Failed to update custom field value:", error)
    }
  }

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      assigneeId: task.assignee?.id,
      labels: task.labels || [],
      customFields: task.customFields || {},
    },
  })

  async function onSubmit(data: z.infer<typeof taskSchema>) {
    try {
      setIsLoading(true);
      if (task) {
        await onUpdate(task.id, {
          ...data,
          customFields: customFieldValues,
          relationships,
        });
      } else {
        await taskService.createTask(projectId, {
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        });
        toast.success("Task created successfully");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  }

  const addLabel = () => {
    if (newLabel && !labels.includes(newLabel)) {
      const updatedLabels = [...labels, newLabel]
      setLabels(updatedLabels)
      form.setValue("labels", updatedLabels)
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    const updatedLabels = labels.filter((l) => l !== label)
    setLabels(updatedLabels)
    form.setValue("labels", updatedLabels)
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

  const handleAddDependency = () => {
    // implement add dependency logic
  }

  const handleRemoveDependency = () => {
    // implement remove dependency logic
  }

  const handleAddComment = () => {
    // implement add comment logic
  }

  const handleDeleteComment = () => {
    // implement delete comment logic
  }

  const handleAddAttachment = () => {
    // implement add attachment logic
  }

  const handleDeleteAttachment = () => {
    // implement delete attachment logic
  }

  const createTaskRelationship = () => {
    // implement create task relationship logic
  }

  const deleteTaskRelationship = () => {
    // implement delete task relationship logic
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {task ? "Edit Task" : "Create Task"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STATUS_OPTIONS.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
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
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((priority) => (
                                <SelectItem
                                  key={priority.value}
                                  value={priority.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2 w-2 rounded-full ${getPriorityColor(
                                        priority.value
                                      )}`}
                                    />
                                    {priority.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Labels</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => removeLabel(label)}
                            className="ml-1 rounded-full hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Add a label"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addLabel()
                          }
                        }}
                      />
                      <Button type="button" onClick={addLabel} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="dependencies">
            <TaskDependencies
              task={task}
              dependencies={dependencies}
              dependents={dependents}
              availableTasks={availableTasks}
              onAddDependency={handleAddDependency}
              onRemoveDependency={handleRemoveDependency}
            />
          </TabsContent>

          <TabsContent value="relationships">
            <TaskRelationships
              task={task}
              projectId={projectId}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="custom-fields">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 p-4">
                {customFields.map((field) => (
                  <FormItem key={field.id}>
                    <FormLabel>
                      {field.name}
                      {field.required && (
                        <span className="text-destructive"> *</span>
                      )}
                    </FormLabel>
                    {field.description && (
                      <FormDescription>{field.description}</FormDescription>
                    )}
                    <FormControl>
                      {field.type === "text" && (
                        <Input
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                        />
                      )}
                      {field.type === "number" && (
                        <Input
                          type="number"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(
                              field.id,
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      )}
                      {field.type === "date" && (
                        <Input
                          type="datetime-local"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                        />
                      )}
                      {field.type === "select" && (
                        <Select
                          value={customFieldValues[field.id] || ""}
                          onValueChange={(value) =>
                            handleCustomFieldChange(field.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex items-center gap-2">
                                  {option.color && (
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: option.color,
                                      }}
                                    />
                                  )}
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {field.type === "multiselect" && (
                        <div className="flex flex-wrap gap-2">
                          {field.options?.map((option) => {
                            const selected = (
                              customFieldValues[field.id] || []
                            ).includes(option.value)
                            return (
                              <Button
                                key={option.value}
                                type="button"
                                variant={selected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const currentValues =
                                    customFieldValues[field.id] || []
                                  const newValues = selected
                                    ? currentValues.filter(
                                        (v: string) => v !== option.value
                                      )
                                    : [...currentValues, option.value]
                                  handleCustomFieldChange(field.id, newValues)
                                }}
                              >
                                {option.color && (
                                  <div
                                    className="w-2 h-2 rounded-full mr-2"
                                    style={{
                                      backgroundColor: option.color,
                                    }}
                                  />
                                )}
                                {option.label}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                      {field.type === "user" && (
                        <Select
                          value={customFieldValues[field.id] || ""}
                          onValueChange={(value) =>
                            handleCustomFieldChange(field.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {project?.members.map((member) => (
                              <SelectItem
                                key={member.id}
                                value={member.id}
                              >
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {field.type === "url" && (
                        <Input
                          type="url"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                        />
                      )}
                      {field.type === "email" && (
                        <Input
                          type="email"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                        />
                      )}
                      {field.type === "phone" && (
                        <Input
                          type="tel"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                        />
                      )}
                      {field.type === "currency" && (
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input
                            type="number"
                            className="pl-7"
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                field.id,
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                          />
                        </div>
                      )}
                    </FormControl>
                  </FormItem>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments">
            <TaskComments
              taskId={task?.id}
              comments={comments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          </TabsContent>

          <TabsContent value="attachments">
            <TaskAttachments
              taskId={task?.id}
              attachments={attachments}
              onAddAttachment={handleAddAttachment}
              onDeleteAttachment={handleDeleteAttachment}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog taskId={task?.id} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" type="button">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  the task and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      // await onDelete(task.id)
                      onOpenChange(false)
                    } catch (error) {
                      console.error("Failed to delete task:", error)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
