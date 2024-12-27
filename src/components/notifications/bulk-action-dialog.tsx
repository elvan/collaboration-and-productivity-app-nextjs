"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { FilterConditions } from "@/lib/notification-filters"

interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "markAsRead" | "markAsUnread" | "dismiss" | "delete"
  filter?: FilterConditions
  notificationIds?: string[]
  selectedCount?: number
}

export function BulkActionDialog({
  open,
  onOpenChange,
  type,
  filter,
  notificationIds,
  selectedCount,
}: BulkActionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [actionId, setActionId] = React.useState<string>()
  const [progress, setProgress] = React.useState(0)
  const [status, setStatus] = React.useState<string>()
  const pollRef = React.useRef<NodeJS.Timeout>()

  const titles = {
    markAsRead: "Mark as Read",
    markAsUnread: "Mark as Unread",
    dismiss: "Dismiss Notifications",
    delete: "Delete Notifications",
  }

  const descriptions = {
    markAsRead: "Are you sure you want to mark these notifications as read?",
    markAsUnread: "Are you sure you want to mark these notifications as unread?",
    dismiss: "Are you sure you want to dismiss these notifications?",
    delete:
      "Are you sure you want to delete these notifications? This action cannot be undone.",
  }

  React.useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  const startAction = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/notifications/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          filter,
          notificationIds,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to start bulk action")
      }

      const data = await res.json()
      setActionId(data.id)
      setStatus(data.status)
      startPolling(data.id)
    } catch (error) {
      console.error("Failed to start bulk action:", error)
      toast({
        title: "Error",
        description: "Failed to start bulk action",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications/bulk?actionId=${id}`)
        if (!res.ok) {
          throw new Error("Failed to get bulk action status")
        }

        const data = await res.json()
        const progress = data.total
          ? Math.round((data.processed / data.total) * 100)
          : 0
        setProgress(progress)
        setStatus(data.status)

        if (["completed", "failed"].includes(data.status)) {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }

          if (data.status === "completed") {
            toast({
              title: "Success",
              description: "Bulk action completed successfully",
            })
            router.refresh()
            onOpenChange(false)
          } else {
            toast({
              title: "Error",
              description: data.error || "Bulk action failed",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Failed to get bulk action status:", error)
        if (pollRef.current) {
          clearInterval(pollRef.current)
        }
      }
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
          <DialogDescription>
            {descriptions[type]}
            {selectedCount && (
              <div className="mt-2">
                Selected notifications: {selectedCount}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {status && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={cn("text-sm", {
                  "text-yellow-600": status === "processing",
                  "text-green-600": status === "completed",
                  "text-red-600": status === "failed",
                })}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {status === "processing" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {status === "completed" && (
                <Check className="h-4 w-4 text-green-600" />
              )}
              {status === "failed" && (
                <X className="h-4 w-4 text-red-600" />
              )}
            </div>
            <Progress value={progress} />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={startAction}
            disabled={loading || status === "processing"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
