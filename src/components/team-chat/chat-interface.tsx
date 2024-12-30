"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/use-socket"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList } from "./message-list"
import { Send, Plus } from "lucide-react"

export function ChatInterface() {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [currentChannel, setCurrentChannel] = useState("general")
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat-messages", currentChannel],
    queryFn: async () => {
      const response = await fetch(
        `/api/team-chat/channels/${currentChannel}/messages`
      )
      if (!response.ok) throw new Error("Failed to fetch messages")
      return response.json()
    },
  })

  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(
        `/api/team-chat/channels/${currentChannel}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      )
      if (!response.ok) throw new Error("Failed to send message")
      return response.json()
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["chat-messages", currentChannel],
        (old: any[] = []) => [...old, newMessage]
      )
      scrollToBottom()
    },
  })

  useEffect(() => {
    if (!socket) return

    // Unsubscribe from previous channel
    if (channelRef.current) {
      channelRef.current.unbind_all()
      channelRef.current.unsubscribe()
    }

    // Subscribe to new channel
    const channelName = `channel-${currentChannel}`
    channelRef.current = socket.subscribe(channelName)

    channelRef.current.bind("new_message", (newMessage: any) => {
      if (newMessage.channelId === currentChannel) {
        queryClient.setQueryData(
          ["chat-messages", currentChannel],
          (old: any[] = []) => [...old, newMessage]
        )
        scrollToBottom()
      }
    })

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
      }
    }
  }, [socket, currentChannel, queryClient])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(message)
      setMessage("")
    }
  }

  return (
    <div className="flex-1 flex">
      <ChatSidebar
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          <ScrollArea
            ref={scrollRef}
            className="flex-1 p-4"
          >
            <MessageList
              messages={messages || []}
              isLoading={isLoading}
            />
          </ScrollArea>
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t flex space-x-2"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
