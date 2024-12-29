import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Hash, Lock, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function ChatSidebar({ currentChannel, onChannelSelect }: ChatSidebarProps) {
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const response = await fetch("/api/team-chat/channels")
      if (!response.ok) throw new Error("Failed to fetch channels")
      return response.json()
    },
  })

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newChannelName.trim()) {
      try {
        const response = await fetch("/api/team-chat/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newChannelName }),
        })
        if (response.ok) {
          setNewChannelName("")
          setIsCreateChannelOpen(false)
        }
      } catch (error) {
        console.error("Failed to create channel:", error)
      }
    }
  }

  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-4 border-b">
        <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Channel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Channel name"
              />
              <Button type="submit" className="w-full">
                Create Channel
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="p-4">Loading channels...</div>
        ) : (
          <div className="space-y-1">
            {channels?.map((channel) => (
              <Button
                key={channel.id}
                variant={currentChannel === channel.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  channel.unreadCount > 0 && "font-medium"
                )}
                onClick={() => onChannelSelect(channel.id)}
              >
                {channel.isPrivate ? (
                  <Lock className="mr-2 h-4 w-4" />
                ) : (
                  <Hash className="mr-2 h-4 w-4" />
                )}
                <span className="truncate">{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {channel.unreadCount}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Channel Settings
        </Button>
      </div>
    </div>
  )
}
