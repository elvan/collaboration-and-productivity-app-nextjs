"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FolderTemplate } from "@prisma/client"
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Folder,
  MoreHorizontal,
  Plus,
  Star,
  Trash,
} from "lucide-react"

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
  structure: z.object({}).passthrough(),
})

interface FolderTemplatesProps {
  workspaceId: string
  templates: FolderTemplate[]
}

export function FolderTemplates({
  workspaceId,
  templates,
}: FolderTemplatesProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FolderTemplate | null>(
    null
  )

  const form = useForm<z.infer<typeof createTemplateSchema>>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      isGlobal: false,
      structure: {},
    },
  })

  async function onSubmit(values: z.infer<typeof createTemplateSchema>) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folder-templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create template")
      }

      toast({
        title: "Success",
        description: "Template created successfully",
      })
      setCreateDialogOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    }
  }

  async function onDelete(templateId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folder-templates/${templateId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  async function onApplyTemplate(templateId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/folder-templates/${templateId}/apply`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to apply template")
      }

      toast({
        title: "Success",
        description: "Template applied successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Folder Templates</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Create a new folder template to quickly set up project structures
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
                        <Input placeholder="Template name" {...field} />
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
                          placeholder="Template description"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description for your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Global Template</FormLabel>
                        <FormDescription>
                          Make this template available to all workspaces
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Create Template</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {template.name}
                {template.isGlobal && (
                  <Badge variant="secondary" className="ml-2">
                    Global
                  </Badge>
                )}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onApplyTemplate(template.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Apply Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(template.id)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {template.description && (
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              )}
              <div className="mt-4 space-y-2">
                {Object.entries(template.structure as any).map(
                  ([name, children]) => (
                    <div key={name} className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>{name}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onApplyTemplate(template.id)}
              >
                Apply Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
