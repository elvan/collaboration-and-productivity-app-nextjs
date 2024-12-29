"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Plus, FileText, Users, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from '@/lib/utils';

const quickActions = [
  {
    label: "New Task",
    icon: Plus,
    href: "/tasks/new",
    color: "text-blue-500",
  },
  {
    label: "New Document",
    icon: FileText,
    href: "/documents/new",
    color: "text-green-500",
  },
  {
    label: "Team Meeting",
    icon: Users,
    href: "/calendar/new",
    color: "text-purple-500",
  },
  {
    label: "Schedule Event",
    icon: Calendar,
    href: "/calendar/new",
    color: "text-orange-500",
  },
]

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

interface QuickActionsProps {
  notifications: Notification[]
}

export function QuickActions({ notifications }: QuickActionsProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-20 justify-start p-4"
                onClick={() => router.push(action.href)}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <action.icon className={cn("h-5 w-5", action.color)} />
                  <span className="text-xs">{action.label}</span>
                </div>
              </Button>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Notifications</h4>
              <Button variant="ghost" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
              </Button>
            </div>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-2 rounded-md border p-2",
                      !notification.read && "bg-muted/50"
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
