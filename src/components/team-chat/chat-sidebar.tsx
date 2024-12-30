"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Hash, Lock } from "lucide-react"
import { CreateChannelDialog } from "./create-channel-dialog"

interface ChatSidebarProps {
  currentChannel: string
  onChannelSelect: (channelId: string) => void
}

interface Channel {
  id: string
  name: string
  isPrivate: boolean
  unreadCount: number
}

export function ChatSidebar({
  currentChannel,
  onChannelSelect,
}: ChatSidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const response = await fetch("/api/team-chat/channels")
      if (!response.ok) throw new Error("Failed to fetch channels")
      return response.json()
    },
  })

  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="w-full"
          variant="outline"
        >
          Create Channel
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-muted animate-pulse rounded-md"
              />
            ))
          ) : (
            channels?.map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start space-x-2",
                  channel.id === currentChannel && "bg-muted"
                )}
                onClick={() => onChannelSelect(channel.id)}
              >
                {channel.isPrivate ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Hash className="h-4 w-4" />
                )}
                <span>{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {channel.unreadCount}
                  </span>
                )}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
