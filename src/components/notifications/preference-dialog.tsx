"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { Loader2, Plus, X } from "lucide-react"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const preferenceSchema = z.object({
  channel: z.string().min(1, "Channel is required"),
  type: z.string().min(1, "Type is required"),
  enabled: z.boolean().default(true),
  frequency: z.enum(["immediate", "daily_digest", "weekly_digest"]),
  schedule: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
        days: z.array(z.number()).optional(),
      })
    )
    .optional(),
})

type PreferenceFormValues = z.infer<typeof preferenceSchema>

interface PreferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preference?: PreferenceFormValues
  onSubmit: (values: PreferenceFormValues) => Promise<void>
  channels: Array<{ value: string; label: string }>
  types: Array<{ value: string; label: string }>
}

export function PreferenceDialog({
  open,
  onOpenChange,
  preference,
  onSubmit,
  channels,
  types,
}: PreferenceDialogProps) {
  const form = useForm<PreferenceFormValues>({
    resolver: zodResolver(preferenceSchema),
    defaultValues: preference || {
      enabled: true,
      frequency: "immediate",
      schedule: [],
    },
  })

  const [newWindow, setNewWindow] = React.useState({
    start: "",
    end: "",
    days: [] as number[],
  })

  React.useEffect(() => {
    if (open) {
      form.reset(
        preference || {
          enabled: true,
          frequency: "immediate",
          schedule: [],
        }
      )
    }
  }, [open, preference, form])

  const handleSubmit = async (values: PreferenceFormValues) => {
    try {
      await onSubmit(values)
      form.reset()
    } catch (error) {
      console.error("Failed to submit preference:", error)
    }
  }

  const addTimeWindow = () => {
    if (newWindow.start && newWindow.end) {
      const currentSchedule = form.getValues("schedule") || []
      form.setValue("schedule", [
        ...currentSchedule,
        {
          start: newWindow.start,
          end: newWindow.end,
          days: newWindow.days.length > 0 ? newWindow.days : undefined,
        },
      ])
      setNewWindow({ start: "", end: "", days: [] })
    }
  }

  const removeTimeWindow = (index: number) => {
    const currentSchedule = form.getValues("schedule") || []
    form.setValue(
      "schedule",
      currentSchedule.filter((_, i) => i !== index)
    )
  }

  const toggleDay = (day: number) => {
    setNewWindow((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {preference ? "Edit Preference" : "Create Preference"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {channels.map((channel) => (
                        <SelectItem key={channel.value} value={channel.value}>
                          {channel.label}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <FormDescription>
                      Receive notifications for this preference
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
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily_digest">Daily Digest</SelectItem>
                      <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Time Windows</FormLabel>
              <div className="flex flex-wrap gap-2">
                {form.watch("schedule")?.map((window, index) => (
                  <Badge key={index} variant="secondary">
                    {window.start} - {window.end}
                    {window.days &&
                      ` (${window.days
                        .map(
                          (d) =>
                            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]
                        )
                        .join(", ")})`}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0"
                      onClick={() => removeTimeWindow(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Start Time</FormLabel>
                    <Input
                      type="time"
                      value={newWindow.start}
                      onChange={(e) =>
                        setNewWindow((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <FormLabel>End Time</FormLabel>
                    <Input
                      type="time"
                      value={newWindow.end}
                      onChange={(e) =>
                        setNewWindow((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Days (Optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={
                            newWindow.days.includes(index)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => toggleDay(index)}
                        >
                          {day}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTimeWindow}
                  disabled={!newWindow.start || !newWindow.end}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Window
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {preference ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
