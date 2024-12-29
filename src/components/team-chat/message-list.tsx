import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface Message {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string
    image?: string | null
  }
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[400px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const showHeader =
          index === 0 ||
          messages[index - 1].user.id !== message.user.id ||
          new Date(messages[index - 1].createdAt).getTime() <
            new Date(message.createdAt).getTime() - 5 * 60 * 1000

        return (
          <div key={message.id} className="flex items-start space-x-4">
            {showHeader && (
              <Avatar>
                <AvatarImage src={message.user.image || undefined} />
                <AvatarFallback>
                  {message.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            )}
            {!showHeader && <div className="w-10" />}
            <div className="space-y-1">
              {showHeader && (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{message.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), "h:mm a")}
                  </span>
                </div>
              )}
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
