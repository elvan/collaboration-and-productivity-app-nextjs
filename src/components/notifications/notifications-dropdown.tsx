"use client"

import * as React from "react"
import { Notification } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Bell, ChevronDown, ChevronRight, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { soundManager } from "@/lib/sounds"
import {
  markNotificationAsRead,
  dismissNotification,
  trackNotificationClick,
  getGroupedNotifications,
} from "@/lib/notification"

interface ExtendedNotification extends Notification {
  activity?: {
    user: {
      name: string | null
      email: string
      image: string | null
    }
  }
}

interface NotificationGroup {
  id: string
  category: string
  notifications: Array<{
    id: string
    title: string
    message: string
    createdAt: Date
    read: boolean
    metadata?: Record<string, any>
  }>
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = React.useState<ExtendedNotification[]>([])
  const [groups, setGroups] = React.useState<NotificationGroup[]>([])
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const [unreadCount, setUnreadCount] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isOpen, setIsOpen] = React.useState<boolean>(false)
  const previousCount = React.useRef(0)

  async function fetchNotifications() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()
      
      const { groups, ungrouped } = await getGroupedNotifications(data.userId)
      setGroups(groups)
      setNotifications(ungrouped)
      
      const unreadCount = [
        ...ungrouped,
        ...groups.flatMap((g) => g.notifications),
      ].filter((n) => !n.read).length
      
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  async function handleNotificationClick(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId)
      await trackNotificationClick(notificationId)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          notifications: group.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Close dropdown and navigate if there's a link
      setIsOpen(false)
      // Add navigation logic here based on notification type
    } catch (error) {
      console.error("Failed to handle notification click:", error)
    }
  }

  async function handleDismiss(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation()
    try {
      await dismissNotification(notificationId)
      
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      )
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          notifications: group.notifications.filter((n) => n.id !== notificationId),
        })).filter((group) => group.notifications.length > 0)
      )
      
      const notification = notifications.find((n) => n.id === notificationId) ||
        groups.flatMap((g) => g.notifications).find((n) => n.id === notificationId)
      
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to dismiss notification:", error)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          notifications: group.notifications.map((n) => ({ ...n, read: true })),
        }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }

    // Poll for new notifications
    const interval = setInterval(() => {
      if (isOpen) {
        fetchNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isOpen])

  React.useEffect(() => {
    const totalCount = notifications.length +
      groups.reduce((sum, group) => sum + group.notifications.length, 0)
    
    if (totalCount > previousCount.current) {
      // Play notification sound for new notifications
      soundManager.play()
    }
    previousCount.current = totalCount
  }, [notifications.length, groups])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled={isLoading}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center transform translate-x-1/3 -translate-y-1/3">
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
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {groups.length === 0 && notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {/* Grouped notifications */}
            {groups.map((group) => (
              <div key={group.id} className="border-b last:border-b-0">
                <button
                  className="w-full flex items-center justify-between p-2 hover:bg-accent"
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className="text-sm font-medium">
                    {group.category} ({group.notifications.length})
                  </span>
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedGroups.has(group.id) && (
                  <div className="bg-accent/50">
                    {group.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 cursor-pointer hover:bg-accent",
                          !notification.read && "bg-accent/50"
                        )}
                        onClick={() => handleNotificationClick(notification.id)}
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
                          onClick={(e) => handleDismiss(e, notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Ungrouped notifications */}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 cursor-pointer hover:bg-accent",
                  !notification.read && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notification.id)}
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
                  onClick={(e) => handleDismiss(e, notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
