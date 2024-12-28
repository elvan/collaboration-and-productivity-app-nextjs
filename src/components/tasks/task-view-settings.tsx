"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { GripVertical } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  viewType: z.string(),
  defaultGroupBy: z.string().optional(),
  defaultSortBy: z.string().optional(),
  visibleColumns: z.array(z.string()),
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.string(),
      value: z.string(),
    })
  ),
  autoRefresh: z.boolean(),
  refreshInterval: z.number().min(5).optional(),
})

interface TaskViewSettingsProps {
  view: any
  userId: string
}

export function TaskViewSettings({ view, userId }: TaskViewSettingsProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: view.name,
      description: view.description || "",
      viewType: view.viewType,
      defaultGroupBy: view.defaultGroupBy || "",
      defaultSortBy: view.defaultSortBy || "",
      visibleColumns: view.visibleColumns || [],
      filters: view.filters || [],
      autoRefresh: view.autoRefresh || false,
      refreshInterval: view.refreshInterval || 30,
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/tasks/views/${view.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update view")
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating view:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const availableColumns = [
    { id: "title", name: "Title" },
    { id: "status", name: "Status" },
    { id: "priority", name: "Priority" },
    { id: "assignee", name: "Assignee" },
    { id: "dueDate", name: "Due Date" },
    { id: "labels", name: "Labels" },
    { id: "createdAt", name: "Created At" },
    { id: "updatedAt", name: "Updated At" },
  ]

  const handleColumnReorder = (result: any) => {
    if (!result.destination) return

    const items = Array.from(form.getValues("visibleColumns"))
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    form.setValue("visibleColumns", items)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">View Settings</h1>
        <p className="text-muted-foreground">
          Configure how your tasks are displayed and organized
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for this view
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="viewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="board">Board View</SelectItem>
                        <SelectItem value="calendar">Calendar View</SelectItem>
                        <SelectItem value="timeline">Timeline View</SelectItem>
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
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Configure how tasks are displayed in this view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultGroupBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Group By</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="assignee">Assignee</SelectItem>
                        <SelectItem value="labels">Labels</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultSortBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Sort By</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="createdAt">Created At</SelectItem>
                        <SelectItem value="updatedAt">Updated At</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Visible Columns</FormLabel>
                <DragDropContext onDragEnd={handleColumnReorder}>
                  <Droppable droppableId="columns">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {form.watch("visibleColumns").map((columnId, index) => {
                          const column = availableColumns.find(
                            (c) => c.id === columnId
                          )
                          if (!column) return null
                          return (
                            <Draggable
                              key={columnId}
                              draggableId={columnId}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center gap-2 rounded-md border p-2"
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-move"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span>{column.name}</span>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Configure how this view handles real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="autoRefresh"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto Refresh</FormLabel>
                      <FormDescription>
                        Automatically refresh tasks in this view
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
              {form.watch("autoRefresh") && (
                <FormField
                  control={form.control}
                  name="refreshInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refresh Interval (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
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
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/tasks/views")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
