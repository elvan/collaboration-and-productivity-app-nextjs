import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileTemplate,
  Plus,
  Settings,
  Trash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface TaskTemplateEditorProps {
  taskTypeId: string
  value?: string
  onChange?: (value: string) => void
}

export function TaskTemplateEditor({
  taskTypeId,
  value,
  onChange,
}: TaskTemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    defaultValues: {},
    checklists: [],
  })
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ["task-templates", taskTypeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/task-types/${taskTypeId}/templates`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      return response.json()
    },
  })

  const { data: customFields } = useQuery({
    queryKey: ["custom-fields", taskTypeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/task-types/${taskTypeId}/custom-fields`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch custom fields")
      }
      return response.json()
    },
  })

  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/task-types/${taskTypeId}/templates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create template")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-templates", taskTypeId],
      })
      setIsCreateOpen(false)
      setNewTemplate({
        name: "",
        description: "",
        defaultValues: {},
        checklists: [],
      })
    },
  })

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(
        `/api/task-types/${taskTypeId}/templates/${templateId}`,
        {
          method: "DELETE",
        }
      )
      if (!response.ok) {
        throw new Error("Failed to delete template")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-templates", taskTypeId],
      })
    },
  })

  const selectedTemplate = templates?.find(
    (t: any) => t.id === value
  )

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <FileTemplate className="mr-2 h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={value}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {selectedTemplate ? (
                <div className="flex items-center gap-2">
                  <FileTemplate className="h-4 w-4" />
                  <span>{selectedTemplate.name}</span>
                </div>
              ) : (
                <span>Select template</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {templates?.map((template: any) => (
              <SelectItem
                key={template.id}
                value={template.id}
                className="flex items-center gap-2"
              >
                <FileTemplate className="h-4 w-4" />
                <span>{template.name}</span>
              </SelectItem>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </SelectContent>
        </Select>

        {selectedTemplate && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              deleteTemplate.mutate(selectedTemplate.id)
            }
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Task Template</DialogTitle>
            <DialogDescription>
              Create a template with predefined values and checklists.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    name: e.target.value,
                  })
                }
                placeholder="Template name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
              />
            </div>

            {customFields && (
              <div className="space-y-4">
                <h4 className="font-medium">Default Values</h4>
                {customFields.map((field: any) => (
                  <div key={field.id} className="grid gap-2">
                    <Label>{field.name}</Label>
                    {field.type === "text" && (
                      <Input
                        value={
                          newTemplate.defaultValues[field.id] ||
                          ""
                        }
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            defaultValues: {
                              ...newTemplate.defaultValues,
                              [field.id]: e.target.value,
                            },
                          })
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === "select" && (
                      <Select
                        value={
                          newTemplate.defaultValues[field.id]
                        }
                        onValueChange={(value) =>
                          setNewTemplate({
                            ...newTemplate,
                            defaultValues: {
                              ...newTemplate.defaultValues,
                              [field.id]: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(
                            (option: string) => (
                              <SelectItem
                                key={option}
                                value={option}
                              >
                                {option}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "checkbox" && (
                      <Checkbox
                        checked={
                          newTemplate.defaultValues[field.id]
                        }
                        onCheckedChange={(checked) =>
                          setNewTemplate({
                            ...newTemplate,
                            defaultValues: {
                              ...newTemplate.defaultValues,
                              [field.id]: checked,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Checklists</Label>
              <Textarea
                value={newTemplate.checklists.join("\n")}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    checklists: e.target.value
                      .split("\n")
                      .filter(Boolean),
                  })
                }
                placeholder="One checklist item per line"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTemplate.mutate(newTemplate)}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
