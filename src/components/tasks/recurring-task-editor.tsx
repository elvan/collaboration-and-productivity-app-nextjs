import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface RecurringTaskEditorProps {
  taskId: string
  onUpdate?: () => void
}

export function RecurringTaskEditor({
  taskId,
  onUpdate,
}: RecurringTaskEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [frequency, setFrequency] = useState("weekly")
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1])
  const [monthDay, setMonthDay] = useState<number>()
  const [endDate, setEndDate] = useState<Date>()
  const queryClient = useQueryClient()

  const { data: recurring, isLoading } = useQuery({
    queryKey: ["recurring-task", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/recurring`)
      if (!response.ok) {
        throw new Error("Failed to fetch recurring settings")
      }
      return response.json()
    },
  })

  const updateRecurring = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tasks/${taskId}/recurring`, {
        method: recurring ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error("Failed to update recurring settings")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recurring-task", taskId],
      })
      setIsOpen(false)
      onUpdate?.()
    },
  })

  const deleteRecurring = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/recurring`,
        {
          method: "DELETE",
        }
      )
      if (!response.ok) {
        throw new Error("Failed to delete recurring settings")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recurring-task", taskId],
      })
      onUpdate?.()
    },
  })

  const handleSubmit = () => {
    updateRecurring.mutate({
      frequency,
      interval,
      daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      monthDay: frequency === "monthly" ? monthDay : undefined,
      endDate,
    })
  }

  const weekDays = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 0, label: "Sun" },
  ]

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Clock className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!recurring) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Make Recurring
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Recurring Schedule</h3>
          <p className="text-sm text-muted-foreground">
            This task repeats{" "}
            {recurring.frequency === "daily" && "every day"}
            {recurring.frequency === "weekly" &&
              `every ${recurring.interval} week(s) on ${recurring.daysOfWeek
                .map(
                  (day: number) =>
                    weekDays.find((d) => d.value === day)?.label
                )
                .join(", ")}`}
            {recurring.frequency === "monthly" &&
              `on day ${recurring.monthDay} of every ${recurring.interval} month(s)`}
            {recurring.endDate &&
              ` until ${format(
                new Date(recurring.endDate),
                "PPP"
              )}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(true)}
          >
            Edit Schedule
          </Button>
          <Button
            variant="ghost"
            onClick={() => deleteRecurring.mutate()}
          >
            Remove
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recurring Schedule</DialogTitle>
            <DialogDescription>
              Set up a recurring schedule for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={setFrequency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>
                Every{" "}
                {frequency === "daily"
                  ? "day(s)"
                  : frequency === "weekly"
                  ? "week(s)"
                  : "month(s)"}
              </Label>
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) =>
                  setInterval(parseInt(e.target.value))
                }
              />
            </div>

            {frequency === "weekly" && (
              <div className="grid gap-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day.value}
                      variant={
                        daysOfWeek.includes(day.value)
                          ? "default"
                          : "outline"
                      }
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setDaysOfWeek(
                          daysOfWeek.includes(day.value)
                            ? daysOfWeek.filter(
                                (d) => d !== day.value
                              )
                            : [...daysOfWeek, day.value]
                        )
                      }
                    >
                      {day.label.charAt(0)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {frequency === "monthly" && (
              <div className="grid gap-2">
                <Label>Day of month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={monthDay}
                  onChange={(e) =>
                    setMonthDay(parseInt(e.target.value))
                  }
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
