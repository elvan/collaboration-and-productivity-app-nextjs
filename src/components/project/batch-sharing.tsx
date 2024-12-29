"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, X } from "lucide-react"

const batchShareSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
  role: z.enum(["viewer", "editor", "admin"]),
})

interface BatchSharingProps {
  workspaceId: string
  users: Pick<User, "id" | "name" | "email" | "image">[]
  selectedItems: {
    type: "folder" | "project"
    id: string
    name: string
  }[]
  onComplete: () => void
}

export function BatchSharing({
  workspaceId,
  users,
  selectedItems,
  onComplete,
}: BatchSharingProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<z.infer<typeof batchShareSchema>>({
    resolver: zodResolver(batchShareSchema),
    defaultValues: {
      userIds: [],
      role: "viewer",
    },
  })

  const selectedUsers = form.watch("userIds")

  async function onSubmit(values: z.infer<typeof batchShareSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/batch-share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            items: selectedItems,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to share items")
      }

      toast({
        title: "Success",
        description: "Items shared successfully",
      })
      setOpen(false)
      form.reset()
      onComplete()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share items",
        variant: "destructive",
      })
    }
  }

  const toggleUser = (userId: string) => {
    const current = form.getValues("userIds")
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    form.setValue("userIds", updated)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Share2 className="h-4 w-4 mr-2" />
          Share {selectedItems.length} Item{selectedItems.length !== 1 && "s"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Share</DialogTitle>
          <DialogDescription>
            Share multiple items with users in your workspace
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userIds"
              render={() => (
                <FormItem>
                  <FormLabel>Users</FormLabel>
                  <FormControl>
                    <Command className="border rounded-lg">
                      <CommandInput
                        placeholder="Search users..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>No users found</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          {filteredUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => toggleUser(user.id)}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.image || ""} />
                                  <AvatarFallback>
                                    {user.name?.[0] || user.email[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                                {selectedUsers.includes(user.id) && (
                                  <Badge className="ml-auto">Selected</Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </FormControl>
                  <FormDescription>
                    Select users to share items with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set access level for selected users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Selected Items</FormLabel>
              <ScrollArea className="h-32 border rounded-lg p-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button type="submit">Share Items</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
