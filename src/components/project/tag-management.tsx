"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tag } from "@prisma/client"
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
import { Tag as TagIcon, MoreHorizontal, Plus, X } from "lucide-react"

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  description: z.string().optional(),
})

interface TagManagementProps {
  workspaceId: string
  tags: Tag[]
  selectedTags?: string[]
  onTagSelect?: (tagId: string) => void
  onTagDeselect?: (tagId: string) => void
}

export function TagManagement({
  workspaceId,
  tags,
  selectedTags = [],
  onTagSelect,
  onTagDeselect,
}: TagManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      color: "#94A3B8",
    },
  })

  async function onSubmit(values: z.infer<typeof tagSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create tag")
      }

      toast({
        title: "Success",
        description: "Tag created successfully",
      })
      setCreateDialogOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      })
    }
  }

  async function onDeleteTag(tagId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/${tagId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete tag")
      }

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      })
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagDeselect?.(tagId)
    } else {
      onTagSelect?.(tagId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tags</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to organize your projects and folders
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-12 h-8 p-1"
                          />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Choose a color for the tag
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional description for the tag
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Create Tag</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center">
            <Badge
              variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
              className="cursor-pointer"
              style={{
                backgroundColor: selectedTags.includes(tag.id)
                  ? tag.color
                  : "transparent",
                borderColor: tag.color,
                color: selectedTags.includes(tag.id) ? "white" : tag.color,
              }}
              onClick={() => toggleTag(tag.id)}
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag.name}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDeleteTag(tag.id)}
                  className="text-destructive"
                >
                  Delete Tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="text-muted-foreground">No tags created yet</div>
        )}
      </div>
    </div>
  )
}
