import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Check, Plus, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Label {
  id: string
  name: string
  color: string
}

interface TaskLabelsProps {
  taskId: string
  projectId: string
  selectedLabels: Label[]
  availableLabels: Label[]
  onLabelsChange: (labels: Label[]) => void
  disabled?: boolean
}

export function TaskLabels({
  taskId,
  projectId,
  selectedLabels,
  availableLabels,
  onLabelsChange,
  disabled = false,
}: TaskLabelsProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newLabel, setNewLabel] = useState<{
    name: string
    color: string
  } | null>(null)

  const toggleLabel = (label: Label) => {
    const isSelected = selectedLabels.some((l) => l.id === label.id)
    const newLabels = isSelected
      ? selectedLabels.filter((l) => l.id !== label.id)
      : [...selectedLabels, label]
    onLabelsChange(newLabels)
  }

  const handleCreateLabel = () => {
    if (!newLabel?.name.trim()) return

    const label: Label = {
      id: crypto.randomUUID(),
      name: newLabel.name,
      color: newLabel.color || '#000000',
    }

    availableLabels.push(label)
    toggleLabel(label)
    setNewLabel(null)
  }

  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-wrap gap-2">
      {selectedLabels.map((label) => (
        <Badge
          key={label.id}
          variant="secondary"
          className="flex items-center gap-1"
          style={{
            backgroundColor: `${label.color}20`,
            color: label.color,
            borderColor: `${label.color}40`,
          }}
        >
          <span>{label.name}</span>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => toggleLabel(label)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Label
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search labels..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>
                {search && (
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground">
                      No labels found. Create a new one?
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        size="sm"
                        placeholder="Label name"
                        value={newLabel?.name || ''}
                        onChange={(e) =>
                          setNewLabel((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="color"
                        className="h-8 w-8 p-0"
                        value={newLabel?.color || '#000000'}
                        onChange={(e) =>
                          setNewLabel((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateLabel}
                        disabled={!newLabel?.name}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabels.some(
                    (l) => l.id === label.id
                  )
                  return (
                    <CommandItem
                      key={label.id}
                      onSelect={() => toggleLabel(label)}
                    >
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span>{label.name}</span>
                      {isSelected && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
