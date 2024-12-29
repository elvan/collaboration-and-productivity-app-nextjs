"use client"

import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function MessagesPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Messages"
        text="Chat with your team members"
      />
      <div className="grid gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Recent Messages</h2>
            <Separator />
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
