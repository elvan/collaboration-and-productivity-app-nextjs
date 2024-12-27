import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icons } from "@/components/icons"
import { TaskTypeSelector } from "./task-type-selector"
import { TaskStatusSelector } from "./task-status-selector"
import { CustomFieldEditor } from "./custom-field-editor"
import type { TaskTemplate } from "@/lib/tasks/task-template-service"

interface TaskTemplateSelectorProps {
  projectId: string
  onSelect: (template: TaskTemplate) => void
  onCreate?: (template: TaskTemplate) => void
}

export function TaskTemplateSelector({
  projectId,
  onSelect,
  onCreate,
}: TaskTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<TaskTemplate | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ["task-templates", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/task-templates`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch task templates")
      }
      return response.json()
    },
  })

  const handleSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setOpen(false)
    onSelect(template)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between"
          >
            {selectedTemplate ? (
              <div className="flex items-center gap-2">
                {selectedTemplate.icon && (
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center",
                      selectedTemplate.color
                    )}
                  >
                    {
                      Icons[
                        selectedTemplate.icon as keyof typeof Icons
                      ]({
                        className: "h-3 w-3",
                      })
                    }
                  </span>
                )}
                <span>{selectedTemplate.name}</span>
              </div>
            ) : (
              "Select template..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search templates..." />
            <CommandList>
              <CommandEmpty>No template found.</CommandEmpty>
              <CommandGroup>
                {templates?.map((template: TaskTemplate) => (
                  <CommandItem
                    key={template.id}
                    value={template.name}
                    onSelect={() => handleSelect(template)}
                  >
                    <div className="flex items-center gap-2">
                      {template.icon && (
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center",
                            template.color
                          )}
                        >
                          {
                            Icons[
                              template.icon as keyof typeof Icons
                            ]({
                              className: "h-3 w-3",
                            })
                          }
                        </span>
                      )}
                      <span>{template.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedTemplate?.id === template.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {onCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        setOpenDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {onCreate && (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Task Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for common tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <TaskTypeSelector
                  taskTypes={[]}
                  value=""
                  onChange={() => {}}
                />
              </div>
              <div className="grid gap-2">
                <TaskStatusSelector
                  statuses={[]}
                  value=""
                  onChange={() => {}}
                />
              </div>
              <div className="grid gap-2">
                <CustomFieldEditor
                  field={{
                    name: "Test",
                    type: "text",
                    required: false,
                  }}
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => {}}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
