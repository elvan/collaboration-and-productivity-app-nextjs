"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages = [], isLoading }: MessageListProps) {
  const { data: session } = useSession()

  if (isLoading) {
    return (
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
    )
  }

  return (
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
  )
}
