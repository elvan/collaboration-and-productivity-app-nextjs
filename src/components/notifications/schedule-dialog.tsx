"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const scheduleSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  recipients: z.union([
    z.array(z.string()),
    z.record(z.any()),
  ]),
  schedule: z.object({
    type: z.enum(["one-time", "recurring"]),
    date: z.string().optional(),
    recurring: z
      .object({
        type: z.enum(["daily", "weekly", "monthly"]),
        time: z.string(),
        days: z.array(z.number()).optional(),
        timezone: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
      })
      .optional(),
  }),
  data: z.record(z.any()).optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: ScheduleFormValues
  onSubmit: (values: ScheduleFormValues) => Promise<void>
  templates: Array<{ id: string; name: string }>
}

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onSubmit,
  templates,
}: ScheduleDialogProps) {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule || {
      schedule: {
        type: "one-time",
      },
    },
  })

  const scheduleType = form.watch("schedule.type")
  const recurringType = form.watch("schedule.recurring.type")

  React.useEffect(() => {
    if (open) {
      form.reset(schedule || {
        schedule: {
          type: "one-time",
        },
      })
    }
  }, [open, schedule, form])

  const handleSubmit = async (values: ScheduleFormValues) => {
    try {
      await onSubmit(values)
      form.reset()
    } catch (error) {
      console.error("Failed to submit schedule:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Schedule" : "Create Schedule"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id}
                        >
                          {template.name}
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
              name="schedule.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type</FormLabel>
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
                      <SelectItem value="one-time">One Time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {scheduleType === "one-time" && (
              <FormField
                control={form.control}
                name="schedule.date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date and Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP p")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? new Date(field.value)
                              : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            onChange={(e) => {
                              const date = field.value
                                ? new Date(field.value)
                                : new Date()
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number)
                              date.setHours(hours, minutes)
                              field.onChange(date.toISOString())
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {scheduleType === "recurring" && (
              <>
                <FormField
                  control={form.control}
                  name="schedule.recurring.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Type</FormLabel>
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
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule.recurring.time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(recurringType === "weekly" ||
                  recurringType === "monthly") && (
                  <FormField
                    control={form.control}
                    name="schedule.recurring.days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {recurringType === "weekly"
                            ? "Days of Week"
                            : "Days of Month"}
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {recurringType === "weekly"
                              ? [0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant={
                                      field.value?.includes(day)
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => {
                                      const days =
                                        field.value || []
                                      field.onChange(
                                        days.includes(day)
                                          ? days.filter(
                                              (d) => d !== day
                                            )
                                          : [...days, day]
                                      )
                                    }}
                                  >
                                    {
                                      [
                                        "Sun",
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                      ][day]
                                    }
                                  </Button>
                                ))
                              : Array.from({ length: 31 }, (_, i) => (
                                  <Button
                                    key={i + 1}
                                    type="button"
                                    variant={
                                      field.value?.includes(i + 1)
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => {
                                      const days =
                                        field.value || []
                                      field.onChange(
                                        days.includes(i + 1)
                                          ? days.filter(
                                              (d) => d !== i + 1
                                            )
                                          : [...days, i + 1]
                                      )
                                    }}
                                  >
                                    {i + 1}
                                  </Button>
                                ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="schedule.recurring.timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        e.g., "America/New_York" or "Asia/Tokyo"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="schedule.recurring.startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value &&
                                    "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    new Date(field.value),
                                    "PPP"
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(date?.toISOString())
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schedule.recurring.endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value &&
                                    "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    new Date(field.value),
                                    "PPP"
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(date?.toISOString())
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

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
                {schedule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
