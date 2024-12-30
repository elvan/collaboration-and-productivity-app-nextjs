"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSocket } from "@/hooks/use-socket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image: string
  }
}

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
  channelId: string
}

export function ChatMessages({ messages, loading, channelId }: ChatMessagesProps) {
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const socket = useSocket()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!socket) return

    const channel = `channel-${channelId}`
    socket.subscribe(channel)

    socket.bind("new_message", (data: Message) => {
      // Handle new message
      // You can use React Query's setQueryData here to update the messages
    })

    return () => {
      socket.unsubscribe(channel)
    }
  }, [socket, channelId])

  if (loading) {
    return (
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.user.id === session?.user?.id

          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                isOwn ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar>
                <AvatarImage src={message.user.image} alt={message.user.name} />
                <AvatarFallback>
                  {message.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className={`space-y-1 ${
                  isOwn ? "items-end text-right" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{message.user.name}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
