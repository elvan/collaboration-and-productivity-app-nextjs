"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChatSidebar } from "./chat-sidebar"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { useSocket } from "@/hooks/use-socket"

export function TeamChatClient() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const socket = useSocket()

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/team-chat/channels")
      return res.json()
    },
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return []
      const res = await fetch(`/api/team-chat/channels/${selectedChannel}/messages`)
      return res.json()
    },
    enabled: !!selectedChannel,
  })

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ChatSidebar
        channels={channels || []}
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
        loading={channelsLoading}
      />
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <>
            <ChatMessages
              messages={messages || []}
              loading={messagesLoading}
              channelId={selectedChannel}
            />
            <ChatInput channelId={selectedChannel} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">
              Select a channel to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
