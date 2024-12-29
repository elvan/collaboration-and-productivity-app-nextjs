"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Project, ProjectFolder } from "@prisma/client"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowDown,
  ArrowRight,
  Copy,
  Folder,
  MoreHorizontal,
  MoveDown,
  Trash,
} from "lucide-react"

const bulkActionSchema = z.object({
  action: z.enum(["move", "delete", "duplicate"]),
  targetFolderId: z.string().optional(),
})

interface BulkOperationsProps {
  workspaceId: string
  folders: ProjectFolder[]
  selectedItems: {
    type: "folder" | "project"
    id: string
    name: string
  }[]
  onDeselectAll: () => void
}

export function BulkOperations({
  workspaceId,
  folders,
  selectedItems,
  onDeselectAll,
}: BulkOperationsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof bulkActionSchema>>({
    resolver: zodResolver(bulkActionSchema),
    defaultValues: {
      action: "move",
    },
  })

  const selectedAction = form.watch("action")

  async function onSubmit(values: z.infer<typeof bulkActionSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/bulk-operations`,
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
        throw new Error("Failed to perform bulk action")
      }

      toast({
        title: "Success",
        description: "Bulk action completed successfully",
      })
      setOpen(false)
      form.reset()
      onDeselectAll()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    }
  }

  if (selectedItems.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background rounded-lg border shadow-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              Clear
            </Button>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Bulk Actions</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Actions</DialogTitle>
                <DialogDescription>
                  Perform actions on multiple items at once
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="move">
                              <div className="flex items-center gap-2">
                                <MoveDown className="h-4 w-4" />
                                Move
                              </div>
                            </SelectItem>
                            <SelectItem value="duplicate">
                              <div className="flex items-center gap-2">
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </div>
                            </SelectItem>
                            <SelectItem value="delete">
                              <div className="flex items-center gap-2">
                                <Trash className="h-4 w-4" />
                                Delete
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {selectedAction === "move" && (
                    <FormField
                      control={form.control}
                      name="targetFolderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Folder</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a folder" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Root</SelectItem>
                              {folders.map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                  <div className="flex items-center gap-2">
                                    <Folder className="h-4 w-4" />
                                    {folder.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}

                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Items</h4>
                      {selectedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {item.type === "folder" ? (
                            <Folder className="h-4 w-4" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {item.name}
                          <Badge variant="secondary" className="ml-auto">
                            {item.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <DialogFooter>
                    <Button
                      type="submit"
                      variant={selectedAction === "delete" ? "destructive" : "default"}
                    >
                      {selectedAction === "move" && "Move Items"}
                      {selectedAction === "duplicate" && "Duplicate Items"}
                      {selectedAction === "delete" && "Delete Items"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
