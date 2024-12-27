"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TemplateDialog } from "@/components/notifications/template-dialog"

interface Template {
  id: string
  name: string
  description?: string
  type: string
  title: string
  body: string
  metadata?: any
  variables?: any
  isActive: boolean
}

export default function NotificationTemplates() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [type, setType] = React.useState<string>()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template>()

  // Load templates
  React.useEffect(() => {
    if (session?.user?.id) {
      loadTemplates()
    }
  }, [session?.user?.id, type])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const url = type
        ? \`/api/notifications/templates?type=\${type}\`
        : "/api/notifications/templates"
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to load templates")
      }
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (template: Partial<Template>) => {
    try {
      const res = await fetch("/api/notifications/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      })

      if (!res.ok) {
        throw new Error("Failed to create template")
      }

      toast({
        title: "Success",
        description: "Template created successfully",
      })

      loadTemplates()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to create template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTemplate = async (template: Partial<Template>) => {
    try {
      const res = await fetch("/api/notifications/templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      })

      if (!res.ok) {
        throw new Error("Failed to update template")
      }

      toast({
        title: "Success",
        description: "Template updated successfully",
      })

      loadTemplates()
      setDialogOpen(false)
      setSelectedTemplate(undefined)
    } catch (error) {
      console.error("Failed to update template:", error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification Templates</h1>
            <p className="text-muted-foreground mt-2">
              Manage your notification templates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="app">App</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleEditTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <span
                    className={
                      "rounded-full px-2 py-1 text-xs " +
                      (template.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700")
                    }
                  >
                    {template.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Type:</span>
                    <span className="ml-2 text-sm capitalize">
                      {template.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Title:</span>
                    <p className="mt-1 text-sm">{template.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Body:</span>
                    <p className="mt-1 text-sm line-clamp-3">{template.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
      />
    </div>
  )
}
