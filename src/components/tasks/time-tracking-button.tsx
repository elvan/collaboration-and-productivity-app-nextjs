import { useState } from "react"
import { useSession } from "next-auth/react"
import { Play, Pause, Clock } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  const [description, setDescription] = useState("")
  const [billable, setBillable] = useState(false)
  const queryClient = useQueryClient()

  const { data: activeEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ["time-entry", "active", taskId],
    queryFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/time-entries/active`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch active time entry")
      }
      return response.json()
    },
  })

  const { data: timeStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["time-stats", taskId],
    queryFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/time-entries/stats`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch time statistics")
      }
      return response.json()
    },
  })

  const startTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/time-entries/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description,
            billable,
          }),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to start time tracking")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-entry", "active", taskId],
      })
      queryClient.invalidateQueries({
        queryKey: ["time-stats", taskId],
      })
      setIsDialogOpen(false)
      setDescription("")
      setBillable(false)
      onTimeUpdate?.()
      toast.success("Time tracking started")
    },
    onError: () => {
      toast.error("Failed to start time tracking")
    },
  })

  const stopTracking = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/tasks/${taskId}/time-entries/stop`,
        {
          method: "POST",
        }
      )
      if (!response.ok) {
        throw new Error("Failed to stop time tracking")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-entry", "active", taskId],
      })
      queryClient.invalidateQueries({
        queryKey: ["time-stats", taskId],
      })
      onTimeUpdate?.()
      toast.success("Time tracking stopped")
    },
    onError: () => {
      toast.error("Failed to stop time tracking")
    },
  })

  if (isLoadingEntry || isLoadingStats) {
    return (
      <Button variant="outline" disabled>
        <Clock className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (activeEntry) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => stopTracking.mutate()}
          className={cn(
            "animate-pulse",
            billable && "border-green-500"
          )}
        >
          <Pause className="mr-2 h-4 w-4" />
          {formatDuration(
            Math.floor(
              (Date.now() - new Date(activeEntry.startTime).getTime()) /
                1000
            )
          )}
        </Button>
        {timeStats && (
          <span className="text-sm text-muted-foreground">
            Total: {formatDuration(timeStats.totalTime)}
          </span>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Play className="mr-2 h-4 w-4" />
          Start Timer
          {timeStats && (
            <span className="ml-2 text-muted-foreground">
              ({formatDuration(timeStats.totalTime)})
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
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
          <div className="flex items-center space-x-2">
            <Switch
              id="billable"
              checked={billable}
              onCheckedChange={setBillable}
            />
            <Label htmlFor="billable">Billable time</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => startTracking.mutate()}
            disabled={startTracking.isPending}
          >
            {startTracking.isPending ? "Starting..." : "Start Timer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
