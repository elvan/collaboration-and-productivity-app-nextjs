import { useState } from "react"
import { useSession } from "next-auth/react"
import { Play, Pause, Clock, Loader2, ListTree, Square } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatDuration } from "@/lib/utils"

interface TimeTrackingButtonProps {
  taskId: string
  onTimeUpdate?: () => void
}

export function TimeTrackingButton({
  taskId,
  onTimeUpdate,
}: TimeTrackingButtonProps) {
  const { data: session } = useSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [billable, setBillable] = useState(false)
  const [billableRate, setBillableRate] = useState<number>()
  const [category, setCategory] = useState("development")
  const [isPaused, setIsPaused] = useState(false)
  const [pauseReason, setPauseReason] = useState("")
  const queryClient = useQueryClient()

  const { data: activeEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ["time-entry", "active", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/active`)
      if (!response.ok) throw new Error("Failed to fetch active time entry")
      return response.json()
    },
  })

  const { data: timeStats } = useQuery({
    queryKey: ["time-stats", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/stats`)
      if (!response.ok) throw new Error("Failed to fetch time statistics")
      return response.json()
    },
  })

  const { data: categories } = useQuery({
    queryKey: ["time-categories"],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries/categories`)
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  const startTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          billable,
          billableRate,
          category,
        }),
      })
      if (!response.ok) throw new Error("Failed to start time tracking")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entry", "active", taskId] })
      queryClient.invalidateQueries({ queryKey: ["time-stats", taskId] })
      setIsDialogOpen(false)
      resetForm()
      onTimeUpdate?.()
      toast.success("Time tracking started")
    },
  })

  const stopTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/stop`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to stop time tracking")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entry", "active", taskId] })
      queryClient.invalidateQueries({ queryKey: ["time-stats", taskId] })
      onTimeUpdate?.()
      toast.success("Time tracking stopped")
    },
  })

  const pauseTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: pauseReason }),
      })
      if (!response.ok) throw new Error("Failed to pause time tracking")
      return response.json()
    },
    onSuccess: () => {
      setIsPaused(true)
      setPauseReason("")
      toast.success("Time tracking paused")
    },
  })

  const resumeTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/resume`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to resume time tracking")
      return response.json()
    },
    onSuccess: () => {
      setIsPaused(false)
      toast.success("Time tracking resumed")
    },
  })

  const addBreakdown = useMutation({
    mutationFn: async (breakdown: { category: string; duration: number }) => {
      const response = await fetch(
        `/api/tasks/${taskId}/time-entries/${activeEntry.id}/breakdowns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(breakdown),
        }
      )
      if (!response.ok) throw new Error("Failed to add time breakdown")
      return response.json()
    },
    onSuccess: () => {
      setIsBreakdownOpen(false)
      toast.success("Time breakdown added")
    },
  })

  const resetForm = () => {
    setDescription("")
    setBillable(false)
    setBillableRate(undefined)
    setCategory("development")
    setPauseReason("")
  }

  if (isLoadingEntry) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  const renderTimeEntryDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Time Tracking</DialogTitle>
          <DialogDescription>
            Add details about what you're working on.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="billable"
                checked={billable}
                onCheckedChange={setBillable}
              />
              <Label htmlFor="billable">Billable time</Label>
            </div>
            {billable && (
              <div className="flex-1">
                <Label htmlFor="rate">Hourly Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  value={billableRate}
                  onChange={(e) => setBillableRate(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => startTracking.mutate()}>Start Timer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renderBreakdownDialog = () => (
    <Dialog open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Breakdown</DialogTitle>
          <DialogDescription>
            Break down your time into different categories.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" min="1" placeholder="30" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsBreakdownOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              addBreakdown.mutate({ category, duration: 30 * 60 })
            }
          >
            Add Breakdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (activeEntry) {
    const duration = Math.floor(
      (Date.now() - new Date(activeEntry.startTime).getTime()) / 1000
    )

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                isPaused ? "border-yellow-500" : "animate-pulse",
                billable && "border-green-500"
              )}
            >
              {isPaused ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {formatDuration(duration)}
              {billable && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ${((duration / 3600) * (billableRate || 0)).toFixed(2)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPaused ? (
              <DropdownMenuItem onClick={() => resumeTracking.mutate()}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => pauseTracking.mutate()}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsBreakdownOpen(true)}>
              <ListTree className="mr-2 h-4 w-4" />
              Add Breakdown
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => stopTracking.mutate()}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {timeStats && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                {formatDuration(timeStats.totalTime)}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Time Statistics</h4>
                <div className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span>Today:</span>
                    <span>{formatDuration(timeStats.todayTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Week:</span>
                    <span>{formatDuration(timeStats.weekTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Month:</span>
                    <span>{formatDuration(timeStats.monthTime)}</span>
                  </div>
                  {timeStats.billableTime > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Billable:</span>
                      <span>
                        {formatDuration(timeStats.billableTime)} (
                        {((timeStats.billableTime / timeStats.totalTime) * 100).toFixed(
                          1
                        )}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {renderBreakdownDialog()}
      </div>
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
        <Play className="mr-2 h-4 w-4" />
        Start Timer
        {timeStats && (
          <span className="ml-2 text-muted-foreground">
            ({formatDuration(timeStats.totalTime)})
          </span>
        )}
      </Button>
      {renderTimeEntryDialog()}
    </>
  )
}
