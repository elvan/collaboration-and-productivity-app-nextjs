"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Share2,
  Bell,
  Check,
  X,
  ExternalLink,
  Settings,
  Filter,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"

interface ShareNotification {
  id: string
  type: "share_received" | "share_accepted" | "share_rejected" | "share_revoked"
  status: "unread" | "read"
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
    image: string | null
  }
  item: {
    id: string
    type: "project" | "folder" | "template"
    name: string
  }
  role: "viewer" | "editor" | "admin"
}

interface NotificationPreferences {
  shareReceived: boolean
  shareAccepted: boolean
  shareRejected: boolean
  shareRevoked: boolean
  emailNotifications: boolean
}

interface ShareNotificationsProps {
  workspaceId: string
}

export function ShareNotifications({ workspaceId }: ShareNotificationsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<ShareNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    shareReceived: true,
    shareAccepted: true,
    shareRejected: true,
    shareRevoked: true,
    emailNotifications: true,
  })
  const [showPreferences, setShowPreferences] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    fetchPreferences()
  }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/shares`
      )
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchPreferences() {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/preferences`
      )
      if (!response.ok) throw new Error("Failed to fetch preferences")
      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notification preferences",
        variant: "destructive",
      })
    }
  }

  async function handleUpdatePreferences(newPreferences: NotificationPreferences) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/preferences`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPreferences),
        }
      )

      if (!response.ok) throw new Error("Failed to update preferences")

      setPreferences(newPreferences)
      toast({
        title: "Success",
        description: "Notification preferences updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      })
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        }
      )

      if (!response.ok) throw new Error("Failed to mark notification as read")

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: "read" }
            : notification
        )
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  async function handleAcceptShare(notificationId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/${notificationId}/accept`,
        {
          method: "POST",
        }
      )

      if (!response.ok) throw new Error("Failed to accept share")

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      )
      toast({
        title: "Success",
        description: "Share accepted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept share",
        variant: "destructive",
      })
    }
  }

  async function handleRejectShare(notificationId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications/${notificationId}/reject`,
        {
          method: "POST",
        }
      )

      if (!response.ok) throw new Error("Failed to reject share")

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      )
      toast({
        title: "Success",
        description: "Share rejected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject share",
        variant: "destructive",
      })
    }
  }

  function getNotificationIcon(type: ShareNotification["type"]) {
    switch (type) {
      case "share_received":
        return <Share2 className="h-4 w-4" />
      case "share_accepted":
        return <Check className="h-4 w-4 text-green-500" />
      case "share_rejected":
        return <X className="h-4 w-4 text-red-500" />
      case "share_revoked":
        return <X className="h-4 w-4 text-yellow-500" />
    }
  }

  function getNotificationMessage(notification: ShareNotification) {
    const itemType = notification.item.type.charAt(0).toUpperCase() + notification.item.type.slice(1)
    switch (notification.type) {
      case "share_received":
        return `${notification.sender.name} shared a ${itemType} "${notification.item.name}" with you as ${notification.role}`
      case "share_accepted":
        return `${notification.sender.name} accepted your ${itemType} share for "${notification.item.name}"`
      case "share_rejected":
        return `${notification.sender.name} rejected your ${itemType} share for "${notification.item.name}"`
      case "share_revoked":
        return `${notification.sender.name} revoked your access to ${itemType} "${notification.item.name}"`
    }
  }

  const filteredNotifications = filter
    ? notifications.filter((n) => n.type === filter)
    : notifications

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Notifications...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Notifications</CardTitle>
            <CardDescription>
              Stay updated on sharing activities
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter(null)}>
                  All Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter("share_received")}>
                  Shares Received
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("share_accepted")}>
                  Shares Accepted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("share_rejected")}>
                  Shares Rejected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("share_revoked")}>
                  Shares Revoked
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Preferences</DialogTitle>
                  <DialogDescription>
                    Customize your notification settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label>Share Received Notifications</label>
                    <Switch
                      checked={preferences.shareReceived}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          ...preferences,
                          shareReceived: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Share Accepted Notifications</label>
                    <Switch
                      checked={preferences.shareAccepted}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          ...preferences,
                          shareAccepted: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Share Rejected Notifications</label>
                    <Switch
                      checked={preferences.shareRejected}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          ...preferences,
                          shareRejected: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Share Revoked Notifications</label>
                    <Switch
                      checked={preferences.shareRevoked}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          ...preferences,
                          shareRevoked: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Email Notifications</label>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          ...preferences,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications to display
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between border rounded-lg p-4 ${
                    notification.status === "unread"
                      ? "bg-muted/50"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={notification.sender.image || ""} />
                      <AvatarFallback>
                        {notification.sender.name?.[0] ||
                          notification.sender.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <p className="font-medium">
                          {getNotificationMessage(notification)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(notification.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {notification.type === "share_received" &&
                      notification.status === "unread" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptShare(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectShare(notification.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    {notification.status === "unread" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
