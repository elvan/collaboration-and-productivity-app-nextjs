"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Timeline,
  Plus,
  Settings2,
} from "lucide-react"

interface TaskView {
  id: string
  name: string
  description: string | null
  viewType: string
  project: {
    id: string
    name: string
  }
  updatedAt: Date
}

interface TaskViewsClientProps {
  views: TaskView[]
  userId: string
}

export function TaskViewsClient({ views, userId }: TaskViewsClientProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [newView, setNewView] = useState({
    name: "",
    description: "",
    viewType: "list",
    projectId: "",
  })

  const viewTypeIcons = {
    list: List,
    board: LayoutGrid,
    calendar: CalendarIcon,
    timeline: Timeline,
  }

  const handleCreateView = async () => {
    try {
      const response = await fetch("/api/tasks/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newView),
      })

      if (!response.ok) {
        throw new Error("Failed to create view")
      }

      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating view:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Views</h1>
          <p className="text-muted-foreground">
            Manage and customize your task views
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create View
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New View</DialogTitle>
              <DialogDescription>
                Create a custom view to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newView.name}
                  onChange={(e) =>
                    setNewView({ ...newView, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newView.description}
                  onChange={(e) =>
                    setNewView({ ...newView, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">View Type</Label>
                <Select
                  value={newView.viewType}
                  onValueChange={(value) =>
                    setNewView({ ...newView, viewType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="board">Board View</SelectItem>
                    <SelectItem value="calendar">Calendar View</SelectItem>
                    <SelectItem value="timeline">Timeline View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateView}>Create View</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {views.map((view) => {
          const Icon = viewTypeIcons[view.viewType as keyof typeof viewTypeIcons]
          return (
            <Card key={view.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {view.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {view.description}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Project: {view.project.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {format(new Date(view.updatedAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/dashboard/tasks/views/${view.id}`}>
                      Open View
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    asChild
                  >
                    <Link href={`/dashboard/tasks/views/${view.id}/settings`}>
                      <Settings2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
