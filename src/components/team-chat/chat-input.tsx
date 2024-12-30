"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile } from "lucide-react"
import { EmojiPicker } from "./emoji-picker"

interface ChatInputProps {
  channelId: string
}

export function ChatInput({ channelId }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: sendMessage, isLoading } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/team-chat/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      })
      return res.json()
    },
    onSuccess: () => {
      setMessage("")
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return
    sendMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="relative flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[80px] resize-none"
        />
        <div className="flex flex-shrink-0 items-end gap-2">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker
                  onEmojiSelect={(emoji) => {
                    setMessage((prev) => prev + emoji)
                    setShowEmojiPicker(false)
                  }}
                />
              </div>
            )}
          </div>
          <Button type="submit" disabled={!message.trim() || isLoading}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  )
}
