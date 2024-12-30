"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/use-socket"
import { useSession } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList } from "./message-list"
import { Send, Plus } from "lucide-react"

export function ChatInterface() {
  const socket = useSocket()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [currentChannel, setCurrentChannel] = useState("general")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

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

    // Handle typing indicators
    channelRef.current.bind("user_typing", (data: { userId: string, userName: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.add(data.userName)
        return newSet
      })
    })

    channelRef.current.bind("user_stopped_typing", (data: { userId: string, userName: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userName)
        return newSet
      })
    })

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
      }
    }
  }, [socket, currentChannel, queryClient])

  const emitTyping = useCallback(() => {
    if (!socket || !session?.user) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Emit typing event
    fetch("/api/team-chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: currentChannel,
        event: "typing",
      }),
    })

    // Set timeout to emit stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      fetch("/api/team-chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: currentChannel,
          event: "stopped_typing",
        }),
      })
    }, 2000)
  }, [socket, currentChannel, session?.user])

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    emitTyping()
  }

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
      // Clear typing indicator when sending message
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        fetch("/api/team-chat/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: currentChannel,
            event: "stopped_typing",
          }),
        })
      }
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
          <div className="px-4 py-2 text-sm text-muted-foreground">
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>
                  {Array.from(typingUsers).join(", ")}
                  {typingUsers.size === 1 ? " is" : " are"} typing...
                </span>
              </div>
            )}
          </div>
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
              onChange={handleMessageChange}
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
