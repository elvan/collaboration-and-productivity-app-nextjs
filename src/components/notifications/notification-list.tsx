"use client"

import * as React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface NotificationListProps {
  notifications: any[]
  loading: boolean
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export function NotificationList({
  notifications,
  loading,
  pagination,
  onPageChange,
}: NotificationListProps) {
  const groupedNotifications = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    notifications.forEach((notification) => {
      const date = format(new Date(notification.createdAt), "PP")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(notification)
    })
    return groups
  }, [notifications])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="mb-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No notifications found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-lg">{date}</CardTitle>
            <CardDescription>
              {items.length} notification{items.length !== 1 && "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification }: { notification: any }) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors",
        !notification.read && "bg-accent/20"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className={cn("text-sm", !notification.read && "font-medium")}>
            {notification.title}
          </h4>
          <Badge
            variant={
              notification.priority === "high"
                ? "destructive"
                : notification.priority === "low"
                ? "secondary"
                : "default"
            }
            className="text-xs"
          >
            {notification.priority}
          </Badge>
          {notification.batch && (
            <Badge variant="outline" className="text-xs">
              Batched
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {notification.message}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-xs text-muted-foreground">
            {format(new Date(notification.createdAt), "p")}
          </p>
          {notification.category && (
            <Badge variant="secondary" className="text-xs">
              {notification.category}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
