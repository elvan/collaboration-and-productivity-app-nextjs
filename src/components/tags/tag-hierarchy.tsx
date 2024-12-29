"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  MoveVertical,
  Tag,
  AlertCircle,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TagNode {
  id: string
  name: string
  color: string
  parentId: string | null
  children: TagNode[]
  itemCount: number
  order: number
}

interface TagHierarchyProps {
  workspaceId: string
}

interface SortableTagItemProps {
  tag: TagNode
  depth: number
  onEdit: (tag: TagNode) => void
  onDelete: (tagId: string) => void
  onMove: (tagId: string, newParentId: string | null) => void
}

function SortableTagItem({
  tag,
  depth,
  onEdit,
  onDelete,
  onMove,
}: SortableTagItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 24}px`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded-lg ${
        isDragging ? "bg-muted" : "hover:bg-muted/50"
      }`}
      {...attributes}
    >
      <div className="flex items-center space-x-2">
        <div {...listeners} className="cursor-move">
          <MoveVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Badge
          variant="outline"
          style={{
            backgroundColor: tag.color + "20",
            borderColor: tag.color,
            color: tag.color,
          }}
        >
          {tag.name}
        </Badge>
        <span className="text-sm text-muted-foreground">
          ({tag.itemCount} items)
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(tag)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onMove(tag.id, null)}
            disabled={!tag.parentId}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Move to Root
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(tag.id)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function TagHierarchy({ workspaceId }: TagHierarchyProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tags, setTags] = useState<TagNode[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagNode | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#000000")
  const [newTagParent, setNewTagParent] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/hierarchy`
      )
      if (!response.ok) throw new Error("Failed to fetch tags")
      const data = await response.json()
      setTags(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTag() {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
          parentId: newTagParent,
        }),
      })

      if (!response.ok) throw new Error("Failed to add tag")

      await fetchTags()
      setShowAddDialog(false)
      setNewTagName("")
      setNewTagColor("#000000")
      setNewTagParent(null)

      toast({
        title: "Success",
        description: "Tag added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      })
    }
  }

  async function handleEditTag() {
    if (!editingTag) return

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/${editingTag.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTagName,
            color: newTagColor,
            parentId: newTagParent,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to update tag")

      await fetchTags()
      setEditingTag(null)
      setNewTagName("")
      setNewTagColor("#000000")
      setNewTagParent(null)

      toast({
        title: "Success",
        description: "Tag updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteTag(tagId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/${tagId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to delete tag")

      await fetchTags()
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      })
    }
  }

  async function handleMoveTag(tagId: string, newParentId: string | null) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/${tagId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: newParentId }),
        }
      )

      if (!response.ok) throw new Error("Failed to move tag")

      await fetchTags()
      toast({
        title: "Success",
        description: "Tag moved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move tag",
        variant: "destructive",
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTag = findTagById(tags, active.id as string)
    const overTag = findTagById(tags, over.id as string)

    if (!activeTag || !overTag) return

    // Prevent moving a parent into its own child
    if (isDescendant(activeTag, overTag)) {
      toast({
        title: "Invalid Move",
        description: "Cannot move a parent tag into its own child",
        variant: "destructive",
      })
      return
    }

    await handleMoveTag(activeTag.id, overTag.parentId)
  }

  function findTagById(tags: TagNode[], id: string): TagNode | null {
    for (const tag of tags) {
      if (tag.id === id) return tag
      const found = findTagById(tag.children, id)
      if (found) return found
    }
    return null
  }

  function isDescendant(parent: TagNode, child: TagNode): boolean {
    return child.children.some(
      (grandChild) =>
        grandChild.id === parent.id || isDescendant(parent, grandChild)
    )
  }

  function flattenTags(tags: TagNode[]): TagNode[] {
    return tags.reduce<TagNode[]>((flat, tag) => {
      return [...flat, tag, ...flattenTags(tag.children)]
    }, [])
  }

  function renderTagTree(tags: TagNode[], depth: number = 0) {
    return tags.map((tag) => (
      <div key={tag.id}>
        <SortableTagItem
          tag={tag}
          depth={depth}
          onEdit={setEditingTag}
          onDelete={handleDeleteTag}
          onMove={handleMoveTag}
        />
        {tag.children.length > 0 && renderTagTree(tag.children, depth + 1)}
      </div>
    ))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tag Hierarchy</CardTitle>
            <CardDescription>
              Organize and manage your workspace tags
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Tag</DialogTitle>
                <DialogDescription>
                  Create a new tag and optionally assign it to a parent tag
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parent Tag</label>
                  <select
                    value={newTagParent || ""}
                    onChange={(e) =>
                      setNewTagParent(e.target.value || null)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">None (Root Level)</option>
                    {flattenTags(tags).map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTag}>Add Tag</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Tag className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Tags Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first tag to start organizing your workspace
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={flattenTags(tags).map((tag) => tag.id)}
                strategy={verticalListSortingStrategy}
              >
                {renderTagTree(tags)}
              </SortableContext>
            </DndContext>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Modify the tag's properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newTagName || editingTag?.name}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Input
                type="color"
                value={newTagColor || editingTag?.color}
                onChange={(e) => setNewTagColor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Parent Tag</label>
              <select
                value={newTagParent || editingTag?.parentId || ""}
                onChange={(e) => setNewTagParent(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">None (Root Level)</option>
                {flattenTags(tags)
                  .filter((tag) => tag.id !== editingTag?.id)
                  .map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTag(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditTag}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
