"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ProjectFolder, User, FolderShare } from "@prisma/client"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, MoreHorizontal, X } from "lucide-react"

const shareSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["viewer", "editor", "admin"]),
})

interface FolderWithShares extends ProjectFolder {
  shares: (FolderShare & {
    user: Pick<User, "id" | "name" | "email" | "image">
  })[]
}

interface FolderSharingProps {
  workspaceId: string
  folder: FolderWithShares
  users: Pick<User, "id" | "name" | "email" | "image">[]
}

export function FolderSharing({
  workspaceId,
  folder,
  users,
}: FolderSharingProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<z.infer<typeof shareSchema>>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      role: "viewer",
    },
  })

  async function onSubmit(values: z.infer<typeof shareSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folders/${folder.id}/shares`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to share folder")
      }

      toast({
        title: "Success",
        description: "Folder shared successfully",
      })
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share folder",
        variant: "destructive",
      })
    }
  }

  async function onUpdateRole(shareId: string, role: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folders/${folder.id}/shares/${shareId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      toast({
        title: "Success",
        description: "Role updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  async function onRemoveShare(shareId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folders/${folder.id}/shares/${shareId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to remove share")
      }

      toast({
        title: "Success",
        description: "Share removed successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove share",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      !folder.shares.find((share) => share.userId === user.id) &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Folder Sharing</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              Share Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Folder</DialogTitle>
              <DialogDescription>
                Share this folder with other users
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <FormControl>
                        <Command>
                          <CommandInput
                            placeholder="Search users..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandEmpty>No users found</CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.id}
                                onSelect={() => field.onChange(user.id)}
                              >
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={user.image || ""} />
                                  <AvatarFallback>
                                    {user.name?.[0] || user.email[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </FormControl>
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
                        Set the access level for this user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Share</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {folder.shares.map((share) => (
          <div
            key={share.id}
            className="flex items-center justify-between p-2 rounded-lg border"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={share.user.image || ""} />
                <AvatarFallback>
                  {share.user.name?.[0] || share.user.email[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{share.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {share.user.email}
                </p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {share.role}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onUpdateRole(share.id, "viewer")}
                >
                  Make Viewer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(share.id, "editor")}
                >
                  Make Editor
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(share.id, "admin")}
                >
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemoveShare(share.id)}
                  className="text-destructive"
                >
                  Remove Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {folder.shares.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            This folder is not shared with anyone
          </div>
        )}
      </div>
    </div>
  )
}
