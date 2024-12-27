import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, any>
}

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)

  const getNotificationLink = (notification: Notification) => {
    if (!notification.entityType || !notification.entityId) return null

    switch (notification.entityType) {
      case "document":
        return `/documents/${notification.entityId}`
      case "task":
        return `/tasks/${notification.entityId}`
      case "team":
        return `/teams/${notification.entityId}`
      default:
        return null
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80"
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                onMarkAllAsRead()
                setOpen(false)
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification)
              const Content = (
                <div
                  className={`flex flex-col gap-1 p-4 text-sm hover:bg-muted ${
                    !notification.read && "bg-muted/50"
                  }`}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>
              )

              return (
                <div
                  key={notification.id}
                  className="border-b last:border-0"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {link ? (
                    <Link href={link}>{Content}</Link>
                  ) : (
                    Content
                  )}
                </div>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
