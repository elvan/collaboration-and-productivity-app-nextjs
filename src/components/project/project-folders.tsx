"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  Folder,
  MoreHorizontal,
  Plus,
  Trash,
} from "lucide-react"
import { ProjectSearch } from "@/components/project/project-search"
import { BulkOperations } from "@/components/project/bulk-operations"

const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

interface ProjectFoldersProps {
  workspaceId: string
  folders: (ProjectFolder & {
    children: ProjectFolder[]
    projects: Project[]
  })[]
  projects: Project[]
}

export function ProjectFolders({
  workspaceId,
  folders,
  projects,
}: ProjectFoldersProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [openFolders, setOpenFolders] = useState<string[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>()
  const [selectedItems, setSelectedItems] = useState<{
    type: "folder" | "project"
    id: string
    name: string
  }[]>([])

  const form = useForm<z.infer<typeof createFolderSchema>>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof createFolderSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/project-folders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            parentId: selectedParentId,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create folder")
      }

      toast({
        title: "Success",
        description: "Folder created successfully",
      })
      setCreateDialogOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  async function onDelete(folderId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/project-folders/${folderId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete folder")
      }

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      })
    }
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const sourceId = result.draggableId
    const destinationId = result.destination.droppableId
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/project-folders/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceId,
            destinationId,
            sourceIndex,
            destinationIndex,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to reorder items")
      }

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      })
    }
  }

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    )
  }

  const toggleItemSelection = (type: "folder" | "project", id: string, name: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.id === id)
      if (exists) {
        return prev.filter((item) => item.id !== id)
      }
      return [...prev, { type, id, name }]
    })
  }

  const renderFolder = (folder: ProjectFolder & {
    children: ProjectFolder[]
    projects: Project[]
  }) => {
    const isOpen = openFolders.includes(folder.id)
    const isSelected = selectedItems.some((item) => item.id === folder.id)

    return (
      <Collapsible
        key={folder.id}
        open={isOpen}
        onOpenChange={() => toggleFolder(folder.id)}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() =>
                toggleItemSelection("folder", folder.id, folder.name)
              }
            />
            <CollapsibleTrigger className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1">
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", {
                  "transform rotate-90": isOpen,
                })}
              />
              <Folder className="h-4 w-4" />
              <span className="font-medium">{folder.name}</span>
              <Badge variant="secondary" className="ml-2">
                {folder.projects.length}
              </Badge>
            </CollapsibleTrigger>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedParentId(folder.id)
                  setCreateDialogOpen(true)
                }}
              >
                Create subfolder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(folder.id)}
                className="text-destructive"
              >
                Delete folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CollapsibleContent className="pl-6 space-y-2">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={folder.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {folder.projects.map((project, index) => {
                    const isSelected = selectedItems.some(
                      (item) => item.id === project.id
                    )
                    return (
                      <Draggable
                        key={project.id}
                        draggableId={project.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleItemSelection(
                                  "project",
                                  project.id,
                                  project.name
                                )
                              }
                            />
                            <Link
                              href={`/workspace/${workspaceId}/project/${project.id}/board`}
                              className="block flex-1"
                            >
                              <Card>
                                <CardHeader className="p-4">
                                  <CardTitle className="text-sm font-medium">
                                    {project.name}
                                  </CardTitle>
                                  {project.description && (
                                    <CardDescription className="text-xs">
                                      {project.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                              </Card>
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {folder.children.map((child) => renderFolder(child))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your projects
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
                          <Input placeholder="Folder name" {...field} />
                        </FormControl>
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
                          <Textarea
                            placeholder="Folder description"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description for your folder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit">Create Folder</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ProjectSearch
        workspaceId={workspaceId}
        folders={folders}
        teams={[]}
        initialProjects={projects}
      />

      <BulkOperations
        workspaceId={workspaceId}
        folders={folders}
        selectedItems={selectedItems}
        onDeselectAll={() => setSelectedItems([])}
      />

      <div className="space-y-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="root">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {projects
                  .filter((project) => !project.folderId)
                  .map((project, index) => (
                    <Draggable
                      key={project.id}
                      draggableId={project.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            checked={selectedItems.some(
                              (item) => item.id === project.id
                            )}
                            onCheckedChange={() =>
                              toggleItemSelection(
                                "project",
                                project.id,
                                project.name
                              )
                            }
                          />
                          <Link
                            href={`/workspace/${workspaceId}/project/${project.id}/board`}
                            className="block flex-1"
                          >
                            <Card>
                              <CardHeader className="p-4">
                                <CardTitle className="text-sm font-medium">
                                  {project.name}
                                </CardTitle>
                                {project.description && (
                                  <CardDescription className="text-xs">
                                    {project.description}
                                  </CardDescription>
                                )}
                              </CardHeader>
                            </Card>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {folders.map((folder) => renderFolder(folder))}
      </div>
    </div>
  )
}
