"use client"

import * as React from "react"
import { Activity, Notification } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { soundManager } from "@/lib/sounds"
import { markNotificationAsRead, dismissNotification, trackNotificationClick } from "@/lib/notification"
import { X } from "lucide-react"

interface ExtendedNotification extends Notification {
  activity?: {
    user: {
      name: string | null
      email: string
      image: string | null
    }
  } | null
}

export function NotificationsDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<ExtendedNotification[]>(
    []
  )
  const [unreadCount, setUnreadCount] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isOpen, setIsOpen] = React.useState<boolean>(false)
  const previousCount = React.useRef(0)

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications?unreadOnly=false&limit=10")
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(
        data.notifications.filter((n: Notification) => !n.read).length
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      })
      if (!response.ok) throw new Error("Failed to mark notifications as read")
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  async function handleNotificationClick(notification: ExtendedNotification) {
    try {
      await markNotificationAsRead(notification.id)
      await trackNotificationClick(notification.id)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Close dropdown and navigate if there's a link
      setIsOpen(false)
      // Add navigation logic here based on notification type
    } catch (error) {
      console.error("Failed to handle notification click:", error)
    }
  }

  async function handleDismiss(e: React.MouseEvent, notification: ExtendedNotification) {
    e.stopPropagation()
    try {
      await dismissNotification(notification.id)
      
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      )
      if (!notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to dismiss notification:", error)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Poll for new notifications every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [isOpen])

  React.useEffect(() => {
    if (notifications.length > previousCount.current) {
      // Play notification sound for new notifications
      soundManager.play()
    }
    previousCount.current = notifications.length
  }, [notifications.length])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          disabled={isLoading}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] max-h-[480px] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 p-4 cursor-pointer hover:bg-accent",
                !notification.read && "bg-accent/50"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-1 space-y-1">
                <p
                  className={cn(
                    "text-sm",
                    !notification.read && "font-medium"
                  )}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => handleDismiss(e, notification)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
