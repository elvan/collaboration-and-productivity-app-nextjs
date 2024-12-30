"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChannelDialog({
  open,
  onOpenChange,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: createChannel, isLoading } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/team-chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isPrivate }),
      })
      if (!response.ok) throw new Error("Failed to create channel")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] })
      setName("")
      setIsPrivate(false)
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && !isLoading) {
      createChannel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. project-updates"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="private">Private Channel</Label>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full"
          >
            Create Channel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
